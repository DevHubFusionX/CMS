const Subscription = require('../models/Subscription');
const Site = require('../models/Site');

// Pricing plans
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      customDomain: false,
      aiCredits: 10,
      maxUsers: 1,
      maxStorage: 100,
      analytics: false,
      backups: false
    }
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    features: {
      customDomain: true,
      aiCredits: 100,
      maxUsers: 5,
      maxStorage: 1000,
      analytics: true,
      backups: true
    }
  },
  business: {
    name: 'Business',
    price: 29.99,
    features: {
      customDomain: true,
      aiCredits: 500,
      maxUsers: 20,
      maxStorage: 5000,
      analytics: true,
      backups: true
    }
  }
};

// @desc    Get pricing plans
// @route   GET /api/subscriptions/plans
// @access  Public
exports.getPlans = async (req, res) => {
  try {
    res.json({
      success: true,
      data: PLANS
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get site subscription
// @route   GET /api/subscriptions/site/:siteId
// @access  Private
exports.getSiteSubscription = async (req, res) => {
  try {
    const site = await Site.findById(req.params.siteId);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check if user owns the site
    if (site.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const subscription = await Subscription.findOne({ site: req.params.siteId });

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upgrade site subscription
// @route   POST /api/subscriptions/upgrade
// @access  Private
exports.upgradePlan = async (req, res) => {
  try {
    const { siteId, plan, interval = 'monthly' } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan'
      });
    }

    const site = await Site.findById(siteId);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check if user owns the site
    if (site.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Calculate price based on interval
    const planPrice = PLANS[plan].price;
    const amount = interval === 'yearly' ? planPrice * 10 : planPrice; // 2 months free for yearly

    // Update or create subscription
    let subscription = await Subscription.findOne({ site: siteId });
    
    if (subscription) {
      subscription.plan = plan;
      subscription.billing.interval = interval;
      subscription.billing.amount = amount;
      subscription.billing.nextBillingDate = new Date(Date.now() + (interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        site: siteId,
        plan,
        billing: {
          interval,
          amount,
          nextBillingDate: new Date(Date.now() + (interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
        }
      });
    }

    // Update site features
    site.subscription.plan = plan;
    site.subscription.features = PLANS[plan].features;
    await site.save();

    res.json({
      success: true,
      data: subscription,
      message: `Successfully upgraded to ${PLANS[plan].name} plan`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscriptions/cancel
// @access  Private
exports.cancelSubscription = async (req, res) => {
  try {
    const { siteId } = req.body;

    const site = await Site.findById(siteId);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check if user owns the site
    if (site.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const subscription = await Subscription.findOne({ site: siteId });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Mark as cancelled
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    // Downgrade to free plan
    site.subscription.plan = 'free';
    site.subscription.features = PLANS.free.features;
    await site.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get usage stats
// @route   GET /api/subscriptions/usage/:siteId
// @access  Private
exports.getUsageStats = async (req, res) => {
  try {
    const site = await Site.findById(req.params.siteId);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check if user owns the site
    if (site.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const subscription = await Subscription.findOne({ site: req.params.siteId });
    const planLimits = PLANS[site.subscription.plan].features;

    const usage = {
      aiCredits: {
        used: subscription?.usage?.aiCreditsUsed || 0,
        limit: planLimits.aiCredits,
        percentage: Math.round(((subscription?.usage?.aiCreditsUsed || 0) / planLimits.aiCredits) * 100)
      },
      storage: {
        used: site.stats.storageUsed,
        limit: planLimits.maxStorage,
        percentage: Math.round((site.stats.storageUsed / planLimits.maxStorage) * 100)
      },
      users: {
        used: 1, // TODO: Count actual site users
        limit: planLimits.maxUsers,
        percentage: Math.round((1 / planLimits.maxUsers) * 100)
      }
    };

    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};