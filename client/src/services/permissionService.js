import api from './api';
import localStorageService from './localStorageService';

// Cache keys
const CACHE_KEYS = {
  USER_PERMISSIONS: 'user_permissions',
  ROLE_PERMISSIONS: 'role_permissions',
};

// Cache expiration (24 hours)
const CACHE_EXPIRATION = 1000 * 60 * 60 * 24;

/**
 * Permission Service
 * 
 * Handles role-based access control functionality:
 * - Permission checking and verification
 * - Role permission mapping
 * - Caching permission data for performance
 */
class PermissionService {
  constructor() {
    this.permissionCache = {};
    this.roleCache = {};
  }

  /**
   * Check if a user has a specific permission in a given context
   * @param {string} permission - Permission to check
   * @param {string} contextType - Context type (e.g., 'team', 'space', 'content')
   * @param {string} contextId - ID of the context (e.g., team ID)
   * @returns {Promise<boolean>} Whether the user has permission
   */
  async hasPermission(permission, contextType, contextId) {
    try {
      // Try to get from cache first
      const cacheKey = this.buildCacheKey(permission, contextType, contextId);
      const cachedPermission = this.permissionCache[cacheKey];
      
      if (cachedPermission && cachedPermission.expiry > Date.now()) {
        return cachedPermission.value;
      }

      // Not in cache or expired, fetch from API
      const response = await api.get('/permissions/check', {
        params: { permission, contextType, contextId }
      });
      
      const hasPermission = response.data.hasPermission;
      
      // Cache the result
      this.permissionCache[cacheKey] = {
        value: hasPermission,
        expiry: Date.now() + CACHE_EXPIRATION
      };
      
      return hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      // Default to false for safety
      return false;
    }
  }

  /**
   * Get all permissions for a user in a team
   * @param {string} teamId - Team ID
   * @returns {Promise<Array>} Array of permission objects
   */
  async getUserPermissionsForTeam(teamId) {
    try {
      // Try local storage cache first
      const cacheKey = `${CACHE_KEYS.USER_PERMISSIONS}_${teamId}`;
      const cachedPermissions = await localStorageService.getWithExpiry(cacheKey);
      
      if (cachedPermissions) {
        return cachedPermissions;
      }

      // Fetch from API
      const response = await api.get(`/teams/${teamId}/permissions`);
      const permissions = response.data;
      
      // Cache in local storage
      await localStorageService.setWithExpiry(
        cacheKey,
        permissions,
        CACHE_EXPIRATION
      );
      
      return permissions;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  }

  /**
   * Get permissions for a specific role
   * @param {string} roleId - Role ID
   * @returns {Promise<Array>} Array of permission objects
   */
  async getRolePermissions(roleId) {
    try {
      // Try cache first
      const cacheKey = `${CACHE_KEYS.ROLE_PERMISSIONS}_${roleId}`;
      const cachedPermissions = await localStorageService.getWithExpiry(cacheKey);
      
      if (cachedPermissions) {
        return cachedPermissions;
      }

      // Fetch from API
      const response = await api.get(`/roles/${roleId}/permissions`);
      const permissions = response.data;
      
      // Cache in local storage
      await localStorageService.setWithExpiry(
        cacheKey,
        permissions,
        CACHE_EXPIRATION
      );
      
      return permissions;
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return [];
    }
  }

  /**
   * Get all available roles with their permissions
   * @returns {Promise<Array>} Array of role objects with permissions
   */
  async getAllRolesWithPermissions() {
    try {
      const response = await api.get('/roles?includePermissions=true');
      return response.data;
    } catch (error) {
      console.error('Error fetching roles with permissions:', error);
      return [];
    }
  }

  /**
   * Check if user is a team owner
   * @param {string} teamId - Team ID
   * @returns {Promise<boolean>} Whether the user is a team owner
   */
  async isTeamOwner(teamId) {
    return this.hasPermission('team:owner', 'team', teamId);
  }

  /**
   * Check if user is a team admin
   * @param {string} teamId - Team ID
   * @returns {Promise<boolean>} Whether the user is a team admin
   */
  async isTeamAdmin(teamId) {
    return this.hasPermission('team:admin', 'team', teamId);
  }

  /**
   * Check if user can manage team members
   * @param {string} teamId - Team ID
   * @returns {Promise<boolean>} Whether the user can manage team members
   */
  async canManageTeamMembers(teamId) {
    return this.hasPermission('team:manage_members', 'team', teamId);
  }

  /**
   * Check if user can manage team settings
   * @param {string} teamId - Team ID
   * @returns {Promise<boolean>} Whether the user can manage team settings
   */
  async canManageTeamSettings(teamId) {
    return this.hasPermission('team:manage_settings', 'team', teamId);
  }

  /**
   * Check if user can create collaboration spaces
   * @param {string} teamId - Team ID
   * @returns {Promise<boolean>} Whether the user can create collaboration spaces
   */
  async canCreateCollaborationSpaces(teamId) {
    return this.hasPermission('team:create_spaces', 'team', teamId);
  }

  /**
   * Check if user can manage a specific collaboration space
   * @param {string} teamId - Team ID
   * @param {string} spaceId - Collaboration space ID
   * @returns {Promise<boolean>} Whether the user can manage the collaboration space
   */
  async canManageCollaborationSpace(teamId, spaceId) {
    return this.hasPermission('space:manage', 'space', spaceId);
  }

  /**
   * Check if user can approve content in a specific space
   * @param {string} spaceId - Collaboration space ID
   * @returns {Promise<boolean>} Whether the user can approve content
   */
  async canApproveContent(spaceId) {
    return this.hasPermission('content:approve', 'space', spaceId);
  }

  /**
   * Check if user can publish content in a specific space
   * @param {string} spaceId - Collaboration space ID
   * @returns {Promise<boolean>} Whether the user can publish content
   */
  async canPublishContent(spaceId) {
    return this.hasPermission('content:publish', 'space', spaceId);
  }

  /**
   * Check if user can edit content in a specific space
   * @param {string} spaceId - Collaboration space ID
   * @returns {Promise<boolean>} Whether the user can edit content
   */
  async canEditContent(spaceId) {
    return this.hasPermission('content:edit', 'space', spaceId);
  }

  /**
   * Clear permission cache for a user
   * This should be called after role changes, team changes, etc.
   */
  clearCache() {
    this.permissionCache = {};
    
    // Clear local storage caches
    Object.values(CACHE_KEYS).forEach(key => {
      localStorageService.remove(key);
    });
  }

  /**
   * Build a cache key for a permission check
   * @param {string} permission - Permission to check
   * @param {string} contextType - Context type
   * @param {string} contextId - ID of the context
   * @returns {string} Cache key
   * @private
   */
  buildCacheKey(permission, contextType, contextId) {
    return `${permission}:${contextType}:${contextId}`;
  }
}

export default new PermissionService();
