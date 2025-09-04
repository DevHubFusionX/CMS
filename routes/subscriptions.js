const express = require('express');
const {
  getPlans,
  getSiteSubscription,
  upgradePlan,
  cancelSubscription,
  getUsageStats
} = require('../controllers/subscriptionController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/plans', getPlans);

// Protected routes
router.use(protect);

router.get('/site/:siteId', getSiteSubscription);
router.get('/usage/:siteId', getUsageStats);
router.post('/upgrade', upgradePlan);
router.post('/cancel', cancelSubscription);

module.exports = router;