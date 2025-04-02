import teamService from './teamService';

/**
 * Extended Team Service with additional aliases for Content Approval Workflow
 * This provides simplified method names that match those used in our components
 */
const teamServiceExtended = {
  // Pass through all existing teamService methods
  ...teamService,

  // Content approval workflow method aliases
  // These provide simpler names that match what we use in components
  
  // Get all content items in a space
  getContents: (teamId, spaceId) => teamService.getCollaborationSpaceContent(teamId, spaceId),
  
  // Get a single content item by ID
  getContent: (teamId, spaceId, contentId) => teamService.getCollaborationContent(teamId, spaceId, contentId),
  
  // Create a new content item
  createContent: (teamId, spaceId, contentData) => teamService.createCollaborationContent(teamId, spaceId, contentData),
  
  // Delete a content item
  deleteContent: (teamId, spaceId, contentId) => teamService.deleteCollaborationContent(teamId, spaceId, contentId),
  
  // Update content status (wrapper method with simpler parameters)
  updateContentStatus: (teamId, spaceId, contentId, newStatus) => {
    return teamService.updateContentStatus(teamId, spaceId, contentId, { status: newStatus });
  },
  
  // Get comments for a content item (simple alias)
  getContentComments: teamService.getContentComments,
  
  // Add a comment to a content item (simple alias)
  addContentComment: teamService.addContentComment,
  
  // Delete a comment from a content item (simple alias)
  deleteContentComment: teamService.deleteContentComment,
  
  // Get activity history for a content item (simple alias)
  getContentActivities: teamService.getContentActivities
};

export default teamServiceExtended;
