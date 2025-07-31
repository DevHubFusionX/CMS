const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createBackup, getBackupList } = require('../utils/backup');

// @route   POST /api/backup/create
// @desc    Create content backup
// @access  Private (Admin only)
router.post('/create', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const backupFile = await createBackup();
    
    res.status(200).json({
      success: true,
      message: 'Backup created successfully',
      data: { backupFile }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
});

// @route   GET /api/backup/list
// @desc    Get list of available backups
// @access  Private (Admin only)
router.get('/list', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const backups = await getBackupList();
    
    res.status(200).json({
      success: true,
      count: backups.length,
      data: backups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get backup list',
      error: error.message
    });
  }
});

module.exports = router;