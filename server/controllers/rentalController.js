const Rental = require('../models/rentalModel');
const Influencer = require('../models/influencerModel');
const Advertiser = require('../models/advertiserModel');
const apiKeyService = require('../utils/apiKeyService');
const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const User = require('../models/userModel');

// Socket service instance
let socketService;

// Set socket service
const setSocketService = (service) => {
  socketService = service;
};

// @desc    Create a rental request
// @route   POST /api/rentals
// @access  Private (Advertiser only)
const createRentalRequest = async (req, res) => {
  try {
    const { influencerId, socialAccountId, startDate, endDate, accessScopes, message } = req.body;
    
    // Get advertiser
    const advertiser = await Advertiser.findOne({ userId: req.user._id });
    
    if (!advertiser) {
      return res.status(404).json({
        success: false,
        message: 'Advertiser profile not found'
      });
    }
    
    // Get influencer
    const influencer = await Influencer.findById(influencerId).populate('userId', 'username');
    
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer not found'
      });
    }
    
    // Find the social account
    const socialAccount = influencer.socialAccounts.id(socialAccountId);
    
    if (!socialAccount) {
      return res.status(404).json({
        success: false,
        message: 'Social account not found'
      });
    }
    
    // Check if API key is available for rental
    if (!socialAccount.apiKey.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This API key is not available for rental'
      });
    }

    // Check if API key is valid (not expired, suspended, or revoked)
    if (!influencer.isApiKeyValid(socialAccountId)) {
      return res.status(400).json({
        success: false,
        message: 'This API key is not valid for rental'
      });
    }
    
    // Check if the API key has reached its concurrent rental limit
    const activeRentals = await Rental.countDocuments({
      influencerId,
      socialAccountId,
      status: 'active'
    });

    if (activeRentals >= socialAccount.apiKey.usageLimits.concurrentRentals) {
      return res.status(400).json({
        success: false,
        message: 'This API key has reached its concurrent rental limit'
      });
    }
    
    // Calculate rental duration in days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationInMs = end - start;
    const durationInDays = durationInMs / (1000 * 60 * 60 * 24);
    
    // Calculate rental fee
    let rentalFee = 0;
    
    if (durationInDays <= 1) {
      // Hourly rate for less than a day
      rentalFee = socialAccount.apiKey.rentalFee.hourly * (durationInDays * 24);
    } else if (durationInDays <= 7) {
      // Daily rate for less than a week
      rentalFee = socialAccount.apiKey.rentalFee.daily * durationInDays;
    } else {
      // Weekly rate for a week or more
      const weeks = Math.floor(durationInDays / 7);
      const remainingDays = durationInDays % 7;
      
      rentalFee = (weeks * socialAccount.apiKey.rentalFee.weekly) +
                 (remainingDays * socialAccount.apiKey.rentalFee.daily);
    }
    
    // Create rental with enhanced API key access fields
    const rental = await Rental.create({
      influencerId: influencer._id,
      advertiserId: advertiser._id,
      socialAccountId: socialAccount._id,
      platform: socialAccount.platform,
      status: 'pending',
      duration: {
        startDate: start,
        endDate: end
      },
      payment: {
        amount: rentalFee,
        status: 'pending'
      },
      apiKeyAccess: {
        keyId: socialAccount.apiKey.keyId,
        version: socialAccount.apiKey.version,
        expiresAt: end,
        accessScopes: accessScopes || ['all'],
        usageLimits: {
          dailyRequests: socialAccount.apiKey.usageLimits.dailyRequests,
          monthlyRequests: socialAccount.apiKey.usageLimits.monthlyRequests,
          requestsUsed: {
            daily: 0,
            monthly: 0,
            total: 0
          },
          lastResetDate: {
            daily: new Date(),
            monthly: new Date()
          }
        }
      }
    });
    
    // Create or get conversation between advertiser and influencer
    let conversation = await Conversation.findOne({
      participants: { 
        $all: [
          { userId: req.user._id, role: 'advertiser' }, 
          { userId: influencer.userId, role: 'influencer' }
        ]
      }
    });
    
    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [
          { userId: req.user._id, role: 'advertiser' },
          { userId: influencer.userId, role: 'influencer' }
        ],
        metadata: {
          rentalRequestId: rental._id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        status: 'active'
      });
    }
    
    // Create initial message about the rental
    const initialMessage = message || `Hello! I've submitted a rental request for your ${socialAccount.platform} API key from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`;
    
    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: {
        userId: req.user._id,
        userType: 'advertiser'
      },
      content: {
        type: 'text',
        text: initialMessage
      },
      metadata: {
        rentalAction: 'request_created',
        rentalId: rental._id,
        deliveredTo: [],
        readBy: []
      }
    });
    
    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: {
        text: initialMessage,
        senderId: req.user._id,
        timestamp: new Date()
      },
      updatedAt: new Date()
    });
    
    // Send real-time notification if socket service is available
    if (socketService) {
      // Get user details
      const user = await User.findById(req.user._id).select('username profile');
      
      // Prepare message for WebSocket
      const messageForSocket = {
        _id: newMessage._id,
        conversationId: conversation._id,
        sender: {
          userId: req.user._id,
          name: user.username,
          userType: 'advertiser',
          avatar: user.profile?.avatar || null
        },
        content: {
          type: 'text',
          text: initialMessage,
        },
        metadata: {
          rentalAction: 'request_created',
          rentalId: rental._id
        },
        createdAt: newMessage.createdAt
      };
      
      // Emit message to conversation participants
      socketService.io.to(`conversation:${conversation._id}`).emit('message_received', messageForSocket);
      
      // Notify influencer about new rental request
      socketService.sendSystemNotification([influencer.userId], {
        type: 'rental_request',
        title: 'New API Key Rental Request',
        message: `${user.username} has requested to rent your ${socialAccount.platform} API key.`,
        data: {
          rentalId: rental._id,
          conversationId: conversation._id
        }
      });
    }
    
    res.status(201).json({
      success: true,
      data: rental,
      conversation: {
        _id: conversation._id,
        message: newMessage._id
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all rentals for the current user
// @route   GET /api/rentals
// @access  Private
const getRentals = async (req, res) => {
  try {
    let rentals;
    
    // Get rentals based on user type
    if (req.user.userType === 'influencer') {
      const influencer = await Influencer.findOne({ userId: req.user._id });
      
      if (!influencer) {
        return res.status(404).json({
          success: false,
          message: 'Influencer profile not found'
        });
      }
      
      rentals = await Rental.find({ influencerId: influencer._id })
        .sort({ createdAt: -1 })
        .populate('advertiserId', 'userId');
    } else if (req.user.userType === 'advertiser') {
      const advertiser = await Advertiser.findOne({ userId: req.user._id });
      
      if (!advertiser) {
        return res.status(404).json({
          success: false,
          message: 'Advertiser profile not found'
        });
      }
      
      rentals = await Rental.find({ advertiserId: advertiser._id })
        .sort({ createdAt: -1 })
        .populate('influencerId', 'userId');
    }
    
    res.json({
      success: true,
      count: rentals.length,
      data: rentals
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get rental by ID
// @route   GET /api/rentals/:id
// @access  Private
const getRentalById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rental = await Rental.findById(id);
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    // Check if user is authorized to view this rental
    let isAuthorized = false;
    
    if (req.user.userType === 'influencer') {
      const influencer = await Influencer.findOne({ userId: req.user._id });
      isAuthorized = influencer && rental.influencerId.toString() === influencer._id.toString();
    } else if (req.user.userType === 'advertiser') {
      const advertiser = await Advertiser.findOne({ userId: req.user._id });
      isAuthorized = advertiser && rental.advertiserId.toString() === advertiser._id.toString();
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this rental'
      });
    }
    
    res.json({
      success: true,
      data: rental
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update rental status (approve, reject, cancel, complete)
// @route   PUT /api/rentals/:id/status
// @access  Private
const updateRentalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, message } = req.body;
    
    const rental = await Rental.findById(id)
      .populate('influencerId', 'userId socialAccounts')
      .populate('advertiserId', 'userId');
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    // Check if user is authorized to update this rental
    let isAuthorized = false;
    let isInfluencer = false;
    
    if (req.user.userType === 'influencer') {
      const influencer = await Influencer.findOne({ userId: req.user._id });
      isAuthorized = influencer && rental.influencerId._id.toString() === influencer._id.toString();
      isInfluencer = true;
    } else if (req.user.userType === 'advertiser') {
      const advertiser = await Advertiser.findOne({ userId: req.user._id });
      isAuthorized = advertiser && rental.advertiserId._id.toString() === advertiser._id.toString();
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this rental'
      });
    }
    
    // Store old status for comparison
    const oldStatus = rental.status;
    const oldPaymentStatus = rental.payment.status;
    
    // Validate status transitions
    if (status) {
      // Influencers can approve or reject pending rentals
      if (isInfluencer && rental.status === 'pending' && ['approved', 'rejected'].includes(status)) {
        rental.status = status;
        
        // If approved, generate temporary API key
        if (status === 'approved') {
          // Get the influencer and social account
          const socialAccount = rental.influencerId.socialAccounts.id(rental.socialAccountId);
          
          if (!socialAccount) {
            return res.status(404).json({
              success: false,
              message: 'Social account not found'
            });
          }
          
          // Get the API key (this will be encrypted)
          const encryptedApiKey = socialAccount.apiKey.key;
          
          // Decrypt the API key
          const decryptedApiKey = apiKeyService.decryptApiKey(encryptedApiKey);
          
          // Set the temporary key and expiration
          rental.apiKeyAccess.temporaryKey = apiKeyService.encryptApiKey(decryptedApiKey);
          rental.apiKeyAccess.expiresAt = rental.duration.endDate;
          
          // Mark the API key as unavailable if it's reached its concurrent rental limit
          const activeRentals = await Rental.countDocuments({
            influencerId: rental.influencerId._id,
            socialAccountId: rental.socialAccountId,
            status: 'active'
          });
          
          if (activeRentals + 1 >= socialAccount.apiKey.usageLimits.concurrentRentals) {
            socialAccount.apiKey.isAvailable = false;
            await rental.influencerId.save();
          }
        }
      }
      // Advertisers can cancel active rentals
      else if (!isInfluencer && rental.status === 'active' && status === 'cancelled') {
        rental.status = status;
        
        // Make the API key available again if needed
        await updateApiKeyAvailability(rental.influencerId._id, rental.socialAccountId);
      }
      // Both can mark rentals as completed
      else if (rental.status === 'active' && status === 'completed') {
        rental.status = status;
        
        // Make the API key available again if needed
        await updateApiKeyAvailability(rental.influencerId._id, rental.socialAccountId);
      }
      else {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${rental.status} to ${status}`
        });
      }
    }
    
    // Update payment status if provided
    if (paymentStatus) {
      rental.payment.status = paymentStatus;
      
      // If payment is completed and rental is approved, set rental to active
      if (paymentStatus === 'completed' && rental.status === 'approved') {
        rental.status = 'active';
      }
    }
    
    // Save updated rental
    await rental.save();
    
    // Find conversation related to this rental
    const conversation = await Conversation.findOne({
      'metadata.rentalRequestId': rental._id
    });
    
    if (conversation) {
      // Create a status update message
      let statusMessage = '';
      let rentalAction = '';
      
      if (status && status !== oldStatus) {
        // Status changed
        if (status === 'approved') {
          statusMessage = message || `I've approved your API key rental request. Please complete the payment to activate the rental.`;
          rentalAction = 'request_approved';
        } else if (status === 'rejected') {
          statusMessage = message || `I'm sorry, but I've declined your API key rental request.`;
          rentalAction = 'request_rejected';
        } else if (status === 'active') {
          statusMessage = message || `Your API key rental is now active! You can now access the API key.`;
          rentalAction = 'rental_activated';
        } else if (status === 'completed') {
          statusMessage = message || `The API key rental has been completed. Thank you for using our platform!`;
          rentalAction = 'rental_completed';
        } else if (status === 'cancelled') {
          statusMessage = message || `The API key rental has been cancelled.`;
          rentalAction = 'rental_cancelled';
        }
      } else if (paymentStatus && paymentStatus !== oldPaymentStatus) {
        // Payment status changed
        if (paymentStatus === 'completed') {
          statusMessage = message || `Payment for the API key rental has been completed. The rental is now active.`;
          rentalAction = 'payment_completed';
        } else if (paymentStatus === 'refunded') {
          statusMessage = message || `Payment for the API key rental has been refunded.`;
          rentalAction = 'payment_refunded';
        }
      }
      
      if (statusMessage) {
        // Create the message
        const newMessage = await Message.create({
          conversationId: conversation._id,
          sender: {
            userId: req.user._id,
            userType: req.user.userType
          },
          content: {
            type: 'text',
            text: statusMessage
          },
          metadata: {
            rentalAction,
            rentalId: rental._id,
            deliveredTo: [],
            readBy: []
          }
        });
        
        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversation._id, {
          lastMessage: {
            text: statusMessage,
            senderId: req.user._id,
            timestamp: new Date()
          },
          updatedAt: new Date()
        });
        
        // Send real-time notification if socket service is available
        if (socketService) {
          // Get user details
          const user = await User.findById(req.user._id).select('username profile');
          
          // Prepare message for WebSocket
          const messageForSocket = {
            _id: newMessage._id,
            conversationId: conversation._id,
            sender: {
              userId: req.user._id,
              name: user.username,
              userType: req.user.userType,
              avatar: user.profile?.avatar || null
            },
            content: {
              type: 'text',
              text: statusMessage,
            },
            metadata: {
              rentalAction,
              rentalId: rental._id
            },
            createdAt: newMessage.createdAt
          };
          
          // Emit message to conversation participants
          socketService.io.to(`conversation:${conversation._id}`).emit('message_received', messageForSocket);
          
          // Emit rental status change event
          socketService.io.to(`conversation:${conversation._id}`).emit('rental_status_changed', {
            rentalId: rental._id,
            oldStatus,
            newStatus: status || rental.status,
            oldPaymentStatus,
            newPaymentStatus: paymentStatus || rental.payment.status,
            action: rentalAction
          });
          
          // Determine recipient for notification
          const recipientId = isInfluencer ? rental.advertiserId.userId : rental.influencerId.userId;
          
          // Send system notification
          socketService.sendSystemNotification([recipientId], {
            type: 'rental_update',
            title: `Rental ${rentalAction.replace('_', ' ')}`,
            message: statusMessage,
            data: {
              rentalId: rental._id,
              conversationId: conversation._id,
              status: rental.status,
              paymentStatus: rental.payment.status
            }
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: rental
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to update API key availability
const updateApiKeyAvailability = async (influencerId, socialAccountId) => {
  const influencer = await Influencer.findById(influencerId);
  if (!influencer) return;
  
  const socialAccount = influencer.socialAccounts.id(socialAccountId);
  if (!socialAccount) return;
  
  // Count active rentals for this API key
  const activeRentals = await Rental.countDocuments({
    influencerId,
    socialAccountId,
    status: 'active'
  });
  
  // If active rentals are less than the concurrent limit, make the API key available
  if (activeRentals < socialAccount.apiKey.usageLimits.concurrentRentals) {
    socialAccount.apiKey.isAvailable = true;
    await influencer.save();
  }
};

// @desc    Get API key for a rental
// @route   GET /api/rentals/:id/api-key
// @access  Private (Advertiser only)
const getRentalApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only advertisers can access API keys
    if (req.user.userType !== 'advertiser') {
      return res.status(403).json({
        success: false,
        message: 'Only advertisers can access API keys'
      });
    }
    
    const advertiser = await Advertiser.findOne({ userId: req.user._id });
    
    if (!advertiser) {
      return res.status(404).json({
        success: false,
        message: 'Advertiser profile not found'
      });
    }
    
    // Get rental with API key
    const rental = await Rental.findById(id).select('+apiKeyAccess.temporaryKey');
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    // Check if advertiser is authorized to access this rental
    if (rental.advertiserId.toString() !== advertiser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this rental'
      });
    }
    
    // Check if rental is active
    if (rental.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'API key is only available for active rentals'
      });
    }
    
    // Check if payment is completed
    if (rental.payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be completed to access API key'
      });
    }
    
    // Check if API key has expired
    if (new Date() > new Date(rental.apiKeyAccess.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'API key has expired'
      });
    }
    
    // Decrypt the API key
    const apiKey = apiKeyService.decryptApiKey(rental.apiKeyAccess.temporaryKey);
    
    // Track this API key access
    await apiKeyService.trackApiKeyUsage(rental._id, '/api/rentals/:id/api-key', 200);
    
    // Get usage limits
    const usageLimits = await apiKeyService.checkApiKeyUsageLimits(rental._id);
    
    res.json({
      success: true,
      data: {
        apiKey,
        keyId: rental.apiKeyAccess.keyId,
        platform: rental.platform,
        expiresAt: rental.apiKeyAccess.expiresAt,
        accessScopes: rental.apiKeyAccess.accessScopes,
        usageLimits
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get API key usage statistics
// @route   GET /api/rentals/:id/usage
// @access  Private
const getApiKeyUsage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rental = await Rental.findById(id);
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    // Check if user is authorized to view this rental
    let isAuthorized = false;
    
    if (req.user.userType === 'influencer') {
      const influencer = await Influencer.findOne({ userId: req.user._id });
      isAuthorized = influencer && rental.influencerId.toString() === influencer._id.toString();
    } else if (req.user.userType === 'advertiser') {
      const advertiser = await Advertiser.findOne({ userId: req.user._id });
      isAuthorized = advertiser && rental.advertiserId.toString() === advertiser._id.toString();
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this rental'
      });
    }
    
    // Get usage statistics
    const usageLimits = await apiKeyService.checkApiKeyUsageLimits(rental._id);
    
    // Get usage history (last 100 requests)
    const usageHistory = rental.apiKeyAccess.usageHistory || [];
    const recentHistory = usageHistory.slice(-100);
    
    // Group usage by day for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const dailyUsage = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const count = usageHistory.filter(usage => {
        const usageDate = new Date(usage.date);
        return usageDate.getDate() === day && 
               usageDate.getMonth() === month && 
               usageDate.getFullYear() === year;
      }).length;
      
      dailyUsage.unshift({
        date: date.toISOString().split('T')[0],
        count
      });
    }
    
    res.json({
      success: true,
      data: {
        usageLimits,
        recentHistory,
        dailyUsage
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Track API key usage
// @route   POST /api/rentals/:id/track-usage
// @access  Private (Advertiser only)
const trackApiKeyUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const { endpoint, statusCode } = req.body;
    
    // Only advertisers can track API key usage
    if (req.user.userType !== 'advertiser') {
      return res.status(403).json({
        success: false,
        message: 'Only advertisers can track API key usage'
      });
    }
    
    const advertiser = await Advertiser.findOne({ userId: req.user._id });
    
    if (!advertiser) {
      return res.status(404).json({
        success: false,
        message: 'Advertiser profile not found'
      });
    }
    
    const rental = await Rental.findById(id);
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    // Check if advertiser is authorized to access this rental
    if (rental.advertiserId.toString() !== advertiser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this rental'
      });
    }
    
    // Track API key usage
    await apiKeyService.trackApiKeyUsage(rental._id, endpoint, statusCode);
    
    // Get updated usage limits
    const usageLimits = await apiKeyService.checkApiKeyUsageLimits(rental._id);
    
    // Notify the influencer about high usage if reaching near limits
    if (socketService) {
      const dailyPercentage = (usageLimits.requestsUsed.daily / usageLimits.dailyRequests) * 100;
      const monthlyPercentage = (usageLimits.requestsUsed.monthly / usageLimits.monthlyRequests) * 100;
      
      if (dailyPercentage >= 80 || monthlyPercentage >= 80) {
        // Get influencer to notify
        const influencer = await Influencer.findById(rental.influencerId);
        
        if (influencer) {
          socketService.sendSystemNotification([influencer.userId], {
            type: 'api_usage_alert',
            title: 'API Usage Alert',
            message: `Your API key for rental #${rental._id} is reaching its usage limits: ${Math.floor(dailyPercentage)}% of daily and ${Math.floor(monthlyPercentage)}% of monthly limit used.`,
            data: {
              rentalId: rental._id,
              usageLimits
            }
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        usageLimits
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createRentalRequest,
  getRentals,
  getRentalById,
  updateRentalStatus,
  getRentalApiKey,
  getApiKeyUsage,
  trackApiKeyUsage,
  setSocketService
};
