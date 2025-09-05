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

// Protected routes
router.get('/', protect, getUserSites);
router.post('/', protect, createSite);
router.get('/:id', protect, getSite);
router.put('/:id', protect, updateSite);
router.delete('/:id', protect, deleteSite);

module.exports = router;