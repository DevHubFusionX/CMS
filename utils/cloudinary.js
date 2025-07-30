const cloudinary = require('cloudinary').v2
require('dotenv').config()

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

console.log('✅ Cloudinary configured with environment variables')

// Upload image to Cloudinary
const uploadImage = async (file, options = {}) => {
  try {
    console.log('Starting Cloudinary upload...')
    console.log('File type:', typeof file)
    console.log('File buffer length:', file?.length || 'No length property')

    // Default options
    const uploadOptions = {
      folder: options.folder || 'cms',
      resource_type: 'auto',
      ...options
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            console.log('Cloudinary upload success:', result.public_id)
            resolve(result)
          }
        }
      )

      uploadStream.end(file)
    })

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    }
  } catch (error) {
    console.error('Cloudinary upload failed:', error)
    throw new Error(`Cloudinary upload failed: ${error.message}`)
  }
}

// Delete image from Cloudinary
const deleteImage = async publicId => {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete failed:', error.message)
  }
}

module.exports = {
  uploadImage,
  deleteImage
}
