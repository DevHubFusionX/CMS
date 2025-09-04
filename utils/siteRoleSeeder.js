const Role = require('../models/Role');
const logger = require('./logger');

const siteRoles = [
  {
    name: 'site_admin',
    displayName: 'Site Administrator',
    description: 'Full control over their own site',
    permissions: [
      'manage_sites', 'manage_users', 'manage_roles',
      'create_posts', 'edit_all_posts', 'delete_all_posts', 'publish_posts',
      'upload_media', 'manage_all_media',
      'manage_categories', 'manage_tags',
      'moderate_comments', 'delete_comments',
      'create_pages', 'edit_pages', 'delete_pages',
      'manage_settings', 'view_analytics',
      'access_dashboard', 'manage_themes'
    ],
    level: 6
  },
  {
    name: 'writer',
    displayName: 'Writer',
    description: 'Can create and edit drafts, submit for review',
    permissions: [
      'view_posts', 'create_posts', 'edit_own_posts', 'create_drafts', 'submit_for_review',
      'upload_media', 'manage_own_media',
      'create_comments', 'manage_own_comments',
      'view_profile', 'edit_own_profile',
      'access_dashboard'
    ],
    level: 2
  }
];

const seedSiteRoles = async () => {
  try {
    logger.info('Seeding site-specific roles...');
    
    for (const roleData of siteRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (!existingRole) {
        await Role.create(roleData);
        logger.info(`Created role: ${roleData.name}`);
      } else {
        // Update existing role with new permissions
        await Role.findOneAndUpdate(
          { name: roleData.name },
          roleData,
          { new: true }
        );
        logger.info(`Updated role: ${roleData.name}`);
      }
    }
    
    logger.info('Site roles seeding completed');
  } catch (error) {
    logger.error('Error seeding site roles:', error);
    throw error;
  }
};

module.exports = { seedSiteRoles };