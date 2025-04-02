const tiktokController = require('../tiktokController');
const tiktokApiService = require('../../utils/tiktokApiService');
const tiktokCacheService = require('../../utils/caching/tiktokCacheService');
const tiktokRateLimiter = require('../../middleware/rateLimiting/tiktokRateLimiter');

// Mock dependencies
jest.mock('../../utils/tiktokApiService');
jest.mock('../../utils/caching/tiktokCacheService');
jest.mock('../../middleware/rateLimiting/tiktokRateLimiter');

describe('TikTok Controller', () => {
  let req, res;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock request and response objects
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user123' }
    };
    
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      redirect: jest.fn()
    };
    
    // Mock successful API service responses
    tiktokApiService.getAccountStatus.mockResolvedValue({
      connected: true,
      username: 'testuser',
      followers: 1000
    });
    
    tiktokApiService.getAnalytics.mockResolvedValue({
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
    });
    
    tiktokApiService.getScheduledPosts.mockResolvedValue([
      {
        id: 'post1',
        caption: 'Test post',
        scheduledTime: '2025-04-01T12:00:00.000Z',
        status: 'scheduled'
      }
    ]);
    
    // Mock rate limiter to allow requests
    tiktokRateLimiter.checkRateLimit.mockImplementation((req, res, next) => next());
  });

  describe('getAccountStatus', () => {
    it('should return account status when API call is successful', async () => {
      await tiktokController.getAccountStatus(req, res);
      
      expect(tiktokApiService.getAccountStatus).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith({
        connected: true,
        username: 'testuser',
        followers: 1000
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      tiktokApiService.getAccountStatus.mockRejectedValueOnce(new Error('API error'));
      
      await tiktokController.getAccountStatus(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: expect.any(String),
        connected: false 
      });
    });
    
    it('should handle rate limiting', async () => {
      // Mock rate limiter to block request
      tiktokRateLimiter.checkRateLimit.mockImplementationOnce((req, res, next) => {
        res.status(429).json({ error: 'Rate limit exceeded' });
      });
      
      await tiktokController.getAccountStatus(req, res);
      
      expect(tiktokApiService.getAccountStatus).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data with default period when no period specified', async () => {
      await tiktokController.getAnalytics(req, res);
      
      expect(tiktokApiService.getAnalytics).toHaveBeenCalledWith('user123', 'week');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        followers: expect.any(Object),
        engagement: expect.any(Object),
        views: expect.any(Object)
      }));
    });

    it('should return analytics data with specified period', async () => {
      req.query.period = 'month';
      
      await tiktokController.getAnalytics(req, res);
      
      expect(tiktokApiService.getAnalytics).toHaveBeenCalledWith('user123', 'month');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        period: 'month'
      }));
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      tiktokApiService.getAnalytics.mockRejectedValueOnce(new Error('API error'));
      
      await tiktokController.getAnalytics(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: expect.any(String)
      });
    });
    
    it('should use cached data when available', async () => {
      // Mock cached data
      const cachedData = {
        followers: { count: 2000, growth: 7.5 },
        engagement: { likes: 10000, comments: 600, shares: 300, rate: 3.5 },
        views: { total: 100000, average: 5000 },
        period: 'week',
        cached: true
      };
      tiktokCacheService.getAnalyticsCache.mockResolvedValueOnce(cachedData);
      
      await tiktokController.getAnalytics(req, res);
      
      // Should not call API if cache is used
      expect(tiktokApiService.getAnalytics).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(cachedData);
    });
  });

  describe('getScheduledPosts', () => {
    it('should return scheduled posts', async () => {
      await tiktokController.getScheduledPosts(req, res);
      
      expect(tiktokApiService.getScheduledPosts).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith({
        posts: [
          {
            id: 'post1',
            caption: 'Test post',
            scheduledTime: '2025-04-01T12:00:00.000Z',
            status: 'scheduled'
          }
        ]
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      tiktokApiService.getScheduledPosts.mockRejectedValueOnce(new Error('API error'));
      
      await tiktokController.getScheduledPosts(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: expect.any(String),
        posts: [] 
      });
    });
  });

  describe('schedulePost', () => {
    beforeEach(() => {
      // Mock file upload
      req.file = {
        buffer: Buffer.from('mock video content'),
        mimetype: 'video/mp4'
      };
      
      req.body = {
        caption: 'Test caption',
        scheduledTime: '2025-04-01T12:00:00.000Z',
        hashtags: 'test,tiktok'
      };
      
      tiktokApiService.schedulePost.mockResolvedValue({
        id: 'post1',
        caption: 'Test caption',
        hashtags: ['test', 'tiktok'],
        scheduledTime: '2025-04-01T12:00:00.000Z',
        status: 'scheduled'
      });
    });
    
    it('should schedule post with valid data', async () => {
      await tiktokController.schedulePost(req, res);
      
      expect(tiktokApiService.schedulePost).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          caption: 'Test caption',
          scheduledTime: '2025-04-01T12:00:00.000Z',
          hashtags: ['test', 'tiktok'],
          videoBuffer: expect.any(Buffer)
        })
      );
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 'post1',
        status: 'scheduled'
      }));
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Missing caption
      req.body = {
        scheduledTime: '2025-04-01T12:00:00.000Z'
      };
      
      await tiktokController.schedulePost(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
      expect(tiktokApiService.schedulePost).not.toHaveBeenCalled();
    });
    
    it('should return 400 if video file is missing', async () => {
      // No file uploaded
      req.file = undefined;
      
      await tiktokController.schedulePost(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('video')
      }));
      expect(tiktokApiService.schedulePost).not.toHaveBeenCalled();
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock API error
      tiktokApiService.schedulePost.mockRejectedValueOnce(new Error('API error'));
      
      await tiktokController.schedulePost(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: expect.any(String)
      });
    });
  });

  describe('authCallback', () => {
    beforeEach(() => {
      req.query = {
        code: 'auth_code_123',
        state: 'user123'
      };
      
      tiktokApiService.exchangeAuthCode.mockResolvedValue({
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        username: 'authenticated_user'
      });
    });
    
    it('should process successful auth callback and redirect', async () => {
      await tiktokController.authCallback(req, res);
      
      expect(tiktokApiService.exchangeAuthCode).toHaveBeenCalledWith(
        'auth_code_123',
        'user123'
      );
      
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/success')
      );
    });
    
    it('should handle missing code parameter', async () => {
      req.query = { state: 'user123' }; // No code
      
      await tiktokController.authCallback(req, res);
      
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/error')
      );
      expect(tiktokApiService.exchangeAuthCode).not.toHaveBeenCalled();
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock API error
      tiktokApiService.exchangeAuthCode.mockRejectedValueOnce(new Error('API error'));
      
      await tiktokController.authCallback(req, res);
      
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/error')
      );
    });
  });

  describe('disconnectAccount', () => {
    it('should disconnect account successfully', async () => {
      tiktokApiService.disconnectAccount.mockResolvedValue(true);
      
      await tiktokController.disconnectAccount(req, res);
      
      expect(tiktokApiService.disconnectAccount).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock API error
      tiktokApiService.disconnectAccount.mockRejectedValueOnce(new Error('API error'));
      
      await tiktokController.disconnectAccount(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: expect.any(String),
        success: false
      });
    });
  });
});
