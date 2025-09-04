const mongoose = require('mongoose');
const Site = require('../models/Site');
const logger = require('../utils/logger');

const updateSiteSchema = async () => {
  try {
    logger.info('Starting site schema update migration...');

    // Update all existing sites with new fields
    const sites = await Site.find({});
    
    for (const site of sites) {
      const updates = {};
      
      // Add template if not exists
      if (!site.template) {
        updates.template = 'default';
      }
      
      // Add colorScheme to theme if not exists
      if (!site.theme.colorScheme) {
        updates['theme.colorScheme'] = 'default';
      }
      
      // Add accent color if not exists
      if (!site.theme.customizations.accentColor) {
        updates['theme.customizations.accentColor'] = '#06b6d4';
      }
      
      // Add fonts if not exists
      if (!site.theme.customizations.fonts) {
        updates['theme.customizations.fonts'] = {
          heading: 'Inter',
          body: 'Inter'
        };
      }
      
      // Add isInitialized if not exists
      if (site.isInitialized === undefined) {
        updates.isInitialized = true; // Assume existing sites are initialized
      }
      
      // Add totalUsers to stats if not exists
      if (!site.stats.totalUsers) {
        updates['stats.totalUsers'] = 1;
      }
      
      // Add lastActivity to stats if not exists
      if (!site.stats.lastActivity) {
        updates['stats.lastActivity'] = site.updatedAt || site.createdAt;
      }
      
      // Add template and colorScheme to settings if not exists
      if (!site.settings.template) {
        updates['settings.template'] = site.template || 'default';
      }
      
      if (!site.settings.colorScheme) {
        updates['settings.colorScheme'] = site.theme?.colorScheme || 'default';
      }
      
      // Add features array if not exists
      if (!site.settings.features) {
        // Set default features based on site type
        const defaultFeatures = {
          blog: ['Post feed', 'Categories', 'Comments', 'RSS feed'],
          portfolio: ['Project gallery', 'About page', 'Contact form', 'Skills section'],
          business: ['Landing page', 'Services', 'Team page', 'Contact form'],
          news: ['Multi-author', 'Categories', 'Trending', 'Newsletter'],
          personal: ['About page', 'Blog', 'Photo gallery', 'Contact']
        };
        
        updates['settings.features'] = defaultFeatures[site.type] || defaultFeatures.blog;
      }
      
      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await Site.findByIdAndUpdate(site._id, { $set: updates });
        logger.info(`Updated site: ${site.name} (${site._id})`);
      }
    }
    
    logger.info(`Site schema update completed. Updated ${sites.length} sites.`);
    return { success: true, updatedCount: sites.length };
    
  } catch (error) {
    logger.error('Site schema update failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  const connectDB = require('../config/database');
  
  const runMigration = async () => {
    try {
      await connectDB();
      await updateSiteSchema();
      process.exit(0);
    } catch (error) {
      logger.error('Migration failed:', error);
      process.exit(1);
    }
  };
  
  runMigration();
}

module.exports = updateSiteSchema;