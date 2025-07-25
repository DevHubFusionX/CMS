// Simple test to check if .env file is being loaded correctly
const dotenv = require('dotenv');
const path = require('path');

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Try loading .env file
const envPath = path.join(__dirname, '.env');
console.log('Looking for .env at:', envPath);

const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
}

// Check Cloudinary variables
console.log('\n=== Cloudinary Environment Variables ===');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'MISSING');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY || 'MISSING');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING');

// Check if .env file exists
const fs = require('fs');
if (fs.existsSync(envPath)) {
  console.log('\n✅ .env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('File size:', envContent.length, 'characters');
  
  // Check if Cloudinary variables are in the file
  const hasCloudName = envContent.includes('CLOUDINARY_CLOUD_NAME');
  const hasApiKey = envContent.includes('CLOUDINARY_API_KEY');
  const hasApiSecret = envContent.includes('CLOUDINARY_API_SECRET');
  
  console.log('CLOUDINARY_CLOUD_NAME in file:', hasCloudName);
  console.log('CLOUDINARY_API_KEY in file:', hasApiKey);
  console.log('CLOUDINARY_API_SECRET in file:', hasApiSecret);
} else {
  console.log('\n❌ .env file does not exist at:', envPath);
}