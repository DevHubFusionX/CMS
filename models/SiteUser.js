const mongoose = require('mongoose');

const SiteUserSchema = new mongoose.Schema({
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['site_admin', 'editor', 'writer', 'subscriber'],
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'manage_site', 'manage_users', 'manage_content', 'publish_posts',
      'create_posts', 'edit_posts', 'delete_posts', 'manage_media',
      'manage_comments', 'view_analytics', 'manage_settings'
    ]
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

SiteUserSchema.index({ site: 1, user: 1 }, { unique: true });
SiteUserSchema.index({ site: 1, role: 1 });

module.exports = mongoose.model('SiteUser', SiteUserSchema);