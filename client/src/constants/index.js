/**
 * Application-wide constants
 */

/**
 * WebSocket event types
 */
export const EVENTS = {
  // Dashboard-related events
  DASHBOARD: {
    // Analytics events
    ANALYTICS_UPDATE: 'analytics_update',
    EARNINGS_UPDATE: 'earnings_update',
    PERFORMANCE_UPDATE: 'performance_update',
    REAL_TIME_STATS: 'real_time_stats',
    ACTIVE_USERS: 'active_users',
    
    // Platform-specific events
    PLATFORM_STATS: 'platform_stats',
    PLATFORM_TRENDS: 'platform_trends',
    
    // Rental-related events
    RENTAL_STATUS_CHANGE: 'rental_status_change',
    NEW_RENTAL_REQUEST: 'new_rental_request',
  },
  
  // Notification events
  NOTIFICATION: {
    NEW: 'notification_new',
    READ: 'notification_read',
    DELETE: 'notification_delete',
  },
  
  // Chat/messaging events
  CHAT: {
    NEW_MESSAGE: 'chat_new_message',
    READ_RECEIPT: 'chat_read_receipt',
    USER_TYPING: 'chat_user_typing',
  },
  
  // User status events
  USER: {
    ONLINE_STATUS: 'user_online_status',
    PROFILE_UPDATE: 'user_profile_update',
  },
  
  // System events
  SYSTEM: {
    MAINTENANCE: 'system_maintenance',
    ERROR: 'system_error',
    UPDATE: 'system_update',
  },
};

/**
 * API Endpoints
 */
export const API = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    VERIFY_EMAIL: '/api/auth/verify-email',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // User endpoints
  USER: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    CHANGE_PASSWORD: '/api/users/change-password',
    DELETE_ACCOUNT: '/api/users/delete',
  },
  
  // Influencer endpoints
  INFLUENCER: {
    PROFILE: '/api/influencers/profile',
    LIST: '/api/influencers',
    FEATURED: '/api/influencers/featured',
    TRENDING: '/api/influencers/trending',
    BY_PLATFORM: '/api/influencers/platform',
    SOCIAL_ACCOUNTS: '/api/influencers/social-accounts',
  },
  
  // Rental endpoints
  RENTAL: {
    CREATE: '/api/rentals',
    LIST: '/api/rentals',
    DETAILS: '/api/rentals/:id',
    APPROVE: '/api/rentals/:id/approve',
    DECLINE: '/api/rentals/:id/decline',
    CANCEL: '/api/rentals/:id/cancel',
    COMPLETE: '/api/rentals/:id/complete',
  },
  
  // Payment endpoints
  PAYMENT: {
    METHODS: '/api/payments/methods',
    ADD_METHOD: '/api/payments/methods',
    REMOVE_METHOD: '/api/payments/methods/:id',
    PROCESS: '/api/payments/process',
    HISTORY: '/api/payments/history',
  },
  
  // Payout endpoints
  PAYOUT: {
    METHODS: '/api/payouts/methods',
    ADD_METHOD: '/api/payouts/methods',
    REMOVE_METHOD: '/api/payouts/methods/:id',
    REQUEST: '/api/payouts/request',
    HISTORY: '/api/payouts/history',
    BALANCE: '/api/payouts/balance',
  },
  
  // Messaging endpoints
  MESSAGE: {
    CONVERSATIONS: '/api/messages/conversations',
    MESSAGES: '/api/messages/conversations/:id',
    SEND: '/api/messages/send',
    READ: '/api/messages/read/:id',
  },
  
  // Notification endpoints
  NOTIFICATION: {
    LIST: '/api/notifications',
    READ: '/api/notifications/:id/read',
    READ_ALL: '/api/notifications/read-all',
    SETTINGS: '/api/notifications/settings',
  },
  
  // Analytics endpoints
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard',
    EARNINGS: '/api/analytics/earnings',
    RENTALS: '/api/analytics/rentals',
    PLATFORMS: '/api/analytics/platforms',
    EXPORT: '/api/analytics/export',
  },
  
  // Verification endpoints
  VERIFICATION: {
    STATUS: '/api/verification/status',
    SUBMIT: '/api/verification/submit',
    DOCUMENT: '/api/verification/document',
    SOCIAL: '/api/verification/social',
  },
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME_PREFERENCE: 'theme_preference',
  LANGUAGE_PREFERENCE: 'language_preference',
  DASHBOARD_FILTERS: 'dashboard_filters',
  LAST_VISITED: 'last_visited',
  NOTIFICATION_COUNT: 'notification_count',
};

/**
 * Theme constants
 */
export const THEME = {
  MODES: {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
  },
};

/**
 * Analytics chart types
 */
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  AREA: 'area',
  SCATTER: 'scatter',
};

/**
 * Time periods for analytics
 */
export const TIME_PERIODS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  CUSTOM: 'custom',
};

/**
 * Payment methods
 */
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  CRYPTO: 'crypto',
};

/**
 * Rental statuses
 */
export const RENTAL_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DECLINED: 'declined',
};
