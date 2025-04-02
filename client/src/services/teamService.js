import api from './api';
import localStorageService from './localStorageService';

// Cache keys
const CACHE_KEYS = {
  USER_TEAMS: 'user_teams',
  TEAM_MEMBERS: 'team_members',
  COLLABORATION_SPACES: 'collaboration_spaces',
};

// Cache expiration (1 hour)
const CACHE_EXPIRATION = 1000 * 60 * 60;

/**
 * Team Service
 * 
 * Manages team operations, collaboration spaces, and team-based workflows:
 * - Team CRUD operations
 * - Member management
 * - Collaboration spaces
 * - Content collaboration and approvals
 */
class TeamService {
  constructor() {
    this.teamCache = new Map();
  }

  /**
   * Get all teams the current user is a member of
   * @returns {Promise<Array>} List of teams
   */
  async getUserTeams() {
    try {
      // Try cache first
      const cachedTeams = await localStorageService.getWithExpiry(CACHE_KEYS.USER_TEAMS);
      if (cachedTeams) {
        return cachedTeams;
      }

      // Fetch from API
      const response = await api.get('/teams');
      const teams = response.data;
      
      // Cache the result
      await localStorageService.setWithExpiry(
        CACHE_KEYS.USER_TEAMS,
        teams,
        CACHE_EXPIRATION
      );
      
      return teams;
    } catch (error) {
      console.error('Error fetching user teams:', error);
      throw error;
    }
  }

  /**
   * Get a specific team by ID
   * @param {string} teamId Team ID
   * @returns {Promise<Object>} Team data
   */
  async getTeam(teamId) {
    try {
      const response = await api.get(`/teams/${teamId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  }

  /**
   * Create a new team
   * @param {Object} teamData Team data object
   * @returns {Promise<Object>} Created team
   */
  async createTeam(teamData) {
    try {
      const response = await api.post('/teams', teamData);
      
      // Invalidate cache
      await localStorageService.remove(CACHE_KEYS.USER_TEAMS);
      
      return response.data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  /**
   * Update an existing team
   * @param {string} teamId Team ID
   * @param {Object} teamData Updated team data
   * @returns {Promise<Object>} Updated team
   */
  async updateTeam(teamId, teamData) {
    try {
      const response = await api.put(`/teams/${teamId}`, teamData);
      
      // Invalidate cache
      await localStorageService.remove(CACHE_KEYS.USER_TEAMS);
      
      return response.data;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  /**
   * Delete a team
   * @param {string} teamId Team ID
   * @returns {Promise<void>}
   */
  async deleteTeam(teamId) {
    try {
      await api.delete(`/teams/${teamId}`);
      
      // Invalidate cache
      await localStorageService.remove(CACHE_KEYS.USER_TEAMS);
      await localStorageService.remove(`${CACHE_KEYS.TEAM_MEMBERS}_${teamId}`);
      await localStorageService.remove(`${CACHE_KEYS.COLLABORATION_SPACES}_${teamId}`);
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  /**
   * Get all members of a team
   * @param {string} teamId Team ID
   * @returns {Promise<Array>} List of team members
   */
  async getTeamMembers(teamId) {
    try {
      // Try cache first
      const cacheKey = `${CACHE_KEYS.TEAM_MEMBERS}_${teamId}`;
      const cachedMembers = await localStorageService.getWithExpiry(cacheKey);
      if (cachedMembers) {
        return cachedMembers;
      }

      // Fetch from API
      const response = await api.get(`/teams/${teamId}/members`);
      const members = response.data;
      
      // Cache the result
      await localStorageService.setWithExpiry(
        cacheKey,
        members,
        CACHE_EXPIRATION
      );
      
      return members;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  }

  /**
   * Invite a new member to a team
   * @param {string} teamId Team ID
   * @param {Object} invitationData Invitation data
   * @returns {Promise<Object>} Created invitation
   */
  async inviteTeamMember(teamId, invitationData) {
    try {
      const response = await api.post(`/teams/${teamId}/invitations`, invitationData);
      
      // Invalidate cache
      await localStorageService.remove(`${CACHE_KEYS.TEAM_MEMBERS}_${teamId}`);
      
      return response.data;
    } catch (error) {
      console.error('Error inviting team member:', error);
      throw error;
    }
  }

  /**
   * Remove a member from a team
   * @param {string} teamId Team ID
   * @param {string} memberId Member ID
   * @returns {Promise<void>}
   */
  async removeTeamMember(teamId, memberId) {
    try {
      await api.delete(`/teams/${teamId}/members/${memberId}`);
      
      // Invalidate cache
      await localStorageService.remove(`${CACHE_KEYS.TEAM_MEMBERS}_${teamId}`);
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  /**
   * Update a team member's role
   * @param {string} teamId Team ID
   * @param {string} memberId Member ID
   * @param {string} roleId New role ID
   * @returns {Promise<Object>} Updated member
   */
  async updateMemberRole(teamId, memberId, roleId) {
    try {
      const response = await api.put(`/teams/${teamId}/members/${memberId}`, { roleId });
      
      // Invalidate cache
      await localStorageService.remove(`${CACHE_KEYS.TEAM_MEMBERS}_${teamId}`);
      
      return response.data;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  /**
   * Get all collaboration spaces for a team
   * @param {string} teamId Team ID
   * @returns {Promise<Array>} List of collaboration spaces
   */
  async getCollaborationSpaces(teamId) {
    try {
      // Try cache first
      const cacheKey = `${CACHE_KEYS.COLLABORATION_SPACES}_${teamId}`;
      const cachedSpaces = await localStorageService.getWithExpiry(cacheKey);
      if (cachedSpaces) {
        return cachedSpaces;
      }

      // Fetch from API
      const response = await api.get(`/teams/${teamId}/collaborationSpaces`);
      const spaces = response.data;
      
      // Cache the result
      await localStorageService.setWithExpiry(
        cacheKey,
        spaces,
        CACHE_EXPIRATION
      );
      
      return spaces;
    } catch (error) {
      console.error('Error fetching collaboration spaces:', error);
      throw error;
    }
  }

  /**
   * Get a specific collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @returns {Promise<Object>} Collaboration space data
   */
  async getCollaborationSpace(teamId, spaceId) {
    try {
      const response = await api.get(`/teams/${teamId}/collaborationSpaces/${spaceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching collaboration space:', error);
      throw error;
    }
  }

  /**
   * Create a new collaboration space
   * @param {string} teamId Team ID
   * @param {Object} spaceData Collaboration space data
   * @returns {Promise<Object>} Created collaboration space
   */
  async createCollaborationSpace(teamId, spaceData) {
    try {
      const response = await api.post(`/teams/${teamId}/collaborationSpaces`, spaceData);
      
      // Invalidate cache
      await localStorageService.remove(`${CACHE_KEYS.COLLABORATION_SPACES}_${teamId}`);
      
      return response.data;
    } catch (error) {
      console.error('Error creating collaboration space:', error);
      throw error;
    }
  }

  /**
   * Update a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {Object} spaceData Updated space data
   * @returns {Promise<Object>} Updated collaboration space
   */
  async updateCollaborationSpace(teamId, spaceId, spaceData) {
    try {
      const response = await api.put(`/teams/${teamId}/collaborationSpaces/${spaceId}`, spaceData);
      
      // Invalidate cache
      await localStorageService.remove(`${CACHE_KEYS.COLLABORATION_SPACES}_${teamId}`);
      
      return response.data;
    } catch (error) {
      console.error('Error updating collaboration space:', error);
      throw error;
    }
  }

  /**
   * Delete a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @returns {Promise<void>}
   */
  async deleteCollaborationSpace(teamId, spaceId) {
    try {
      await api.delete(`/teams/${teamId}/collaborationSpaces/${spaceId}`);
      
      // Invalidate cache
      await localStorageService.remove(`${CACHE_KEYS.COLLABORATION_SPACES}_${teamId}`);
    } catch (error) {
      console.error('Error deleting collaboration space:', error);
      throw error;
    }
  }

  /**
   * Get members of a specific collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @returns {Promise<Array>} List of collaboration space members
   */
  async getCollaborationSpaceMembers(teamId, spaceId) {
    try {
      const response = await api.get(`/teams/${teamId}/collaborationSpaces/${spaceId}/members`);
      return response.data;
    } catch (error) {
      console.error('Error fetching collaboration space members:', error);
      throw error;
    }
  }

  /**
   * Get campaign briefs for a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @returns {Promise<Array>} List of briefs
   */
  async getCollaborationBriefs(teamId, spaceId) {
    try {
      const response = await api.get(`/teams/${teamId}/collaborationSpaces/${spaceId}/briefs`);
      return response.data;
    } catch (error) {
      console.error('Error fetching collaboration briefs:', error);
      throw error;
    }
  }

  /**
   * Create a new brief in a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {Object} briefData Brief data
   * @returns {Promise<Object>} Created brief
   */
  async createCollaborationBrief(teamId, spaceId, briefData) {
    try {
      const response = await api.post(`/teams/${teamId}/collaborationSpaces/${spaceId}/briefs`, briefData);
      return response.data;
    } catch (error) {
      console.error('Error creating collaboration brief:', error);
      throw error;
    }
  }

  /**
   * Delete a brief from a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {string} briefId Brief ID
   * @returns {Promise<void>}
   */
  async deleteCollaborationBrief(teamId, spaceId, briefId) {
    try {
      await api.delete(`/teams/${teamId}/collaborationSpaces/${spaceId}/briefs/${briefId}`);
    } catch (error) {
      console.error('Error deleting collaboration brief:', error);
      throw error;
    }
  }

  /**
   * Get deliverables for a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @returns {Promise<Array>} List of deliverables
   */
  async getCollaborationDeliverables(teamId, spaceId) {
    try {
      const response = await api.get(`/teams/${teamId}/collaborationSpaces/${spaceId}/deliverables`);
      return response.data;
    } catch (error) {
      console.error('Error fetching collaboration deliverables:', error);
      throw error;
    }
  }

  /**
   * Create a new deliverable in a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {Object} deliverableData Deliverable data
   * @returns {Promise<Object>} Created deliverable
   */
  async createCollaborationDeliverable(teamId, spaceId, deliverableData) {
    try {
      const response = await api.post(`/teams/${teamId}/collaborationSpaces/${spaceId}/deliverables`, deliverableData);
      return response.data;
    } catch (error) {
      console.error('Error creating collaboration deliverable:', error);
      throw error;
    }
  }

  /**
   * Update deliverable status
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {string} deliverableId Deliverable ID
   * @param {Object} statusData Status data
   * @returns {Promise<Object>} Updated deliverable
   */
  async updateDeliverableStatus(teamId, spaceId, deliverableId, statusData) {
    try {
      const response = await api.put(
        `/teams/${teamId}/collaborationSpaces/${spaceId}/deliverables/${deliverableId}/status`,
        statusData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating deliverable status:', error);
      throw error;
    }
  }

  /**
   * Delete a deliverable from a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {string} deliverableId Deliverable ID
   * @returns {Promise<void>}
   */
  async deleteCollaborationDeliverable(teamId, spaceId, deliverableId) {
    try {
      await api.delete(`/teams/${teamId}/collaborationSpaces/${spaceId}/deliverables/${deliverableId}`);
    } catch (error) {
      console.error('Error deleting collaboration deliverable:', error);
      throw error;
    }
  }

  /**
   * Get guidelines for a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @returns {Promise<Array>} List of guidelines
   */
  async getCollaborationGuidelines(teamId, spaceId) {
    try {
      const response = await api.get(`/teams/${teamId}/collaborationSpaces/${spaceId}/guidelines`);
      return response.data;
    } catch (error) {
      console.error('Error fetching collaboration guidelines:', error);
      throw error;
    }
  }

  /**
   * Create a new guideline in a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {Object} guidelineData Guideline data
   * @returns {Promise<Object>} Created guideline
   */
  async createCollaborationGuideline(teamId, spaceId, guidelineData) {
    try {
      const response = await api.post(`/teams/${teamId}/collaborationSpaces/${spaceId}/guidelines`, guidelineData);
      return response.data;
    } catch (error) {
      console.error('Error creating collaboration guideline:', error);
      throw error;
    }
  }

  /**
   * Delete a guideline from a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {string} guidelineId Guideline ID
   * @returns {Promise<void>}
   */
  async deleteCollaborationGuideline(teamId, spaceId, guidelineId) {
    try {
      await api.delete(`/teams/${teamId}/collaborationSpaces/${spaceId}/guidelines/${guidelineId}`);
    } catch (error) {
      console.error('Error deleting collaboration guideline:', error);
      throw error;
    }
  }

  /**
   * Get discussions for a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @returns {Promise<Array>} List of discussions
   */
  async getCollaborationDiscussions(teamId, spaceId) {
    try {
      const response = await api.get(`/teams/${teamId}/collaborationSpaces/${spaceId}/discussions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching collaboration discussions:', error);
      throw error;
    }
  }

  /**
   * Delete a discussion from a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {string} discussionId Discussion ID
   * @returns {Promise<void>}
   */
  async deleteCollaborationDiscussion(teamId, spaceId, discussionId) {
    try {
      await api.delete(`/teams/${teamId}/collaborationSpaces/${spaceId}/discussions/${discussionId}`);
    } catch (error) {
      console.error('Error deleting collaboration discussion:', error);
      throw error;
    }
  }

  // Content Approval System Methods

  /**
   * Get content in a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {string} contentId Content ID
   * @returns {Promise<Object>} Content data
   */
  async getCollaborationContent(teamId, spaceId, contentId) {
    try {
      const response = await api.get(`/teams/${teamId}/collaborationSpaces/${spaceId}/content/${contentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching collaboration content:', error);
      throw error;
    }
  }

  /**
   * Update content status in workflow
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {string} contentId Content ID
   * @param {Object} statusData Status data
   * @returns {Promise<Object>} Updated content
   */
  async updateContentStatus(teamId, spaceId, contentId, statusData) {
    try {
      const response = await api.put(
        `/teams/${teamId}/collaborationSpaces/${spaceId}/content/${contentId}/status`,
        statusData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating content status:', error);
      throw error;
    }
  }

  /**
   * Get comments for content
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {string} contentId Content ID
   * @returns {Promise<Array>} List of comments
   */
  async getContentComments(teamId, spaceId, contentId) {
    try {
      const response = await api.get(
        `/teams/${teamId}/collaborationSpaces/${spaceId}/content/${contentId}/comments`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching content comments:', error);
      throw error;
    }
  }

  /**
   * Add a comment to content
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {string} contentId Content ID
   * @param {Object} commentData Comment data
   * @returns {Promise<Object>} Created comment
   */
  async addContentComment(teamId, spaceId, contentId, commentData) {
    try {
      const response = await api.post(
        `/teams/${teamId}/collaborationSpaces/${spaceId}/content/${contentId}/comments`,
        commentData
      );
      return response.data;
    } catch (error) {
      console.error('Error adding content comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment from content
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {string} contentId Content ID
   * @param {string} commentId Comment ID
   * @returns {Promise<void>}
   */
  async deleteContentComment(teamId, spaceId, contentId, commentId) {
    try {
      await api.delete(
        `/teams/${teamId}/collaborationSpaces/${spaceId}/content/${contentId}/comments/${commentId}`
      );
    } catch (error) {
      console.error('Error deleting content comment:', error);
      throw error;
    }
  }

  /**
   * Get activity log for content
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {string} contentId Content ID
   * @returns {Promise<Array>} List of activities
   */
  async getContentActivities(teamId, spaceId, contentId) {
    try {
      const response = await api.get(
        `/teams/${teamId}/collaborationSpaces/${spaceId}/content/${contentId}/activities`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching content activities:', error);
      throw error;
    }
  }

  /**
   * Get all content items in a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @returns {Promise<Array>} List of content items
   */
  async getCollaborationSpaceContent(teamId, spaceId) {
    try {
      const response = await api.get(`/teams/${teamId}/collaborationSpaces/${spaceId}/content`);
      return response.data;
    } catch (error) {
      console.error('Error fetching collaboration space content:', error);
      throw error;
    }
  }

  /**
   * Create a new content item in a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {Object} contentData Content data
   * @returns {Promise<Object>} Created content item
   */
  async createCollaborationContent(teamId, spaceId, contentData) {
    try {
      const response = await api.post(`/teams/${teamId}/collaborationSpaces/${spaceId}/content`, contentData);
      return response.data;
    } catch (error) {
      console.error('Error creating collaboration content:', error);
      throw error;
    }
  }

  /**
   * Delete a content item from a collaboration space
   * @param {string} teamId Team ID
   * @param {string} spaceId Collaboration space ID
   * @param {string} contentId Content ID
   * @returns {Promise<void>}
   */
  async deleteCollaborationContent(teamId, spaceId, contentId) {
    try {
      await api.delete(`/teams/${teamId}/collaborationSpaces/${spaceId}/content/${contentId}`);
    } catch (error) {
      console.error('Error deleting collaboration content:', error);
      throw error;
    }
  }

  /**
   * Get all team roles
   * @returns {Promise<Array>} List of roles
   */
  async getTeamRoles() {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      console.error('Error fetching team roles:', error);
      throw error;
    }
  }

  /**
   * Clear all team-related caches
   * This should be called on logout or when cache needs to be refreshed
   */
  clearCache() {
    localStorageService.remove(CACHE_KEYS.USER_TEAMS);
    
    // Clear team-specific caches
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_KEYS.TEAM_MEMBERS) || key.startsWith(CACHE_KEYS.COLLABORATION_SPACES))
      .forEach(key => localStorageService.remove(key));
  }
}

export default new TeamService();
