const mongoose = require('mongoose');
const { seedRoles } = require('./utils/roleSeeder');
require('dotenv').config();

const seedNewRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');
    
    // Seed roles
    await seedRoles();
    
    console.log('✅ Role seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    process.exit(1);
  }
};

seedNewRoles();