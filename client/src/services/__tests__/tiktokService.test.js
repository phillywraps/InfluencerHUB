const axios = require('axios');
const tiktokService = require('../tiktokService');

// Mock axios
jest.mock('axios');

// Mock window.open for connectAccount test
window.open = jest.fn();

describe('TikTok Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn()
    };
    global.localStorage = localStorageMock;
  });

  describe('getAccountStatus', () => {
    it('should return connected status when API call is successful', async () => {
      // Mock a successful response
      axios.get.mockResolvedValueOnce({ 
        data: { 
          connected: true,
          username: 'testuser',
          followers: 1000
        } 
      });

      const result = await tiktokService.getAccountStatus();
      
      expect(result).toEqual({
        connected: true,
        username: 'testuser',
        followers: 1000
      });
      expect(axios.get).toHaveBeenCalledWith('/api/tiktok/status');
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      axios.get.mockRejectedValueOnce(new Error('API error'));
      
      const result = await tiktokService.getAccountStatus();
      
      expect(result).toEqual({ connected: false });
      expect(axios.get).toHaveBeenCalledWith('/api/tiktok/status');
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data when API call is successful', async () => {
      const mockAnalytics = {
        followers: {
          count: 1000,
          growth: 5.2
        },
        engagement: {
          likes: 5000,
          comments: 300,
          shares: 150,
          rate: 2.8
        },
        views: {
          total: 50000,
          average: 2500
        },
        period: 'week'
      };
      
      axios.get.mockResolvedValueOnce({ data: mockAnalytics });

      const result = await tiktokService.getAnalytics('week');
      
      expect(result).toEqual(mockAnalytics);
      expect(axios.get).toHaveBeenCalledWith('/api/tiktok/analytics', {
        params: { period: 'week' }
      });
    });

    it('should handle API errors and return default data structure', async () => {
      // Mock API error
      axios.get.mockRejectedValueOnce(new Error('API error'));
      
      const result = await tiktokService.getAnalytics('week');
      
      expect(result).toHaveProperty('followers');
      expect(result).toHaveProperty('engagement');
      expect(result).toHaveProperty('views');
      expect(result.period).toBe('week');
    });
  });

  describe('getScheduledPosts', () => {
    it('should return scheduled posts when API call is successful', async () => {
      const mockPosts = [
        {
          id: 'post1',
          caption: 'Test post',
          scheduledTime: '2025-04-01T12:00:00.000Z',
          status: 'scheduled'
        }
      ];
      
      axios.get.mockResolvedValueOnce({ data: { posts: mockPosts } });

      const result = await tiktokService.getScheduledPosts();
      
      expect(result).toEqual(mockPosts);
      expect(axios.get).toHaveBeenCalledWith('/api/tiktok/posts/scheduled');
    });

    it('should handle API errors and return empty array', async () => {
      // Mock API error
      axios.get.mockRejectedValueOnce(new Error('API error'));
      
      const result = await tiktokService.getScheduledPosts();
      
      expect(result).toEqual([]);
    });
  });

  describe('schedulePost', () => {
    it('should return created post when API call is successful', async () => {
      const postData = {
        caption: 'Test post',
        scheduledTime: '2025-04-01T12:00:00.000Z',
        hashtags: ['test', 'tiktok'],
        videoFile: new File([''], 'test.mp4', { type: 'video/mp4' })
      };
      
      const mockResponse = {
        id: 'post1',
        ...postData,
        status: 'scheduled'
      };
      
      axios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await tiktokService.schedulePost(postData);
      
      expect(result).toEqual(mockResponse);
      expect(axios.post).toHaveBeenCalledWith('/api/tiktok/posts/schedule', postData);
    });

    it('should handle API errors and throw an error', async () => {
      const postData = {
        caption: 'Test post',
        scheduledTime: '2025-04-01T12:00:00.000Z',
        hashtags: ['test', 'tiktok'],
        videoFile: new File([''], 'test.mp4', { type: 'video/mp4' })
      };
      
      // Mock API error
      const errorMessage = 'Failed to schedule post';
      axios.post.mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(tiktokService.schedulePost(postData)).rejects.toThrow();
    });
  });

  describe('connectAccount', () => {
    it('should initiate OAuth flow with correct URL', () => {
      const spy = jest.spyOn(window, 'open').mockImplementation(() => {});
      
      tiktokService.connectAccount();
      
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('/api/tiktok/auth'), '_blank');
      spy.mockRestore();
    });
  });

  describe('disconnectAccount', () => {
    it('should disconnect account when API call is successful', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await tiktokService.disconnectAccount();
      
      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith('/api/tiktok/disconnect');
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      axios.post.mockRejectedValueOnce(new Error('API error'));
      
      const result = await tiktokService.disconnectAccount();
      
      expect(result).toBe(false);
    });
  });
});
