const cloudinary = require('cloudinary').v2
require('dotenv').config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadImage = async (file, options = {}) => {
  try {
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
            reject(error)
          } else {
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
    throw new Error(`Cloudinary upload failed: ${error.message}`)
  }
}

const deleteImage = async publicId => {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`)
  }
}

module.exports = {
  uploadImage,
  deleteImage
}
