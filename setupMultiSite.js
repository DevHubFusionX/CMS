const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { setupMultiSiteSystem } = require('./utils/multiSiteSetup');
const logger = require('./utils/logger');

dotenv.config();

const runSetup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    await setupMultiSiteSystem();

    logger.info('Multi-site setup completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Setup failed:', error);
    process.exit(1);
  }
};

runSetup();