const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/analytics/monthly
// @desc    Get monthly spending and income trends
// @access  Private
router.get('/monthly', authMiddleware, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), months = 12 } = req.query;

    // Get monthly aggregation for the specified year
    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          user: req.user.userId,
          date: {
            $gte: new Date(year, 0, 1), // January 1st of the year
            $lt: new Date(year + 1, 0, 1)  // January 1st of next year
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          totalExpenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          },
          transactionCount: { $sum: 1 },
          incomeTransactions: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, 1, 0]
            }
          },
          expenseTransactions: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          monthName: {
            $arrayElemAt: [
              ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              '$_id.month'
            ]
          },
          totalIncome: 1,
          totalExpenses: 1,
          netIncome: { $subtract: ['$totalIncome', '$totalExpenses'] },
          transactionCount: 1,
          incomeTransactions: 1,
          expenseTransactions: 1,
          savingsRate: {
            $cond: {
              if: { $gt: ['$totalIncome', 0] },
              then: {
                $multiply: [
                  { $divide: [{ $subtract: ['$totalIncome', '$totalExpenses'] }, '$totalIncome'] },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $sort: { year: 1, month: 1 }
      },
      {
        $limit: parseInt(months)
      }
    ]);

    // Fill in missing months with zero values
    const filledMonthlyData = fillMissingMonths(monthlyData, year, parseInt(months));

    res.json({
      monthlyTrends: filledMonthlyData,
      summary: {
        totalIncome: filledMonthlyData.reduce((sum, month) => sum + month.totalIncome, 0),
        totalExpenses: filledMonthlyData.reduce((sum, month) => sum + month.totalExpenses, 0),
        averageMonthlyIncome: filledMonthlyData.reduce((sum, month) => sum + month.totalIncome, 0) / filledMonthlyData.length,
        averageMonthlyExpenses: filledMonthlyData.reduce((sum, month) => sum + month.totalExpenses, 0) / filledMonthlyData.length,
        totalTransactions: filledMonthlyData.reduce((sum, month) => sum + month.transactionCount, 0)
      }
    });
  } catch (error) {
    console.error('Monthly analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/categories
// @desc    Get spending breakdown by categories
// @access  Private
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const { period = 'month', year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    console.debug(`Category analytics requested by user=${req.user.userId}, period=${period}, year=${year}, month=${month}`);

    // Determine date range based on period
    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0); // Last day of month
        break;
      case 'quarter':
        const quarterStart = Math.floor((month - 1) / 3) * 3;
        startDate = new Date(year, quarterStart, 1);
        endDate = new Date(year, quarterStart + 3, 0);
        break;
      case 'year':
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        break;
      default:
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
    }

    // Category-wise spending aggregation
    const categoryData = await Transaction.aggregate([
      {
        $match: {
          user: req.user.userId,
          type: 'expense',
          date: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalAmount: 1,
          transactionCount: 1,
          averageAmount: { $round: ['$averageAmount', 2] },
          minAmount: 1,
          maxAmount: 1,
          // percentage will be calculated after getting total
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    // Debug: show how many categories were returned
    console.debug('Category aggregation returned', (categoryData && categoryData.length) || 0, 'rows');

    // Calculate total spending for percentages
    const totalSpending = categoryData.reduce((sum, cat) => sum + cat.totalAmount, 0);

    // Add percentage to each category
    const categoryDataWithPercentage = categoryData.map(cat => ({
      ...cat,
      percentage: totalSpending > 0 ? Math.round((cat.totalAmount / totalSpending) * 100 * 100) / 100 : 0
    }));

    // Top spending categories (top 5)
    const topCategories = categoryDataWithPercentage.slice(0, 5);

    // Category trends over time (last 6 months)
    const categoryTrends = await Transaction.aggregate([
      {
        $match: {
          user: req.user.userId,
          type: 'expense',
          date: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            $lte: now
          }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id.category',
          year: '$_id.year',
          month: '$_id.month',
          totalAmount: 1,
          transactionCount: 1
        }
      },
      {
        $sort: { category: 1, year: 1, month: 1 }
      }
    ]);

    res.json({
      categories: categoryDataWithPercentage,
      topCategories,
      categoryTrends,
      period: {
        type: period,
        startDate,
        endDate,
        totalSpending
      }
    });
  } catch (error) {
    console.error('Category analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/trends
// @desc    Get spending trends and patterns
// @access  Private
router.get('/trends', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Daily spending trends
    const dailyTrends = await Transaction.aggregate([
      {
        $match: {
          user: req.user.userId,
          type: 'expense',
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalAmount: 1,
          transactionCount: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Top merchants
    const topMerchants = await Transaction.aggregate([
      {
        $match: {
          user: req.user.userId,
          type: 'expense',
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $toLower: '$description' },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          category: { $first: '$category' }
        }
      },
      {
        $project: {
          _id: 0,
          merchant: '$_id',
          totalAmount: 1,
          transactionCount: 1,
          category: 1
        }
      },
      {
        $sort: { totalAmount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Payment method distribution
    const paymentMethods = await Transaction.aggregate([
      {
        $match: {
          user: req.user.userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          paymentMethod: '$_id',
          totalAmount: 1,
          transactionCount: 1
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    res.json({
      dailyTrends,
      topMerchants,
      paymentMethods,
      period: {
        days,
        startDate,
        endDate: new Date()
      }
    });
  } catch (error) {
    console.error('Trends analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/summary
// @desc    Get analytics summary (legacy endpoint)
// @access  Private
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current month transactions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyTransactions = await Transaction.find({
      user: req.user.userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsRate = user.monthlyBudget > 0 ? ((user.monthlyBudget - totalExpenses) / user.monthlyBudget) * 100 : 0;

    res.json({
      summary: {
        monthlyBudget: user.monthlyBudget,
        currentSavings: user.currentSavings,
        savingsGoal: user.savingsGoal,
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        savingsRate: Math.max(0, savingsRate),
        transactionCount: monthlyTransactions.length
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/spending
// @desc    Get spending analytics by category (legacy endpoint)
// @access  Private
router.get('/spending', authMiddleware, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let startDate;
    const now = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const transactions = await Transaction.find({
      user: req.user.userId,
      type: 'expense',
      date: { $gte: startDate }
    });

    const categorySpending = {};
    transactions.forEach(transaction => {
      if (!categorySpending[transaction.category]) {
        categorySpending[transaction.category] = 0;
      }
      categorySpending[transaction.category] += transaction.amount;
    });

    const spendingByCategory = Object.entries(categorySpending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    res.json({ spendingByCategory, period });
  } catch (error) {
    console.error('Get spending analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/budget
// @desc    Get budget vs actual spending (legacy endpoint)
// @access  Private
router.get('/budget', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyTransactions = await Transaction.find({
      user: req.user.userId,
      type: 'expense',
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalSpent = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
    const remainingBudget = Math.max(0, user.monthlyBudget - totalSpent);
    const budgetUsed = (totalSpent / user.monthlyBudget) * 100;

    res.json({
      budget: {
        totalBudget: user.monthlyBudget,
        totalSpent,
        remainingBudget,
        budgetUsed: Math.min(100, budgetUsed),
        isOverBudget: totalSpent > user.monthlyBudget
      }
    });
  } catch (error) {
    console.error('Get budget analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to fill missing months with zero values
function fillMissingMonths(data, year, monthsCount) {
  const filledData = [];
  const currentDate = new Date();

  for (let i = 0; i < monthsCount; i++) {
    const targetMonth = (currentDate.getMonth() - monthsCount + 1 + i + 12) % 12 + 1;
    const targetYear = year - Math.floor((monthsCount - 1 - i) / 12);

    const existingData = data.find(d => d.month === targetMonth && d.year === targetYear);

    if (existingData) {
      filledData.push(existingData);
    } else {
      filledData.push({
        year: targetYear,
        month: targetMonth,
        monthName: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][targetMonth - 1],
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        transactionCount: 0,
        incomeTransactions: 0,
        expenseTransactions: 0,
        savingsRate: 0
      });
    }
  }

  return filledData;
}

module.exports = router;