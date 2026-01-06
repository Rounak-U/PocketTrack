const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if not using OAuth
      return !this.googleId && !this.mojoAuthId;
    },
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  monthlyBudget: {
    type: Number,
    default: 0
  },
  savingsGoal: {
    type: Number,
    default: 0
  },
  currentSavings: {
    type: Number,
    default: 0
  },
  categoryBudgets: {
    type: Map,
    of: Number,
    default: {}
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // OAuth fields
  googleId: {
    type: String,
    sparse: true
  },
  mojoAuthId: {
    type: String,
    sparse: true
  },
  avatar: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  // If no password is set (OAuth-only account), avoid calling bcrypt.compare
  if (!this.password) {
    return false;
  }

  if (!candidatePassword) {
    return false;
  }

  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);