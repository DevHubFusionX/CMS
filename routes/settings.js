const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get all settings
// @access  Private
router.get('/', protect, async (req, res) => {
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
// @access  Private
router.get('/group/:group', protect, async (req, res) => {
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

    // Validate input and limit iterations to prevent DoS
    if (typeof settings !== 'object' || settings === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings data'
      });
    }

    const keys = Object.keys(settings);
    const maxSettings = 50; // Limit to 50 settings per request
    
    if (keys.length > maxSettings) {
      return res.status(400).json({
        success: false,
        message: `Too many settings. Maximum ${maxSettings} allowed per request`
      });
    }

    // Update each setting with controlled iteration
    for (let i = 0; i < Math.min(keys.length, maxSettings); i++) {
      const key = keys[i];
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