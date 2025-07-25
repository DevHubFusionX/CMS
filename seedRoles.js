const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { seedRoles } = require('./utils/roleSeeder');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Run seeder
const runSeeder = async () => {
  try {
    await connectDB();
    await seedRoles();
    console.log('✅ Role seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeeder();