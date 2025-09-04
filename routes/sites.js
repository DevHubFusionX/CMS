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
router.use(protect);

router.route('/')
  .get(getUserSites)
  .post(authorize('admin', 'super_admin', 'author', 'editor'), createSite);

router.route('/:id')
  .get(getSite)
  .put(updateSite)
  .delete(deleteSite);

module.exports = router;