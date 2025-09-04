const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { seedSiteRoles } = require('./utils/siteRoleSeeder');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Seed site roles
    await seedSiteRoles();

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();