/**
 * Database validation script
 * Validates MongoDB connection and collection integrity
 */

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./logger');

// Import models
const User = require('../models/User');
const Post = require('../models/Post');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const Comment = require('../models/Comment');
const Media = require('../models/Media');
const Setting = require('../models/Setting');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cms', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// Validate collections
const validateCollections = async () => {
  const results = {
    users: { status: 'unknown', count: 0, issues: [] },
    posts: { status: 'unknown', count: 0, issues: [] },
    categories: { status: 'unknown', count: 0, issues: [] },
    tags: { status: 'unknown', count: 0, issues: [] },
    comments: { status: 'unknown', count: 0, issues: [] },
    media: { status: 'unknown', count: 0, issues: [] },
    settings: { status: 'unknown', count: 0, issues: [] }
  };
  
  // Check users
  try {
    const userCount = await User.countDocuments();
    results.users.count = userCount;
    
    if (userCount === 0) {
      results.users.issues.push('No users found. Run the seeder script to create initial users.');
      results.users.status = 'warning';
    } else {
      // Check for admin user
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 0) {
        results.users.issues.push('No admin users found. Create an admin user for full functionality.');
        results.users.status = 'warning';
      } else {
        results.users.status = 'ok';
      }
    }
  } catch (error) {
    results.users.issues.push(`Error: ${error.message}`);
    results.users.status = 'error';
  }
  
  // Check posts
  try {
    const postCount = await Post.countDocuments();
    results.posts.count = postCount;
    results.posts.status = 'ok';
  } catch (error) {
    results.posts.issues.push(`Error: ${error.message}`);
    results.posts.status = 'error';
  }
  
  // Check categories
  try {
    const categoryCount = await Category.countDocuments();
    results.categories.count = categoryCount;
    results.categories.status = 'ok';
  } catch (error) {
    results.categories.issues.push(`Error: ${error.message}`);
    results.categories.status = 'error';
  }
  
  // Check tags
  try {
    const tagCount = await Tag.countDocuments();
    results.tags.count = tagCount;
    results.tags.status = 'ok';
  } catch (error) {
    results.tags.issues.push(`Error: ${error.message}`);
    results.tags.status = 'error';
  }
  
  // Check comments
  try {
    const commentCount = await Comment.countDocuments();
    results.comments.count = commentCount;
    results.comments.status = 'ok';
  } catch (error) {
    results.comments.issues.push(`Error: ${error.message}`);
    results.comments.status = 'error';
  }
  
  // Check media
  try {
    const mediaCount = await Media.countDocuments();
    results.media.count = mediaCount;
    results.media.status = 'ok';
  } catch (error) {
    results.media.issues.push(`Error: ${error.message}`);
    results.media.status = 'error';
  }
  
  // Check settings
  try {
    const settingCount = await Setting.countDocuments();
    results.settings.count = settingCount;
    results.settings.status = 'ok';
  } catch (error) {
    results.settings.issues.push(`Error: ${error.message}`);
    results.settings.status = 'error';
  }
  
  return results;
};

// Run validation
const runValidation = async () => {
  console.log('🔍 Starting database validation...\n');
  
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Database validation failed: Could not connect to MongoDB');
    process.exit(1);
  }
  
  const results = await validateCollections();
  
  console.log('📊 Database Validation Results:');
  console.log('===============================\n');
  
  for (const [collection, data] of Object.entries(results)) {
    const statusIcon = data.status === 'ok' ? '✅' : data.status === 'warning' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${collection.toUpperCase()}:`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Count: ${data.count}`);
    
    if (data.issues.length > 0) {
      console.log('   Issues:');
      data.issues.forEach(issue => console.log(`     • ${issue}`));
    }
    
    console.log('');
  }
  
  // Check for any errors
  const hasErrors = Object.values(results).some(data => data.status === 'error');
  
  if (hasErrors) {
    console.error('❌ Database validation completed with errors. Please fix the issues before proceeding.');
    process.exit(1);
  } else {
    console.log('✅ Database validation completed successfully!');
    process.exit(0);
  }
};

// Run the validation if this script is executed directly
if (require.main === module) {
  runValidation();
}

module.exports = {
  validateCollections
};