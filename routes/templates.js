const express = require('express');
const router = express.Router();
const { TemplateManager } = require('../utils/templateManager');

// @desc    Get all templates
// @route   GET /api/templates
// @access  Public
router.get('/', (req, res) => {
  try {
    const templates = TemplateManager.getAllTemplates();
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get templates by type
// @route   GET /api/templates/type/:type
// @access  Public
router.get('/type/:type', (req, res) => {
  try {
    const { type } = req.params;
    const templates = TemplateManager.getTemplatesByType(type);
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get single template
// @route   GET /api/templates/:id
// @access  Public
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const template = TemplateManager.getTemplate(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all color schemes
// @route   GET /api/templates/color-schemes
// @access  Public
router.get('/color-schemes', (req, res) => {
  try {
    const colorSchemes = TemplateManager.getAllColorSchemes();
    
    res.json({
      success: true,
      data: colorSchemes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Generate template CSS
// @route   GET /api/templates/:templateId/css/:colorSchemeId
// @access  Public
router.get('/:templateId/css/:colorSchemeId', (req, res) => {
  try {
    const { templateId, colorSchemeId } = req.params;
    const css = TemplateManager.generateTemplateCSS(templateId, colorSchemeId);
    
    res.setHeader('Content-Type', 'text/css');
    res.send(css);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;