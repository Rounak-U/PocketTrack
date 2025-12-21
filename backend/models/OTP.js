const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 5 minutes
  },
});

// Index for faster queries
otpSchema.index({ email: 1 });

// Method to check if OTP is expired
otpSchema.methods.isExpired = function() {
  return Date.now() - this.createdAt > 5 * 60 * 1000; // 5 minutes
};

// Method to check if max attempts reached
otpSchema.methods.maxAttemptsReached = function() {
  return this.attempts >= 3;
};

// Static method to generate OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

module.exports = mongoose.model('OTP', otpSchema);