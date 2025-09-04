const Site = require('../models/Site');
const SiteUser = require('../models/SiteUser');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { seedSiteRoles } = require('./siteRoleSeeder');
const { migratePosts } = require('../migrations/addSiteToExistingPosts');
const logger = require('./logger');

const setupMultiSiteSystem = async () => {
  try {
    logger.info('Setting up multi-site system...');

    // 1. Seed site-specific roles
    await seedSiteRoles();

    // 2. Migrate existing posts to have site references
    await migratePosts();

    // 3. Update existing users to have platform roles
    const usersWithoutPlatformRole = await User.find({ 
      platformRole: { $exists: false } 
    });

    for (const user of usersWithoutPlatformRole) {
      // Set platform role based on legacy role
      const platformRole = user.legacyRole === 'super_admin' ? 'super_admin' : 'user';
      await User.findByIdAndUpdate(user._id, { platformRole });
    }

    logger.info(`Updated ${usersWithoutPlatformRole.length} users with platform roles`);

    // 4. Create default sites for existing users who don't have any
    const usersWithoutSites = await User.find({
      ownedSites: { $size: 0 },
      legacyRole: { $in: ['author', 'editor', 'admin'] }
    });

    for (const user of usersWithoutSites) {
      const siteName = `${user.name}'s Site`;
      const subdomain = user.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Check if subdomain exists
      const existingSite = await Site.findOne({ subdomain });
      if (existingSite) continue;

      const site = await Site.create({
        name: siteName,
        subdomain,
        owner: user._id,
        type: 'blog',
        settings: {
          title: siteName,
          tagline: `Welcome to ${user.name}'s website`
        }
      });

      // Create site admin role
      await SiteUser.create({
        site: site._id,
        user: user._id,
        role: 'site_admin',
        permissions: [
          'manage_site', 'manage_users', 'manage_content', 'publish_posts',
          'create_posts', 'edit_posts', 'delete_posts', 'manage_media',
          'manage_comments', 'view_analytics', 'manage_settings'
        ]
      });

      // Create free subscription
      await Subscription.create({
        site: site._id,
        plan: 'free',
        billing: { amount: 0 }
      });

      // Update user's owned sites
      await User.findByIdAndUpdate(user._id, {
        $push: { ownedSites: site._id }
      });

      logger.info(`Created default site for user: ${user.name}`);
    }

    logger.info('Multi-site system setup completed successfully');
  } catch (error) {
    logger.error('Multi-site setup failed:', error);
    throw error;
  }
};

module.exports = { setupMultiSiteSystem };