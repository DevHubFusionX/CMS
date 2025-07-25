const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get MongoDB URI from environment variables
const mongoURI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log('Connected to:', mongoURI.split('@')[1].split('/?')[0]);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });