const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/,
    maxlength: 50
  },
  customDomain: {
    type: String,
    sparse: true,
    lowercase: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['blog', 'portfolio', 'business', 'news', 'personal'],
    default: 'blog'
  },
  template: {
    type: String,
    default: 'default'
  },
  theme: {
    name: { type: String, default: 'default' },
    colorScheme: { type: String, default: 'default' },
    customizations: {
      primaryColor: { type: String, default: '#3b82f6' },
      secondaryColor: { type: String, default: '#64748b' },
      accentColor: { type: String, default: '#06b6d4' },
      logo: String,
      favicon: String,
      customCSS: String,
      fonts: {
        heading: { type: String, default: 'Inter' },
        body: { type: String, default: 'Inter' }
      }
    }
  },
  settings: {
    title: { type: String, required: true },
    tagline: String,
    description: String,
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    isPublic: { type: Boolean, default: true },
    allowComments: { type: Boolean, default: true },
    allowSubscriptions: { type: Boolean, default: true },
    template: String,
    colorScheme: String,
    features: [String],
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      ogImage: String
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'business'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'cancelled'],
      default: 'active'
    },
    expiresAt: Date,
    features: {
      customDomain: { type: Boolean, default: false },
      aiCredits: { type: Number, default: 10 },
      maxUsers: { type: Number, default: 1 },
      maxStorage: { type: Number, default: 100 }, // MB
      analytics: { type: Boolean, default: false },
      backups: { type: Boolean, default: false }
    }
  },
  stats: {
    totalPosts: { type: Number, default: 0 },
    totalPages: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalSubscribers: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 1 },
    storageUsed: { type: Number, default: 0 }, // MB
    lastActivity: { type: Date, default: Date.now }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isInitialized: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

SiteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

SiteSchema.index({ subdomain: 1 });
SiteSchema.index({ customDomain: 1 });
SiteSchema.index({ owner: 1 });

module.exports = mongoose.model('Site', SiteSchema);