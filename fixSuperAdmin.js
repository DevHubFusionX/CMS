const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
require('dotenv').config();

const fixSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');
    
    // Find super_admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      console.log('❌ Super admin role not found. Run seedNewRoles.js first');
      process.exit(1);
    }
    
    // Update user to super_admin
    const result = await User.updateOne(
      { email: 'superadmin@fusionx.com' },
      { 
        role: superAdminRole._id,
        legacyRole: 'super_admin'
      }
    );
    
    if (result.matchedCount === 0) {
      console.log('❌ User superadmin@fusionx.com not found');
    } else {
      console.log('✅ Updated superadmin@fusionx.com to super_admin role');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixSuperAdmin();