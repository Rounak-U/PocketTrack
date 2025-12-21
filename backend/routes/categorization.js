const express = require('express');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const { recategorizeUserTransactions, getAllCategories, getCategoryKeywords, addCategoryKeywords } = require('../utils/categorization');

const router = express.Router();

// @route   POST /api/categorization/recategorize
// @desc    Recategorize all transactions for the authenticated user
// @access  Private
router.post('/recategorize', authMiddleware, async (req, res) => {
  try {
    const result = await recategorizeUserTransactions(req.user.userId, Transaction);

    if (result.success) {
      res.json({
        message: 'Transactions recategorized successfully',
        stats: {
          totalTransactions: result.totalTransactions,
          updatedCount: result.updatedCount
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to recategorize transactions', details: result.error });
    }
  } catch (error) {
    console.error('Recategorize error:', error);
    res.status(500).json({ error: 'Server error during recategorization' });
  }
});

// @route   GET /api/categorization/categories
// @desc    Get all available categories and their keywords
// @access  Private
router.get('/categories', authMiddleware, (req, res) => {
  try {
    const categories = getAllCategories();
    const categoryDetails = categories.map(category => ({
      name: category,
      keywords: getCategoryKeywords(category)
    }));

    res.json({ categories: categoryDetails });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/categorization/add-keywords
// @desc    Add custom keywords to a category
// @access  Private
router.post('/add-keywords', authMiddleware, (req, res) => {
  try {
    const { category, keywords } = req.body;

    if (!category || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'Category and keywords array are required' });
    }

    addCategoryKeywords(category, keywords);

    res.json({
      message: 'Keywords added successfully',
      category,
      addedKeywords: keywords
    });
  } catch (error) {
    console.error('Add keywords error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/categorization/stats
// @desc    Get categorization statistics for user
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await Transaction.aggregate([
      { $match: { user: req.user.userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          totalAmount: 1,
          _id: 0
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json({ categorizationStats: stats });
  } catch (error) {
    console.error('Get categorization stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;