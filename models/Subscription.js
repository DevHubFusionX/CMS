const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'business'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing'],
    default: 'active'
  },
  billing: {
    interval: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    nextBillingDate: Date,
    lastBillingDate: Date
  },
  paymentMethod: {
    provider: String, // stripe, paypal, etc.
    customerId: String,
    subscriptionId: String
  },
  usage: {
    aiCreditsUsed: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 },
    bandwidthUsed: { type: Number, default: 0 }
  },
  trialEndsAt: Date,
  cancelledAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);