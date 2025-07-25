const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const Setting = require('../models/Setting');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cms');

// Create admin user
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }
  } catch (err) {
    console.error(err);
  }
};

// Create default categories
const createDefaultCategories = async () => {
  try {
    const categories = [
      { name: 'Uncategorized', description: 'Default category' },
      { name: 'Technology', description: 'Technology related posts' },
      { name: 'Business', description: 'Business related posts' },
      { name: 'Lifestyle', description: 'Lifestyle related posts' }
    ];

    for (const category of categories) {
      const exists = await Category.findOne({ name: category.name });
      
      if (!exists) {
        await Category.create(category);
        console.log(`Category "${category.name}" created`);
      } else {
        console.log(`Category "${category.name}" already exists`);
      }
    }
  } catch (err) {
    console.error(err);
  }
};

// Create default tags
const createDefaultTags = async () => {
  try {
    const tags = [
      { name: 'Featured' },
      { name: 'Popular' },
      { name: 'Trending' },
      { name: 'Latest' }
    ];

    for (const tag of tags) {
      const exists = await Tag.findOne({ name: tag.name });
      
      if (!exists) {
        await Tag.create(tag);
        console.log(`Tag "${tag.name}" created`);
      } else {
        console.log(`Tag "${tag.name}" already exists`);
      }
    }
  } catch (err) {
    console.error(err);
  }
};

// Create default settings
const createDefaultSettings = async () => {
  try {
    const settings = [
      { key: 'site_name', value: 'My CMS', group: 'general' },
      { key: 'site_description', value: 'A modern content management system', group: 'general' },
      { key: 'site_logo', value: '/uploads/default-logo.png', group: 'appearance' },
      { key: 'primary_color', value: '#3490dc', group: 'appearance' },
      { key: 'posts_per_page', value: 10, group: 'general' },
      { key: 'allow_comments', value: true, group: 'general' },
      { key: 'moderate_comments', value: true, group: 'general' }
    ];

    for (const setting of settings) {
      const exists = await Setting.findOne({ key: setting.key });
      
      if (!exists) {
        await Setting.create(setting);
        console.log(`Setting "${setting.key}" created`);
      } else {
        console.log(`Setting "${setting.key}" already exists`);
      }
    }
  } catch (err) {
    console.error(err);
  }
};

// Run seeders
const seedData = async () => {
  try {
    await createAdminUser();
    await createDefaultCategories();
    await createDefaultTags();
    await createDefaultSettings();
    
    console.log('Data seeded successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Clear data
const clearData = async () => {
  try {
    await User.deleteMany();
    await Category.deleteMany();
    await Tag.deleteMany();
    await Setting.deleteMany();
    
    console.log('Data cleared successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv[2] === '-d') {
  clearData();
} else {
  seedData();
}