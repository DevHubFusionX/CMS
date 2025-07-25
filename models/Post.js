const mongoose = require('mongoose');

// Schema for post versions (for version history)
const PostVersionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot be more than 500 characters']
  },
  featuredImage: {
    type: String
  },
  galleryImages: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'draft'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  tags: [{
    type: String
  }],
  // SEO fields
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot be more than 160 characters']
  },
  focusKeyword: {
    type: String,
    maxlength: [100, 'Focus keyword cannot be more than 100 characters']
  },
  // Scheduling
  scheduledDate: {
    type: Date
  },
  // Multilingual support
  language: {
    type: String,
    default: 'en'
  },
  translations: [{
    language: String,
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  }],
  // Version history
  versions: [PostVersionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date
  }
});

// Create slug from title before saving if not provided
PostSchema.pre('save', async function(next) {
  // Only auto-generate slug if not provided and title is modified
  if (!this.slug && this.isModified('title')) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check for existing slugs and append number if needed
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  
  // Save current version if content is modified
  if (this.isModified('content')) {
    this.versions.push({
      content: this.content,
      createdAt: Date.now(),
      createdBy: this.author
    });
    
    // Keep only the last 10 versions
    if (this.versions.length > 10) {
      this.versions.shift(); // Remove oldest version
    }
  }
  
  // Set published date if status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  this.updatedAt = Date.now();
  next();
});

// Index for better search performance
PostSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Virtual for word count
PostSchema.virtual('wordCount').get(function() {
  if (!this.content) return 0;
  return this.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
});

// Method to get reading time
PostSchema.methods.getReadingTime = function() {
  const wordsPerMinute = 200;
  const wordCount = this.wordCount;
  return Math.ceil(wordCount / wordsPerMinute);
};

// Check for scheduled posts that need to be published
PostSchema.statics.publishScheduledPosts = async function() {
  const now = new Date();
  const scheduledPosts = await this.find({
    status: 'scheduled',
    scheduledDate: { $lte: now }
  });
  
  for (const post of scheduledPosts) {
    post.status = 'published';
    post.publishedAt = now;
    await post.save();
  }
  
  return scheduledPosts.length;
};

module.exports = mongoose.model('Post', PostSchema);