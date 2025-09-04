const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { setupMultiSiteSystem } = require('./utils/multiSiteSetup');
const { connectDB, setupIndexes } = require('./utils/database');
const logger = require('./utils/logger');

dotenv.config();

const setupCompleteDatabase = async () => {
  try {
    logger.info('Starting complete database setup...');

    // Connect to database
    await connectDB();
    
    // Setup database indexes
    await setupIndexes();
    
    // Setup multi-site system
    await setupMultiSiteSystem();

    logger.info('✅ Complete database setup finished successfully!');
    logger.info('');
    logger.info('🚀 Your multi-site CMS platform is ready!');
    logger.info('');
    logger.info('Next steps:');
    logger.info('1. Start the server: npm start');
    logger.info('2. Visit the admin panel to create your first site');
    logger.info('3. Configure your domain settings');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

setupCompleteDatabase();