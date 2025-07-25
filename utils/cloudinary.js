const cloudinary = require('cloudinary').v2;

// Hardcoded configuration for testing
// TODO: Move back to environment variables later
cloudinary.config({
  cloud_name: 'degktbk01',
  api_key: '699773516329615',
  api_secret: 'a8F60dJh6h9u26WL8c7bWwr6BGE'
});

console.log('🚨 WARNING: Using hardcoded Cloudinary credentials!');
console.log('✅ Cloudinary configured successfully');

// Upload image to Cloudinary
const uploadImage = async (file, folder = 'cms') => {
  try {
    console.log('Starting Cloudinary upload...');
    console.log('File type:', typeof file);
    console.log('File buffer length:', file?.length || 'No length property');
    
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result.public_id);
            resolve(result);
          }
        }
      );
      
      uploadStream.end(file);
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete failed:', error.message);
  }
};

module.exports = {
  uploadImage,
  deleteImage
};