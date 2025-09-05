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
router.post('/test', protect, (req, res) => {
  res.json({ success: true, message: 'Auth working', user: req.user.name });
});

// Protected routes
router.get('/', protect, getUserSites);
router.post('/', async (req, res) => {
  try {
    console.log('🚀 Site creation request received');
    console.log('📋 Headers auth:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Manual auth check
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      console.log('❌ No token found');
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    console.log('🔑 Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded, user ID:', decoded.id);
    
    const user = await User.findById(decoded.id).populate('role');
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    console.log('👤 User found:', user.name);
    req.user = user;
    
    // Now call createSite
    await createSite(req, res);
  } catch (error) {
    console.log('💥 Error in site creation:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/:id', protect, getSite);
router.put('/:id', protect, updateSite);
router.delete('/:id', protect, deleteSite);

module.exports = router;