const express = require('express');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get all transactions for user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, type, startDate, endDate } = req.query;

    const query = { user: req.user.userId };

    if (category) query.category = category;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalTransactions: count
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { amount, description, category, type, date, paymentMethod, tags } = req.body;

    const transaction = new Transaction({
      user: req.user.userId,
      amount,
      description,
      category,
      type,
      date: date || Date.now(),
      paymentMethod,
      tags
    });

    await transaction.save();
    res.status(201).json({ transaction });
  } catch (error) {
    console.error('Create transaction error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get transaction by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { amount, description, category, type, date, paymentMethod, tags } = req.body;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      {
        amount,
        description,
        category,
        type,
        date,
        paymentMethod,
        tags
      },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Update transaction error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/transactions/seed/january
// @desc    Insert a small set of January dummy transactions for the authenticated user
// @access  Private
router.post('/seed/january', authMiddleware, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const startOfJan = new Date(year, 0, 1);
    const endOfJan = new Date(year, 1, 0, 23, 59, 59, 999);

    const janDate = (day) => new Date(year, 0, day);

    const samples = [
      { amount: 52000, description: 'January Salary', category: 'Other', type: 'income', date: janDate(1), paymentMethod: 'Bank Transfer', tags: ['seed', 'jan'] },
      { amount: 7500, description: 'Freelance UI Project', category: 'Other', type: 'income', date: janDate(5), paymentMethod: 'Bank Transfer', tags: ['seed', 'jan'] },
      { amount: 1800, description: 'Metro & Cabs', category: 'Transport', type: 'expense', date: janDate(2), paymentMethod: 'UPI', tags: ['seed', 'jan'] },
      { amount: 6200, description: 'Groceries - FreshMart', category: 'Food', type: 'expense', date: janDate(3), paymentMethod: 'Debit Card', tags: ['seed', 'jan'] },
      { amount: 2300, description: 'Internet + Mobile Bills', category: 'Bills', type: 'expense', date: janDate(4), paymentMethod: 'UPI', tags: ['seed', 'jan'] },
      { amount: 2800, description: 'Streaming & Apps', category: 'Entertainment', type: 'expense', date: janDate(6), paymentMethod: 'Credit Card', tags: ['seed', 'jan'] },
      { amount: 5400, description: 'Clothing - Winter', category: 'Shopping', type: 'expense', date: janDate(8), paymentMethod: 'Credit Card', tags: ['seed', 'jan'] },
      { amount: 1500, description: 'Health Checkup', category: 'Healthcare', type: 'expense', date: janDate(9), paymentMethod: 'Debit Card', tags: ['seed', 'jan'] },
      { amount: 3200, description: 'Books & Courses', category: 'Education', type: 'expense', date: janDate(10), paymentMethod: 'UPI', tags: ['seed', 'jan'] },
      { amount: 900, description: 'Coffee & Quick Bites', category: 'Food', type: 'expense', date: janDate(11), paymentMethod: 'UPI', tags: ['seed', 'jan'] },
      { amount: 2100, description: 'Movies & Events', category: 'Entertainment', type: 'expense', date: janDate(12), paymentMethod: 'UPI', tags: ['seed', 'jan'] },
    ];

    let inserted = 0;

    for (const sample of samples) {
      const exists = await Transaction.findOne({
        user: req.user.userId,
        description: sample.description,
        amount: sample.amount,
        type: sample.type,
        date: { $gte: startOfJan, $lte: endOfJan }
      });

      if (!exists) {
        await Transaction.create({ ...sample, user: req.user.userId });
        inserted += 1;
      }
    }

    res.json({
      message: 'January dummy data processed',
      inserted,
      attempted: samples.length,
      year
    });
  } catch (error) {
    console.error('Seed January error:', error);
    res.status(500).json({ error: 'Failed to seed January data' });
  }
});

module.exports = router;