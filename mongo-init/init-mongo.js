// This script initializes the MongoDB database with initial collections and users
db = db.getSiblingDB('admin');

// Authenticate as admin user
db.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);

// Create influencer-platform database
db = db.getSiblingDB('influencer-platform');

// Create collections
db.createCollection('users');
db.createCollection('campaigns');
db.createCollection('contents');
db.createCollection('analytics');
db.createCollection('payments');
db.createCollection('notifications');

// Create initial admin user
db.users.insertOne({
  username: 'admin',
  email: 'admin@example.com',
  password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1TD7WS', // hashed 'password123'
  role: 'admin',
  firstName: 'Admin',
  lastName: 'User',
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.campaigns.createIndex({ "userId": 1 });
db.contents.createIndex({ "userId": 1 });
db.contents.createIndex({ "campaignId": 1 });
db.analytics.createIndex({ "userId": 1 });
db.analytics.createIndex({ "contentId": 1 });
db.payments.createIndex({ "userId": 1 });
db.notifications.createIndex({ "userId": 1 });
db.notifications.createIndex({ "read": 1 });

print('MongoDB initialization completed successfully.');
