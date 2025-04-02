/**
 * Mock Data Generators for No-MongoDB Mode
 * This file contains functions to generate realistic mock data for API responses
 */

// Helper to generate a random integer within a range
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to get a random element from an array
const randomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Helper to generate a random date in the last n days
const randomDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, days));
  return date.toISOString();
};

// Generate a mock user
const generateUser = (id = null) => {
  const roles = ['influencer', 'advertiser', 'admin'];
  const userId = id || `user_${randomInt(1000, 9999)}`;
  
  return {
    _id: userId,
    name: `User ${userId.substring(5)}`,
    email: `user${userId.substring(5)}@example.com`,
    role: randomElement(roles),
    avatar: `https://randomuser.me/api/portraits/${randomInt(0, 1) ? 'men' : 'women'}/${randomInt(1, 99)}.jpg`,
    isVerified: Math.random() > 0.2,
    twoFactorEnabled: Math.random() > 0.7,
    createdAt: randomDate(365),
    updatedAt: randomDate(30)
  };
};

// Generate a mock influencer profile
const generateInfluencerProfile = (userId = null) => {
  const id = userId || `user_${randomInt(1000, 9999)}`;
  const platformTypes = ['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin', 'pinterest', 'snapchat'];
  const categories = ['fashion', 'beauty', 'fitness', 'travel', 'food', 'technology', 'gaming', 'lifestyle'];
  
  const socialAccounts = [];
  const accountCount = randomInt(1, 4);
  
  for (let i = 0; i < accountCount; i++) {
    const platform = platformTypes[i % platformTypes.length];
    socialAccounts.push({
      _id: `acc_${randomInt(1000, 9999)}`,
      platform,
      username: `${platform}user${randomInt(100, 999)}`,
      followers: randomInt(1000, 1000000),
      engagement: randomInt(1, 10) / 10,
      apiKeyEnabled: Math.random() > 0.3,
      apiKeyId: `key_${randomInt(1000, 9999)}`,
      lastRotated: randomDate(30),
      autoRotation: Math.random() > 0.5,
      rotationInterval: randomElement([7, 14, 30, 90]),
      verified: Math.random() > 0.2
    });
  }
  
  return {
    _id: id,
    userId: id,
    bio: `I'm an influencer specializing in ${randomElement(categories)} and ${randomElement(categories)}.`,
    categories: Array.from(new Set([randomElement(categories), randomElement(categories), randomElement(categories)])),
    location: randomElement(['New York', 'Los Angeles', 'Miami', 'London', 'Paris', 'Tokyo', 'Berlin']),
    website: `https://www.${id.replace('_', '')}.com`,
    socialAccounts,
    ratingAverage: Math.round((randomInt(30, 50) / 10) * 10) / 10, // 3.0 to 5.0
    ratingCount: randomInt(0, 100),
    featured: Math.random() > 0.8,
    trending: Math.random() > 0.9,
    pricing: {
      hourly: randomInt(50, 500),
      daily: randomInt(200, 2000),
      weekly: randomInt(1000, 10000),
      monthly: randomInt(5000, 50000)
    },
    createdAt: randomDate(365),
    updatedAt: randomDate(30)
  };
};

// Generate a mock advertiser profile
const generateAdvertiserProfile = (userId = null) => {
  const id = userId || `user_${randomInt(1000, 9999)}`;
  const industries = ['retail', 'technology', 'healthcare', 'education', 'finance', 'entertainment', 'food', 'automotive'];
  
  const paymentMethods = [];
  const methodCount = randomInt(1, 3);
  
  for (let i = 0; i < methodCount; i++) {
    const types = ['credit_card', 'paypal', 'bank_account', 'crypto'];
    const type = types[i % types.length];
    
    paymentMethods.push({
      _id: `pm_${randomInt(1000, 9999)}`,
      type,
      isDefault: i === 0,
      lastUsed: randomDate(30),
      // Type-specific information
      ...(type === 'credit_card' && {
        last4: `${randomInt(1000, 9999)}`,
        brand: randomElement(['visa', 'mastercard', 'amex']),
        expMonth: randomInt(1, 12),
        expYear: new Date().getFullYear() + randomInt(1, 5)
      }),
      ...(type === 'paypal' && {
        email: `paypal${randomInt(100, 999)}@example.com`
      }),
      ...(type === 'bank_account' && {
        last4: `${randomInt(1000, 9999)}`,
        bankName: randomElement(['Chase', 'Bank of America', 'Wells Fargo', 'Citibank'])
      }),
      ...(type === 'crypto' && {
        currency: randomElement(['BTC', 'ETH', 'USDC'])
      })
    });
  }
  
  return {
    _id: id,
    userId: id,
    companyName: `${randomElement(['Global', 'Tech', 'Creative', 'Digital', 'Smart'])} ${randomElement(['Solutions', 'Media', 'Innovations', 'Systems', 'Partners'])}`,
    industry: randomElement(industries),
    description: `We are a leading company in the ${randomElement(industries)} industry.`,
    website: `https://www.${id.replace('_', '')}.com`,
    size: randomElement(['1-10', '11-50', '51-200', '201-1000', '1000+']),
    location: randomElement(['New York', 'San Francisco', 'London', 'Tokyo', 'Berlin', 'Sydney']),
    logo: `https://via.placeholder.com/150?text=${id.substring(5)}`,
    verified: Math.random() > 0.2,
    paymentMethods,
    createdAt: randomDate(365),
    updatedAt: randomDate(30)
  };
};

// Generate a mock rental
const generateRental = (id = null, influencerId = null, advertiserId = null) => {
  const rentalId = id || `rental_${randomInt(1000, 9999)}`;
  const infId = influencerId || `user_${randomInt(1000, 9999)}`;
  const advId = advertiserId || `user_${randomInt(1000, 9999)}`;
  const platforms = ['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin', 'pinterest', 'snapchat'];
  const platform = randomElement(platforms);
  const statuses = ['pending', 'active', 'expired', 'cancelled', 'rejected'];
  const durations = [1, 7, 30, 90];
  const duration = randomElement(durations);
  
  // Calculate dates
  const startDate = new Date(randomDate(30));
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + duration);
  
  return {
    _id: rentalId,
    influencerId: infId,
    advertiserId: advId,
    platform,
    apiKeyId: `key_${randomInt(1000, 9999)}`,
    status: randomElement(statuses),
    duration,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    cost: randomInt(100, 5000),
    limits: {
      requestsPerDay: randomInt(100, 10000),
      maxConcurrent: randomInt(5, 50)
    },
    usage: {
      totalRequests: randomInt(0, 5000),
      lastUsed: randomDate(7)
    },
    paymentId: `pay_${randomInt(1000, 9999)}`,
    createdAt: randomDate(30),
    updatedAt: randomDate(7)
  };
};

// Generate a mock conversation
const generateConversation = (id = null, user1Id = null, user2Id = null) => {
  const convId = id || `conv_${randomInt(1000, 9999)}`;
  const u1 = user1Id || `user_${randomInt(1000, 9999)}`;
  const u2 = user2Id || `user_${randomInt(1000, 9999)}`;
  
  return {
    _id: convId,
    participants: [
      {
        userId: u1,
        userType: Math.random() > 0.5 ? 'influencer' : 'advertiser',
        joinedAt: randomDate(30)
      },
      {
        userId: u2,
        userType: Math.random() > 0.5 ? 'influencer' : 'advertiser',
        joinedAt: randomDate(30)
      }
    ],
    lastMessage: {
      text: randomElement([
        'Hey, interested in working together!',
        'Let me know when you\'re free to chat',
        'What are your rates?',
        'Thanks for the info!',
        'I\'ll get back to you soon'
      ]),
      senderId: Math.random() > 0.5 ? u1 : u2,
      timestamp: randomDate(3)
    },
    createdAt: randomDate(30),
    updatedAt: randomDate(3)
  };
};

// Generate a mock message
const generateMessage = (id = null, conversationId = null, senderId = null) => {
  const msgId = id || `msg_${randomInt(1000, 9999)}`;
  const convId = conversationId || `conv_${randomInt(1000, 9999)}`;
  const sender = senderId || `user_${randomInt(1000, 9999)}`;
  
  const contentTypes = ['text', 'image', 'document', 'link'];
  const contentType = randomElement(contentTypes);
  
  return {
    _id: msgId,
    conversationId: convId,
    sender: {
      userId: sender,
      userType: Math.random() > 0.5 ? 'influencer' : 'advertiser'
    },
    content: {
      type: contentType,
      text: randomElement([
        'Hey there! Interested in a collaboration?',
        'What are your rates for a weekly campaign?',
        'I think your audience would be perfect for our product',
        'Can we discuss the details of the project?',
        'Thanks for the information, I\'ll review it',
        'Let me know if you have any other questions'
      ]),
      ...(contentType === 'image' && {
        attachments: [{
          url: 'https://via.placeholder.com/500',
          type: 'image',
          name: 'proposal.jpg'
        }]
      }),
      ...(contentType === 'document' && {
        attachments: [{
          url: 'https://example.com/doc.pdf',
          type: 'document',
          name: 'contract.pdf'
        }]
      }),
      ...(contentType === 'link' && {
        attachments: [{
          url: 'https://example.com',
          type: 'link',
          preview: 'Example Website'
        }]
      })
    },
    metadata: {
      deliveredTo: [
        {
          userId: `user_${randomInt(1000, 9999)}`,
          timestamp: randomDate(2)
        }
      ],
      readBy: Math.random() > 0.3 ? [
        {
          userId: `user_${randomInt(1000, 9999)}`,
          timestamp: randomDate(1)
        }
      ] : [],
      ...(Math.random() > 0.9 && {
        rentalId: `rental_${randomInt(1000, 9999)}`,
        rentalAction: randomElement(['requested', 'accepted', 'declined', 'modified'])
      })
    },
    createdAt: randomDate(7),
    updatedAt: randomDate(1)
  };
};

// Generate a mock review
const generateReview = (id = null, reviewerId = null, revieweeId = null) => {
  const reviewId = id || `review_${randomInt(1000, 9999)}`;
  const reviewer = reviewerId || `user_${randomInt(1000, 9999)}`;
  const reviewee = revieweeId || `user_${randomInt(1000, 9999)}`;
  
  return {
    _id: reviewId,
    reviewer: {
      userId: reviewer,
      userType: Math.random() > 0.5 ? 'influencer' : 'advertiser'
    },
    reviewee: {
      userId: reviewee,
      userType: Math.random() > 0.5 ? 'influencer' : 'advertiser'
    },
    rating: randomInt(1, 5),
    title: randomElement([
      'Great experience!',
      'Professional and timely',
      'Easy to work with',
      'Would recommend',
      'Not as expected',
      'Excellent communication'
    ]),
    content: randomElement([
      'Working together was a smooth experience. Very professional.',
      'Communication was clear and the results exceeded expectations.',
      'The collaboration went well, though there were some delays.',
      'Very satisfied with the outcomes of our partnership.',
      'Met all the requirements and was easy to work with.',
      'Great partnership, looking forward to working together again.'
    ]),
    response: Math.random() > 0.6 ? {
      content: randomElement([
        'Thank you for your kind review!',
        'Appreciate the feedback, it was a pleasure working with you too.',
        'Thanks for the opportunity to collaborate.',
        'Glad you had a positive experience!'
      ]),
      createdAt: randomDate(5)
    } : null,
    rentalId: `rental_${randomInt(1000, 9999)}`,
    reported: Math.random() > 0.95,
    reportReason: Math.random() > 0.95 ? 'Inappropriate content' : null,
    createdAt: randomDate(90),
    updatedAt: randomDate(5)
  };
};

// Generate a mock api key
const generateApiKey = (id = null, ownerId = null) => {
  const keyId = id || `key_${randomInt(1000, 9999)}`;
  const owner = ownerId || `user_${randomInt(1000, 9999)}`;
  
  return {
    _id: keyId,
    ownerId: owner,
    platform: randomElement(['tiktok', 'instagram', 'youtube', 'twitter']),
    key: `${Math.random().toString(36).substring(2, 15)}.${Math.random().toString(36).substring(2, 15)}`,
    isActive: Math.random() > 0.1,
    lastRotated: randomDate(30),
    nextRotation: randomDate(-30), // Future date
    autoRotation: Math.random() > 0.3,
    rotationInterval: randomElement([7, 14, 30, 90]),
    securitySettings: {
      ipRestriction: Math.random() > 0.7,
      allowedIps: Math.random() > 0.7 ? ['192.168.1.1', '10.0.0.1'] : [],
      rateLimit: randomInt(100, 10000),
      webhookNotifications: Math.random() > 0.6
    },
    usageStats: {
      totalRequests: randomInt(0, 100000),
      lastUsed: randomDate(3),
      dailyAverage: randomInt(10, 1000)
    },
    createdAt: randomDate(180),
    updatedAt: randomDate(30)
  };
};

// Generate mock TikTok analytics data
const generateTikTokAnalytics = () => {
  const now = new Date();
  const days = 30;
  const dataPoints = [];
  
  // Generate daily data
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    dataPoints.push({
      date: date.toISOString().split('T')[0],
      followers: 10000 - randomInt(0, 100) * i,
      views: randomInt(5000, 20000),
      likes: randomInt(1000, 5000),
      comments: randomInt(50, 500),
      shares: randomInt(20, 200)
    });
  }
  
  return {
    overview: {
      totalFollowers: 10000,
      followerGrowth: randomInt(50, 500),
      growthPercentage: randomInt(1, 10) / 100,
      averageViews: randomInt(5000, 15000),
      averageLikes: randomInt(500, 5000),
      averageComments: randomInt(50, 500),
      averageShares: randomInt(10, 200),
      engagementRate: randomInt(1, 15) / 100
    },
    audience: {
      demographics: {
        ageGroups: [
          { range: '13-17', percentage: randomInt(5, 20) },
          { range: '18-24', percentage: randomInt(20, 40) },
          { range: '25-34', percentage: randomInt(20, 30) },
          { range: '35-44', percentage: randomInt(5, 15) },
          { range: '45+', percentage: randomInt(1, 10) }
        ],
        genderSplit: {
          male: randomInt(20, 80),
          female: randomInt(20, 80),
          other: randomInt(0, 5)
        },
        topCountries: [
          { name: 'United States', percentage: randomInt(20, 60) },
          { name: 'United Kingdom', percentage: randomInt(5, 15) },
          { name: 'Canada', percentage: randomInt(5, 15) },
          { name: 'Australia', percentage: randomInt(2, 10) },
          { name: 'Germany', percentage: randomInt(2, 8) }
        ]
      },
      interests: [
        { category: 'Entertainment', percentage: randomInt(40, 80) },
        { category: 'Music', percentage: randomInt(30, 70) },
        { category: 'Fashion', percentage: randomInt(20, 60) },
        { category: 'Sports', percentage: randomInt(10, 50) },
        { category: 'Travel', percentage: randomInt(5, 40) }
      ]
    },
    content: {
      topVideos: Array.from({ length: 5 }, (_, i) => ({
        id: `video${i + 1}`,
        title: `Example TikTok Video ${i + 1}`,
        views: randomInt(10000, 1000000),
        likes: randomInt(1000, 100000),
        comments: randomInt(100, 10000),
        shares: randomInt(50, 5000),
        postDate: randomDate(90)
      })),
      bestPerformingCategories: [
        { category: 'Dance', percentage: randomInt(10, 40) },
        { category: 'Comedy', percentage: randomInt(10, 40) },
        { category: 'Tutorial', percentage: randomInt(5, 30) },
        { category: 'Reaction', percentage: randomInt(5, 30) }
      ]
    },
    growthTrends: {
      daily: dataPoints,
      weeklyGrowth: Array.from({ length: 4 }, (_, i) => ({
        week: `Week ${i + 1}`,
        followers: randomInt(50, 500),
        views: randomInt(1000, 50000),
        engagement: randomInt(1, 10) / 100
      }))
    },
    apiCallUsage: {
      total: randomInt(100, 10000),
      remaining: randomInt(10, 1000),
      resetDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() + randomInt(1, 30));
        return date.toISOString();
      })()
    }
  };
};

// Generate lists of mock data
const generateMockData = () => {
  const users = Array.from({ length: 10 }, () => generateUser());
  const influencers = users
    .filter(user => user.role === 'influencer')
    .map(user => generateInfluencerProfile(user._id));
  
  const advertisers = users
    .filter(user => user.role === 'advertiser')
    .map(user => generateAdvertiserProfile(user._id));
  
  // Generate rentals between influencers and advertisers
  const rentals = [];
  influencers.forEach(influencer => {
    advertisers.forEach(advertiser => {
      if (Math.random() > 0.7) {
        rentals.push(generateRental(null, influencer._id, advertiser._id));
      }
    });
  });
  
  // Generate conversations between users
  const conversations = [];
  users.forEach((user1, i) => {
    users.slice(i + 1).forEach(user2 => {
      if (Math.random() > 0.7) {
        conversations.push(generateConversation(null, user1._id, user2._id));
      }
    });
  });
  
  // Generate messages for conversations
  const messages = [];
  conversations.forEach(conversation => {
    const messageCount = randomInt(3, 15);
    for (let i = 0; i < messageCount; i++) {
      const sender = randomElement(conversation.participants).userId;
      messages.push(generateMessage(null, conversation._id, sender));
    }
  });
  
  // Generate reviews
  const reviews = [];
  rentals.forEach(rental => {
    if (Math.random() > 0.5) {
      reviews.push(generateReview(null, rental.advertiserId, rental.influencerId));
    }
    if (Math.random() > 0.7) {
      reviews.push(generateReview(null, rental.influencerId, rental.advertiserId));
    }
  });
  
  // Generate API keys
  const apiKeys = [];
  influencers.forEach(influencer => {
    influencer.socialAccounts.forEach(account => {
      if (account.apiKeyEnabled) {
        apiKeys.push(generateApiKey(account.apiKeyId, influencer._id));
      }
    });
  });
  
  return {
    users,
    influencers,
    advertisers,
    rentals,
    conversations,
    messages,
    reviews,
    apiKeys,
    tiktokAnalytics: generateTikTokAnalytics()
  };
};

module.exports = {
  generateUser,
  generateInfluencerProfile,
  generateAdvertiserProfile,
  generateRental,
  generateConversation,
  generateMessage,
  generateReview,
  generateApiKey,
  generateTikTokAnalytics,
  generateMockData
};
