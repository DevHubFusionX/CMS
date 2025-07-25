const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get all settings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.find();
    
    // Convert to key-value object
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    res.status(200).json({
      success: true,
      data: settingsObject
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/settings/group/:group
// @desc    Get settings by group
// @access  Public
router.get('/group/:group', async (req, res) => {
  try {
    const settings = await Setting.find({ group: req.params.group });
    
    // Convert to key-value object
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    res.status(200).json({
      success: true,
      data: settingsObject
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/settings
// @desc    Update settings
// @access  Private (Admin only)
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = req.body;
    const updatedSettings = [];

    // Update each setting
    for (const key in settings) {
      if (settings.hasOwnProperty(key)) {
        const value = settings[key];
        const group = req.query.group || 'general';
        
        // Find and update or create new setting
        let setting = await Setting.findOne({ key });
        
        if (setting) {
          setting.value = value;
          setting = await setting.save();
        } else {
          setting = await Setting.create({
            key,
            value,
            group
          });
        }
        
        updatedSettings.push(setting);
      }
    }

    res.status(200).json({
      success: true,
      data: updatedSettings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;