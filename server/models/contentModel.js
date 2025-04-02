const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Comment Schema
 */
const CommentSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['general', 'revision', 'approval', 'rejection'],
    default: 'general'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

/**
 * Activity Schema
 */
const ActivitySchema = new Schema({
  type: {
    type: String,
    enum: ['status_change', 'comment_added', 'comment_deleted', 'content_updated', 'content_created'],
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  data: {
    type: Schema.Types.Mixed
  }
});

/**
 * Content Schema
 */
const ContentSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  contentType: {
    type: String,
    enum: ['post', 'campaign', 'story', 'video', 'reel', 'tweet', 'other'],
    default: 'post'
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'revisions', 'approval', 'approved', 'published', 'archived'],
    default: 'draft'
  },
  team: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  collaborationSpace: {
    type: Schema.Types.ObjectId,
    ref: 'CollaborationSpace',
    required: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [CommentSchema],
  activities: [ActivitySchema],
  metadata: {
    type: Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  scheduledPublishDate: {
    type: Date
  },
  publishedDate: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

// Update timestamps on save
ContentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add activity log on status change
ContentSchema.pre('save', function(next) {
  const content = this;
  if (content.isModified('status') && !content.isNew) {
    const activity = {
      type: 'status_change',
      user: content.creator, // This will need to be updated to the current user
      timestamp: Date.now(),
      data: {
        fromStatus: content._original ? content._original.status : null,
        toStatus: content.status
      }
    };
    content.activities.push(activity);
  }
  next();
});

// Store original values before saving
ContentSchema.pre('save', function(next) {
  if (this.isNew) return next();
  
  this._original = this.toObject();
  next();
});

// Helper methods
ContentSchema.methods = {
  /**
   * Add a comment to content
   * @param {Object} comment - Comment data
   * @param {Object} user - User adding the comment
   * @returns {Object} - Added comment
   */
  addComment(comment, user) {
    const newComment = {
      text: comment.text,
      type: comment.type || 'general',
      user: user._id,
      timestamp: Date.now()
    };
    
    this.comments.push(newComment);
    
    // Add activity log
    this.activities.push({
      type: 'comment_added',
      user: user._id,
      timestamp: Date.now(),
      data: {
        commentId: newComment._id,
        commentType: newComment.type
      }
    });
    
    return newComment;
  },
  
  /**
   * Delete a comment
   * @param {String} commentId - Comment ID
   * @param {Object} user - User deleting the comment
   * @returns {Boolean} - Success status
   */
  deleteComment(commentId, user) {
    const comment = this.comments.id(commentId);
    if (!comment) return false;
    
    comment.isDeleted = true;
    
    // Add activity log
    this.activities.push({
      type: 'comment_deleted',
      user: user._id,
      timestamp: Date.now(),
      data: {
        commentId: comment._id
      }
    });
    
    return true;
  },
  
  /**
   * Update content status
   * @param {String} newStatus - New status
   * @param {Object} user - User updating the status
   * @returns {Boolean} - Success status
   */
  updateStatus(newStatus, user) {
    const validStatuses = ['draft', 'review', 'revisions', 'approval', 'approved', 'published', 'archived'];
    if (!validStatuses.includes(newStatus)) return false;
    
    const oldStatus = this.status;
    this.status = newStatus;
    
    // Add activity log
    this.activities.push({
      type: 'status_change',
      user: user._id,
      timestamp: Date.now(),
      data: {
        fromStatus: oldStatus,
        toStatus: newStatus
      }
    });
    
    return true;
  }
};

module.exports = mongoose.model('Content', ContentSchema);
