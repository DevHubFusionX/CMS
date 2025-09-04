const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  // Legacy role field for backward compatibility
  legacyRole: {
    type: String,
    enum: ['subscriber', 'contributor', 'author', 'editor', 'admin', 'super_admin'],
    default: 'subscriber'
  },
  // Platform-level role (super_admin for platform owner)
  platformRole: {
    type: String,
    enum: ['user', 'super_admin'],
    default: 'user'
  },
  // Sites owned by this user
  ownedSites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site'
  }],
  // Sites where user has access (member of)
  memberSites: [{
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site'
    },
    role: String,
    joinedAt: { type: Date, default: Date.now }
  }],
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: String,
  emailVerificationExpire: Date,
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  tokenBlacklist: [{
    token: String,
    blacklistedAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate password before hashing
UserSchema.pre('validate', function(next) {
  if (this.isModified('password') && this.password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&-])[A-Za-z\d@$!%*?&-]{8,}$/;
    if (!passwordRegex.test(this.password)) {
      this.invalidate('password', 'Password must contain at least 8 characters with uppercase, lowercase, number and special character');
    }
  }
  next();
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d'
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate email verification OTP
// Note: This method should only be called from properly authorized routes
UserSchema.methods.generateEmailOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  
  this.emailVerificationOTP = otp;
  this.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return otp;
};

module.exports = mongoose.model('User', UserSchema);