const Content = require('../models/contentModel');
const User = require('../models/userModel');
const Team = require('../models/teamModel');
const CollaborationSpace = require('../models/collaborationSpaceModel');
const mongoose = require('mongoose');
const logger = require('../config/logger');
const { 
  wrap, 
  createResourceNotFoundError, 
  createValidationError,
  createAuthorizationError,
  ErrorTypes
} = require('../middleware/errorMiddleware');

/**
 * @desc    Get all content items in a collaboration space
 * @route   GET /api/teams/:teamId/collaborationSpaces/:spaceId/content
 * @access  Private
 */
const getContentItems = wrap(async (req, res) => {
  const { teamId, spaceId } = req.params;
  const userId = req.user._id;

  // Validate team membership
  const team = await Team.findOne({ 
    _id: teamId, 
    $or: [
      { 'members.user': userId },
      { owner: userId }
    ] 
  });
  
  if (!team) {
    throw createResourceNotFoundError('Team', teamId, 
      new Error('Team not found or you are not a member')
    );
  }

  // Validate space access
  const space = await CollaborationSpace.findOne({ 
    _id: spaceId, 
    team: teamId 
  });
  
  if (!space) {
    throw createResourceNotFoundError('Collaboration space', spaceId);
  }

  // Get all content items for this space
  const contentItems = await Content.find({ 
    team: teamId, 
    collaborationSpace: spaceId,
    isDeleted: false 
  })
  .select('title description contentType status creator assignedTo createdAt updatedAt scheduledPublishDate publishedDate')
  .populate('creator', 'name email profileImage')
  .populate('assignedTo', 'name email profileImage')
  .sort({ updatedAt: -1 });

  return res.json(contentItems);
});

/**
 * @desc    Get a specific content item
 * @route   GET /api/teams/:teamId/collaborationSpaces/:spaceId/content/:contentId
 * @access  Private
 */
const getContentItem = wrap(async (req, res) => {
  const { teamId, spaceId, contentId } = req.params;
  const userId = req.user._id;

  // Check team membership
  const team = await Team.findOne({ 
    _id: teamId, 
    $or: [
      { 'members.user': userId },
      { owner: userId }
    ] 
  });
  
  if (!team) {
    throw createResourceNotFoundError('Team', teamId, 
      new Error('Team not found or you are not a member')
    );
  }

  // Get content with populated references
  const content = await Content.findOne({ 
    _id: contentId, 
    team: teamId, 
    collaborationSpace: spaceId,
    isDeleted: false 
  })
  .populate('creator', 'name email profileImage')
  .populate('assignedTo', 'name email profileImage');

  if (!content) {
    throw createResourceNotFoundError('Content', contentId);
  }

  return res.json(content);
});

/**
 * @desc    Create a new content item
 * @route   POST /api/teams/:teamId/collaborationSpaces/:spaceId/content
 * @access  Private
 */
const createContent = wrap(async (req, res) => {
  const { teamId, spaceId } = req.params;
  const { title, description, contentType } = req.body;
  const userId = req.user._id;

  // Validate title
  if (!title || title.trim() === '') {
    throw createValidationError('Title is required', {
      fields: { title: 'Required field is missing or empty' }
    });
  }

  // Check team membership and permissions
  const team = await Team.findOne({ 
    _id: teamId, 
    $or: [
      { 'members.user': userId },
      { owner: userId }
    ] 
  });
  
  if (!team) {
    throw createResourceNotFoundError('Team', teamId, 
      new Error('Team not found or you are not a member')
    );
  }

  // Check space exists
  const space = await CollaborationSpace.findOne({ 
    _id: spaceId, 
    team: teamId 
  });
  
  if (!space) {
    throw createResourceNotFoundError('Collaboration space', spaceId);
  }

  // Create content
  const content = new Content({
    title,
    description,
    contentType: contentType || 'post',
    status: 'draft',
    team: teamId,
    collaborationSpace: spaceId,
    creator: userId,
    activities: [{
      type: 'content_created',
      user: userId,
      timestamp: Date.now(),
      data: {}
    }]
  });

  const savedContent = await content.save();

  // Return the created content
  const populatedContent = await Content.findById(savedContent._id)
    .populate('creator', 'name email profileImage')
    .populate('assignedTo', 'name email profileImage');

  return res.status(201).json(populatedContent);
});

/**
 * @desc    Update content status
 * @route   PUT /api/teams/:teamId/collaborationSpaces/:spaceId/content/:contentId/status
 * @access  Private
 */
const updateContentStatus = wrap(async (req, res) => {
  const { teamId, spaceId, contentId } = req.params;
  const { status } = req.body;
  const userId = req.user._id;

  // Validate status
  const validStatuses = ['draft', 'review', 'revisions', 'approval', 'approved', 'published', 'archived'];
  if (!status || !validStatuses.includes(status)) {
    throw createValidationError('Invalid status', {
      status: `Must be one of: ${validStatuses.join(', ')}`
    });
  }

  // Get content
  const content = await Content.findOne({ 
    _id: contentId, 
    team: teamId, 
    collaborationSpace: spaceId,
    isDeleted: false 
  });

  if (!content) {
    throw createResourceNotFoundError('Content', contentId);
  }

  // Update status
  const statusUpdated = content.updateStatus(status, req.user);
  if (!statusUpdated) {
    throw createValidationError('Failed to update status', {
      currentStatus: content.status,
      requestedStatus: status
    });
  }

  await content.save();

  // Return updated content
  const updatedContent = await Content.findById(content._id)
    .populate('creator', 'name email profileImage')
    .populate('assignedTo', 'name email profileImage');

  return res.json(updatedContent);
});

/**
 * @desc    Delete content
 * @route   DELETE /api/teams/:teamId/collaborationSpaces/:spaceId/content/:contentId
 * @access  Private
 */
const deleteContent = wrap(async (req, res) => {
  const { teamId, spaceId, contentId } = req.params;
  const userId = req.user._id;

  // Get content
  const content = await Content.findOne({ 
    _id: contentId, 
    team: teamId, 
    collaborationSpace: spaceId 
  });

  if (!content) {
    throw createResourceNotFoundError('Content', contentId);
  }

  // Mark as deleted (soft delete)
  content.isDeleted = true;
  await content.save();

  return res.json({ message: 'Content deleted successfully' });
});

/**
 * @desc    Get comments for content
 * @route   GET /api/teams/:teamId/collaborationSpaces/:spaceId/content/:contentId/comments
 * @access  Private
 */
const getContentComments = wrap(async (req, res) => {
  const { teamId, spaceId, contentId } = req.params;

  // Get content
  const content = await Content.findOne({ 
    _id: contentId, 
    team: teamId, 
    collaborationSpace: spaceId,
    isDeleted: false 
  });

  if (!content) {
    throw createResourceNotFoundError('Content', contentId);
  }

  // Get comments and populate user information
  const contentWithComments = await Content.findById(content._id)
    .select('comments')
    .populate({
      path: 'comments.user',
      select: 'name email profileImage'
    });

  // Filter out deleted comments
  const comments = contentWithComments.comments
    .filter(comment => !comment.isDeleted)
    .sort((a, b) => b.timestamp - a.timestamp);

  return res.json(comments);
});

/**
 * @desc    Add a comment to content
 * @route   POST /api/teams/:teamId/collaborationSpaces/:spaceId/content/:contentId/comments
 * @access  Private
 */
const addContentComment = wrap(async (req, res) => {
  const { teamId, spaceId, contentId } = req.params;
  const { text, type } = req.body;
  const userId = req.user._id;

  // Validate comment text
  if (!text || text.trim() === '') {
    throw createValidationError('Comment text is required', {
      fields: { text: 'Required field is missing or empty' }
    });
  }

  // Get content
  const content = await Content.findOne({ 
    _id: contentId, 
    team: teamId, 
    collaborationSpace: spaceId,
    isDeleted: false 
  });

  if (!content) {
    throw createResourceNotFoundError('Content', contentId);
  }

  // Add comment
  const comment = content.addComment({ text, type }, req.user);
  await content.save();

  // Get the comment with populated user info
  const updatedContent = await Content.findById(content._id)
    .select('comments')
    .populate({
      path: 'comments.user',
      select: 'name email profileImage'
    });

  const addedComment = updatedContent.comments.id(comment._id);

  return res.status(201).json(addedComment);
});

/**
 * @desc    Delete a comment
 * @route   DELETE /api/teams/:teamId/collaborationSpaces/:spaceId/content/:contentId/comments/:commentId
 * @access  Private
 */
const deleteContentComment = wrap(async (req, res) => {
  const { teamId, spaceId, contentId, commentId } = req.params;
  const userId = req.user._id;

  // Get content
  const content = await Content.findOne({ 
    _id: contentId, 
    team: teamId, 
    collaborationSpace: spaceId,
    isDeleted: false 
  });

  if (!content) {
    throw createResourceNotFoundError('Content', contentId);
  }

  // Find comment
  const comment = content.comments.id(commentId);
  if (!comment) {
    throw createResourceNotFoundError('Comment', commentId);
  }

  // Only comment creator or content owner can delete
  if (comment.user.toString() !== userId.toString() && 
      content.creator.toString() !== userId.toString()) {
    throw createAuthorizationError('You are not authorized to delete this comment', {
      commentId,
      requestedBy: userId,
      commentCreator: comment.user,
      contentCreator: content.creator
    });
  }

  // Delete comment
  const deleted = content.deleteComment(commentId, req.user);
  if (!deleted) {
    throw createValidationError('Failed to delete comment', {
      commentId
    });
  }

  await content.save();

  return res.json({ message: 'Comment deleted successfully' });
});

/**
 * @desc    Get activity logs for content
 * @route   GET /api/teams/:teamId/collaborationSpaces/:spaceId/content/:contentId/activities
 * @access  Private
 */
const getContentActivities = wrap(async (req, res) => {
  const { teamId, spaceId, contentId } = req.params;

  // Get content
  const content = await Content.findOne({ 
    _id: contentId, 
    team: teamId, 
    collaborationSpace: spaceId,
    isDeleted: false 
  });

  if (!content) {
    throw createResourceNotFoundError('Content', contentId);
  }

  // Get activities and populate user information
  const contentWithActivities = await Content.findById(content._id)
    .select('activities')
    .populate({
      path: 'activities.user',
      select: 'name email profileImage'
    });

  const activities = contentWithActivities.activities.sort((a, b) => b.timestamp - a.timestamp);

  return res.json(activities);
});

module.exports = {
  getContentItems,
  getContentItem,
  createContent,
  updateContentStatus,
  deleteContent,
  getContentComments,
  addContentComment,
  deleteContentComment,
  getContentActivities
};
