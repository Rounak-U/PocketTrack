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

module.exports = router;