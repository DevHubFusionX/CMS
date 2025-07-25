const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['visitor', 'subscriber', 'contributor', 'author', 'editor', 'admin', 'super_admin']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      // Content permissions
      'view_posts', 'create_posts', 'edit_own_posts', 'edit_all_posts', 'delete_own_posts', 'delete_all_posts', 'publish_posts', 'create_drafts', 'submit_for_review',
      // Media permissions
      'upload_media', 'manage_own_media', 'manage_all_media',
      // User permissions
      'create_users', 'edit_users', 'delete_users', 'manage_roles', 'view_profile', 'edit_own_profile',
      // Category/Tag permissions
      'manage_categories', 'manage_tags',
      // Comment permissions
      'create_comments', 'moderate_comments', 'delete_comments', 'manage_own_comments',
      // Page permissions
      'create_pages', 'edit_pages', 'delete_pages',
      // Settings permissions
      'manage_settings', 'view_analytics',
      // System permissions
      'access_dashboard', 'manage_plugins', 'manage_themes', 'manage_sites'
    ]
  }],
  level: {
    type: Number,
    required: true,
    min: 0,
    max: 7
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Role', RoleSchema);