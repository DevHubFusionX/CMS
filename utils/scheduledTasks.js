/**
 * Scheduled tasks handler for the CMS
 * Handles tasks like publishing scheduled posts
 */

const cron = require('node-cron');
const Post = require('../models/Post');
const logger = require('./logger');
const { createBackup } = require('./backup');

// Initialize scheduled tasks
const initScheduledTasks = () => {
  // Check for scheduled posts every minute
  cron.schedule('* * * * *', async () => {
    try {
      const publishedCount = await Post.publishScheduledPosts();
      
      if (publishedCount > 0) {
        logger.info(`Published ${publishedCount} scheduled posts`);
      }
    } catch (error) {
      logger.error('Error publishing scheduled posts:', error);
    }
  });
  
  // Run daily maintenance tasks at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Running daily maintenance tasks');
      
      // Create daily backup
      await createBackup();
      logger.info('Daily backup completed successfully');
      
    } catch (error) {
      logger.error('Error running daily maintenance tasks:', error);
    }
  });
  
  logger.info('Scheduled tasks initialized');
};

module.exports = {
  initScheduledTasks
};