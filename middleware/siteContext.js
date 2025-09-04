const Site = require('../models/Site');
const SiteUser = require('../models/SiteUser');

// Middleware to extract and validate site context
exports.extractSiteContext = async (req, res, next) => {
  try {
    let siteId = null;
    
    // Try to get site ID from different sources
    if (req.params.siteId) {
      siteId = req.params.siteId;
    } else if (req.body.siteId) {
      siteId = req.body.siteId;
    } else if (req.query.siteId) {
      siteId = req.query.siteId;
    } else if (req.headers['x-site-id']) {
      siteId = req.headers['x-site-id'];
    }

    if (siteId) {
      const site = await Site.findById(siteId);
      if (site) {
        req.site = site;
        
        // Get user's role in this site
        if (req.user) {
          const siteUser = await SiteUser.findOne({
            site: siteId,
            user: req.user.id
          });
          
          req.siteRole = siteUser ? siteUser.role : null;
          req.sitePermissions = siteUser ? siteUser.permissions : [];
          req.isOwner = site.owner.toString() === req.user.id;
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Site context error:', error);
    next();
  }
};

// Middleware to require site access
exports.requireSiteAccess = (requiredPermission = null) => {
  return async (req, res, next) => {
    if (!req.site) {
      return res.status(400).json({
        success: false,
        message: 'Site context required'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Super admin has access to everything
    if (req.user.platformRole === 'super_admin') {
      return next();
    }

    // Site owner has full access
    if (req.isOwner) {
      return next();
    }

    // Check if user has access to this site
    if (!req.siteRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this site'
      });
    }

    // Check specific permission if required
    if (requiredPermission && !req.sitePermissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `Permission '${requiredPermission}' required`
      });
    }

    next();
  };
};

// Middleware to get site from subdomain (for public routes)
exports.getSiteFromSubdomain = async (req, res, next) => {
  try {
    const host = req.get('host');
    if (!host) return next();

    // Extract subdomain
    const parts = host.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      
      // Skip if it's www or api
      if (subdomain === 'www' || subdomain === 'api') {
        return next();
      }

      const site = await Site.findOne({ 
        subdomain,
        isActive: true 
      }).populate('owner', 'name avatar');

      if (site) {
        req.site = site;
      }
    }
    
    next();
  } catch (error) {
    console.error('Subdomain site lookup error:', error);
    next();
  }
};