const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
console.log('Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
}

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

console.log('\n=== Environment Variables Check ===');
const missingVars = [];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set (${varName.includes('SECRET') ? 'Hidden' : value})`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.error('\n🚨 Missing required environment variables:', missingVars);
  console.error('Please check your .env file in the Server directory');
} else {
  console.log('\n✅ All required environment variables are set');
}

module.exports = {
  isConfigValid: missingVars.length === 0,
  missingVars
};