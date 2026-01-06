const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, location, monthlyBudget, savingsGoal, currentSavings } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;
    if (monthlyBudget !== undefined) updateData.monthlyBudget = monthlyBudget;
    if (savingsGoal !== undefined) updateData.savingsGoal = savingsGoal;
    if (currentSavings !== undefined) updateData.currentSavings = currentSavings;

    const userId = req.user?.userId || req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/category-budgets
// @desc    Set per-category budgets for the user
// @access  Private
router.put('/category-budgets', authMiddleware, async (req, res) => {
  try {
    const { budgets } = req.body;

    if (!budgets || typeof budgets !== 'object') {
      return res.status(400).json({ error: 'budgets must be an object keyed by category' });
    }

    const cleaned = {};
    Object.entries(budgets).forEach(([key, val]) => {
      const num = Number(val);
      if (!isNaN(num) && num >= 0) {
        cleaned[key] = num;
      }
    });

    const userId = req.user?.userId || req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { categoryBudgets: cleaned },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Category budgets updated', categoryBudgets: user.categoryBudgets || {} });
  } catch (error) {
    console.error('Update category budgets error:', error);
    res.status(500).json({ error: 'Server error updating category budgets' });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account and all associated data
// @access  Private
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const { confirmationText } = req.body;
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // GitHub-like confirmation: user must type their email to confirm deletion
    if (!confirmationText || confirmationText.trim() !== user.email) {
      return res.status(400).json({ 
        error: 'Please type your email address to confirm account deletion',
        requiresEmail: true
      });
    }

    // Import Transaction model (lazy import to avoid circular dependencies)
    const Transaction = require('../models/Transaction');
    
    // Delete all user's transactions
    await Transaction.deleteMany({ user: userId });
    
    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({ 
      message: 'Account and all associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error deleting account' });
  }
});

module.exports = router;