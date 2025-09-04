const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('../models/Post');
const Site = require('../models/Site');
const User = require('../models/User');
const logger = require('../utils/logger');

dotenv.config();

const migratePosts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for migration');

    // Find posts without site reference
    const postsWithoutSite = await Post.find({ site: { $exists: false } });
    logger.info(`Found ${postsWithoutSite.length} posts without site reference`);

    if (postsWithoutSite.length === 0) {
      logger.info('No posts to migrate');
      return;
    }

    // Create a default site for existing posts
    const firstUser = await User.findOne().sort({ createdAt: 1 });
    if (!firstUser) {
      logger.error('No users found to create default site');
      return;
    }

    let defaultSite = await Site.findOne({ subdomain: 'legacy' });
    
    if (!defaultSite) {
      defaultSite = await Site.create({
        name: 'Legacy Site',
        subdomain: 'legacy',
        owner: firstUser._id,
        type: 'blog',
        settings: {
          title: 'Legacy Content Site',
          tagline: 'Migrated content from single-site setup'
        }
      });
      logger.info('Created default legacy site');
    }

    // Update posts to reference the default site
    const updateResult = await Post.updateMany(
      { site: { $exists: false } },
      { $set: { site: defaultSite._id } }
    );

    logger.info(`Updated ${updateResult.modifiedCount} posts with site reference`);

    // Update site stats
    const postCount = await Post.countDocuments({ site: defaultSite._id });
    await Site.findByIdAndUpdate(defaultSite._id, {
      'stats.totalPosts': postCount
    });

    logger.info('Migration completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  migratePosts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migratePosts };