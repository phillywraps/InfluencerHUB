const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rentalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  response: {
    content: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure one review per rental
reviewSchema.index({ reviewerId: 1, rentalId: 1 }, { unique: true });

// Method to add a response to a review
reviewSchema.methods.addResponse = function(content) {
  this.response = {
    content,
    createdAt: Date.now()
  };
  return this.save();
};

// Static method to calculate average rating for a user
reviewSchema.statics.calculateAverageRating = async function(userId) {
  const result = await this.aggregate([
    { $match: { reviewedId: mongoose.Types.ObjectId(userId) } },
    { $group: {
        _id: '$reviewedId',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 
    ? { average: result[0].averageRating, count: result[0].count }
    : { average: 0, count: 0 };
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
