const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String
  },
  size: {
    type: Number,
    required: true
  },
  width: Number,
  height: Number,
  format: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for site-specific media
MediaSchema.index({ site: 1, uploadedBy: 1 });
MediaSchema.index({ site: 1, createdAt: -1 });

module.exports = mongoose.model('Media', MediaSchema);