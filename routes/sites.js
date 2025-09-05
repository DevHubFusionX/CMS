const express = require('express');
const {
  createSite,
  getUserSites,
  getSite,
  updateSite,
  deleteSite,
  getSiteBySubdomain,
  checkSubdomain
} = require('../controllers/siteController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/check-subdomain/:subdomain', checkSubdomain);
router.get('/public/:subdomain', getSiteBySubdomain);

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Sites route working' });
});

router.post('/test', protect, (req, res) => {
  res.json({ success: true, message: 'Auth working', user: req.user.name });
});

// Protected routes
router.get('/', (req, res, next) => {
  console.log('🔍 GET /api/sites called');
  console.log('📋 Auth header:', req.headers.authorization ? 'Present' : 'Missing');
  protect(req, res, (err) => {
    if (err) {
      console.log('❌ Protect middleware error:', err.message);
      return next(err);
    }
    console.log('✅ Auth passed, calling getUserSites');
    getUserSites(req, res, next);
  });
});
router.post('/', protect, createSite);
router.get('/:id', protect, getSite);
router.put('/:id', protect, updateSite);
router.delete('/:id', protect, deleteSite);

module.exports = router;