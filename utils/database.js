const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * MongoDB connection configuration with retry logic
 */
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cms', {
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000, // 45 seconds
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        heartbeatFrequencyMS: 10000
      });
      
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });
      
      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });
      
      return conn;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${i + 1} failed: ${error.message}`);
      
      if (i === retries - 1) {
        logger.error('All MongoDB connection attempts failed');
        process.exit(1);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      logger.info(`Retrying MongoDB connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
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