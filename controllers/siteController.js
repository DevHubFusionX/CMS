const Site = require('../models/Site');
const User = require('../models/User');
const SiteUser = require('../models/SiteUser');
const Subscription = require('../models/Subscription');
const { initializeSite } = require('../utils/siteInitializer');
const logger = require('../utils/logger');

// @desc    Create new site
// @route   POST /api/sites
// @access  Private
exports.createSite = async (req, res) => {
  try {
    const { name, subdomain, type, title, tagline, template, colorScheme, settings } = req.body;

    // Check if subdomain is available
    const existingSite = await Site.findOne({ subdomain: subdomain.toLowerCase() });
    if (existingSite) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain already taken'
      });
    }

    // Create site with enhanced data
    const site = await Site.create({
      name,
      subdomain: subdomain.toLowerCase(),
      owner: req.user.id,
      type,
      settings: {
        title,
        tagline,
        template: template || 'default',
        colorScheme: colorScheme || 'default',
        ...settings
      }
    });

    // Create site admin role for owner
    await SiteUser.create({
      site: site._id,
      user: req.user.id,
      role: 'site_admin',
      permissions: ['manage_site', 'manage_users', 'manage_content', 'publish_posts', 'create_posts', 'edit_posts', 'delete_posts', 'manage_media', 'manage_comments', 'view_analytics', 'manage_settings']
    });

    // Create free subscription
    await Subscription.create({
      site: site._id,
      plan: 'free',
      billing: { amount: 0 }
    });

    // Update user's owned sites
    await User.findByIdAndUpdate(req.user.id, {
      $push: { ownedSites: site._id }
    });

    // Initialize site with default content
    try {
      await initializeSite(site, req.user.id);
      logger.info(`Site initialized successfully: ${site.name}`);
    } catch (initError) {
      logger.error(`Site initialization failed for ${site.name}:`, initError);
      // Don't fail the site creation if initialization fails
    }

    // Populate the site with owner info for response
    const populatedSite = await Site.findById(site._id).populate('owner', 'name email');

    res.status(201).json({
      success: true,
      data: populatedSite,
      message: 'Site created successfully! Default content has been added to get you started.'
    });
  } catch (error) {
    logger.error('Site creation failed:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's sites
// @route   GET /api/sites
// @access  Private
exports.getUserSites = async (req, res) => {
  try {
    const ownedSites = await Site.find({ owner: req.user.id })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    const memberSites = await SiteUser.find({ user: req.user.id })
      .populate('site')
      .populate('user', 'name email');

    res.json({
      success: true,
      data: {
        owned: ownedSites,
        member: memberSites
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single site
// @route   GET /api/sites/:id
// @access  Private
exports.getSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id)
      .populate('owner', 'name email avatar');

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check if user has access to this site
    const hasAccess = site.owner._id.toString() === req.user.id || 
      await SiteUser.findOne({ site: site._id, user: req.user.id });

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: site
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update site
// @route   PUT /api/sites/:id
// @access  Private
exports.updateSite = async (req, res) => {
  try {
    let site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check if user is site owner or has manage_site permission
    const isOwner = site.owner.toString() === req.user.id;
    const siteUser = await SiteUser.findOne({ 
      site: site._id, 
      user: req.user.id,
      permissions: 'manage_site'
    });

    if (!isOwner && !siteUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    site = await Site.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: site
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete site
// @route   DELETE /api/sites/:id
// @access  Private
exports.deleteSite = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Only site owner can delete
    if (site.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only site owner can delete the site'
      });
    }

    await Site.findByIdAndDelete(req.params.id);
    await SiteUser.deleteMany({ site: req.params.id });
    await Subscription.deleteMany({ site: req.params.id });

    // Remove from user's owned sites
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { ownedSites: req.params.id }
    });

    res.json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get site by subdomain (public)
// @route   GET /api/sites/public/:subdomain
// @access  Public
exports.getSiteBySubdomain = async (req, res) => {
  try {
    const site = await Site.findOne({ 
      subdomain: req.params.subdomain,
      isActive: true
    }).populate('owner', 'name avatar bio');

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    res.json({
      success: true,
      data: site
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check subdomain availability
// @route   GET /api/sites/check-subdomain/:subdomain
// @access  Public
exports.checkSubdomain = async (req, res) => {
  try {
    const subdomain = req.params.subdomain.toLowerCase();
    
    // Reserved subdomains
    const reserved = ['www', 'api', 'admin', 'app', 'blog', 'mail', 'ftp', 'support'];
    if (reserved.includes(subdomain)) {
      return res.json({
        success: true,
        available: false,
        message: 'This subdomain is reserved'
      });
    }

    const existingSite = await Site.findOne({ subdomain });
    
    res.json({
      success: true,
      available: !existingSite,
      message: existingSite ? 'Subdomain already taken' : 'Subdomain available'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};