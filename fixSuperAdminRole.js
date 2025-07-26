const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const fixSuperAdminRole = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const result = await User.updateOne(
      { email: 'superadmin@fusionx.com' },
      { legacyRole: 'super_admin' }
    );
    
    console.log('Update result:', result);
    
    const user = await User.findOne({ email: 'seradmin@fusionx.com' });
    console.log('Updated user:', user);
    up
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixSuperAdminRole();