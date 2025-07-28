const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Role = require('./models/Role');

const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get roles
    const authorRole = await Role.findOne({ name: 'author' });
    const editorRole = await Role.findOne({ name: 'editor' });

    if (!authorRole || !editorRole) {
      console.log('❌ Required roles not found. Please run role seeder first.');
      return;
    }

    // Create test author
    const authorExists = await User.findOne({ email: 'author@test.com' });
    if (!authorExists) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const testAuthor = new User({
        name: 'Test Author',
        email: 'author@test.com',
        password: hashedPassword,
        role: authorRole._id,
        legacyRole: 'author',
        isVerified: true
      });
      await testAuthor.save();
      console.log('✅ Test author created: author@test.com / password123');
    } else {
      console.log('ℹ️ Test author already exists');
    }

    // Create test editor
    const editorExists = await User.findOne({ email: 'editor@test.com' });
    if (!editorExists) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const testEditor = new User({
        name: 'Test Editor',
        email: 'editor@test.com',
        password: hashedPassword,
        role: editorRole._id,
        legacyRole: 'editor',
        isVerified: true
      });
      await testEditor.save();
      console.log('✅ Test editor created: editor@test.com / password123');
    } else {
      console.log('ℹ️ Test editor already exists');
    }

    console.log('🎉 Test users setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

createTestUsers();