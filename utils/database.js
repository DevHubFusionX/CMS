const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * MongoDB connection configuration
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cms', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Create indexes for better query performance
 */
const setupIndexes = async () => {
  try {
    // Import models
    const Post = require('../models/Post');
    const User = require('../models/User');
    
    // Create text indexes for search functionality
    await Post.collection.createIndex({ title: 'text', content: 'text', tags: 'text' });
    await User.collection.createIndex({ name: 'text', email: 'text' });
    
    // Create indexes for common queries
    await Post.collection.createIndex({ status: 1, language: 1 });
    await Post.collection.createIndex({ author: 1 });
    await Post.collection.createIndex({ scheduledDate: 1 });
    
    logger.info('MongoDB indexes created successfully');
  } catch (error) {
    logger.error(`Error creating MongoDB indexes: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  setupIndexes
};