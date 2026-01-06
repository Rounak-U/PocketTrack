const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary data
// @access  Private
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current month date range for metrics calculation
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Query transactions for current month (for metrics)
    const monthlyTransactions = await Transaction.find({
      user: req.user.userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ date: -1 });

    // Get ALL transactions for recent transactions list (sorted by date, newest first)
    const allTransactions = await Transaction.find({
      user: req.user.userId
    }).sort({ date: -1 });

    // Calculate metrics (using monthly transactions)
    const totalSpend = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const transactionCount = monthlyTransactions.length;

    // Calculate top category (using monthly transactions)
    const categorySpending = {};
    monthlyTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        categorySpending[transaction.category] =
          (categorySpending[transaction.category] || 0) + transaction.amount;
      });

    const topCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    // Calculate savings rate (only if budget is set)
    const savingsRate = user.monthlyBudget > 0 ?
      Math.max(0, ((user.monthlyBudget - totalSpend) / user.monthlyBudget) * 100) : null;

    // Get all transactions for display (sorted by date, newest first)
    const recentTransactions = allTransactions;

    // Calculate budget progress (only if budget is set)
    const budgetProgress = user.monthlyBudget > 0 ?
      Math.min(100, (totalSpend / user.monthlyBudget) * 100) : null;

    res.json({
      summary: {
        totalSpend,
        totalIncome,
        netIncome: totalIncome - totalSpend,
        transactionCount,
        topCategory,
        savingsRate,
        monthlyBudget: user.monthlyBudget,
        currentSavings: user.currentSavings,
        savingsGoal: user.savingsGoal,
        budgetProgress,
        recentTransactions,
        categoryBudgets: user.categoryBudgets || {}
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;