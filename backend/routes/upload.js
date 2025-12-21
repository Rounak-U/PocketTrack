const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const pdfParse = require('pdf-parse');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const { categorizeTransaction } = require('../utils/categorization');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for CSV files
const csvFileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// File filter for receipt files (PDF, images)
const receiptFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];
  const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, PNG, and WebP files are allowed'), false);
  }
};

const receiptUpload = multer({
  storage: storage,
  fileFilter: receiptFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   POST /api/upload/upi-csv
// @desc    Upload and process UPI CSV file
// @access  Private
router.post('/upi-csv', authMiddleware, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const filePath = req.file.path;
    const transactions = [];
    let processedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    // Parse CSV file
    const parsePromise = new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            const normalizedTransaction = normalizeUPITransaction(row, req.user.userId);
            if (normalizedTransaction) {
              transactions.push(normalizedTransaction);
            }
          } catch (error) {
            console.error('Error processing row:', error);
            errorCount++;
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    await parsePromise;

    // Remove duplicates based on transaction reference
    const uniqueTransactions = removeDuplicates(transactions);
    duplicateCount = transactions.length - uniqueTransactions.length;

    // Save transactions to database
    if (uniqueTransactions.length > 0) {
      const savedTransactions = await Transaction.insertMany(uniqueTransactions);
      processedCount = savedTransactions.length;
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      message: 'CSV file processed successfully',
      stats: {
        totalRows: transactions.length,
        processedTransactions: processedCount,
        duplicatesRemoved: duplicateCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('CSV upload error:', error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.message === 'Only CSV files are allowed') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Server error processing CSV file' });
  }
});

// Function to normalize UPI transaction data
function normalizeUPITransaction(row, userId) {
  // Common UPI CSV column names (case insensitive)
  const columnMap = {
    date: findColumn(row, ['date', 'txn date', 'transaction date', 'datetime']),
    amount: findColumn(row, ['amount', 'txn amount', 'transaction amount', 'value']),
    type: findColumn(row, ['type', 'txn type', 'transaction type', 'debit/credit', 'dr/cr']),
    description: findColumn(row, ['description', 'narration', 'particulars', 'details', 'merchant']),
    reference: findColumn(row, ['reference', 'ref no', 'txn id', 'transaction id', 'utr'])
  };

  // Skip if essential columns are missing
  if (!columnMap.date || !columnMap.amount) {
    return null;
  }

  const rawDate = row[columnMap.date];
  const rawAmount = row[columnMap.amount];
  const rawType = columnMap.type ? row[columnMap.type] : '';
  const rawDescription = columnMap.description ? row[columnMap.description] : '';
  const reference = columnMap.reference ? row[columnMap.reference] : '';

  // Parse and normalize date
  const normalizedDate = normalizeDate(rawDate);
  if (!normalizedDate) {
    return null; // Skip invalid dates
  }

  // Parse and normalize amount
  const normalizedAmount = normalizeAmount(rawAmount);
  if (normalizedAmount === null) {
    return null; // Skip invalid amounts
  }

  // Determine transaction type
  const transactionType = determineTransactionType(rawType, normalizedAmount);

  // Categorize transaction
  const category = categorizeTransaction(rawDescription);

  return {
    user: userId,
    amount: Math.abs(normalizedAmount),
    description: rawDescription || 'UPI Transaction',
    category: category,
    type: transactionType,
    date: normalizedDate.toDate(),
    paymentMethod: 'UPI',
    tags: ['UPI', reference ? 'REF:' + reference : ''].filter(Boolean)
  };
}

// Helper function to find column name (case insensitive)
function findColumn(row, possibleNames) {
  const rowKeys = Object.keys(row);
  for (const key of rowKeys) {
    const lowerKey = key.toLowerCase().trim();
    if (possibleNames.some(name => lowerKey.includes(name.toLowerCase()))) {
      return key;
    }
  }
  return null;
}

// Normalize date formats
function normalizeDate(dateStr) {
  if (!dateStr) return null;

  const dateString = dateStr.toString().trim();

  // Common date formats
  const formats = [
    'DD/MM/YYYY',
    'DD-MM-YYYY',
    'MM/DD/YYYY',
    'MM-DD-YYYY',
    'YYYY-MM-DD',
    'DD MMM YYYY',
    'MMM DD, YYYY',
    'YYYY-MM-DD HH:mm:ss',
    'DD/MM/YYYY HH:mm:ss',
    'DD-MM-YYYY HH:mm:ss'
  ];

  for (const format of formats) {
    const parsed = moment(dateString, format, true);
    if (parsed.isValid()) {
      return parsed;
    }
  }

  return null;
}

// Normalize amount (handle commas, currency symbols, etc.)
function normalizeAmount(amountStr) {
  if (!amountStr) return null;

  const amountString = amountStr.toString().trim();

  // Remove currency symbols and commas
  const cleaned = amountString.replace(/[₹$€£¥,\s]/g, '');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

// Determine transaction type from various indicators
function determineTransactionType(typeStr, amount) {
  const type = typeStr.toLowerCase().trim();

  if (type.includes('debit') || type.includes('dr') || type.includes('out') || amount < 0) {
    return 'expense';
  } else if (type.includes('credit') || type.includes('cr') || type.includes('in') || amount > 0) {
    return 'income';
  }

  // Default to expense for UPI transactions (usually payments)
  return 'expense';
}

// Remove duplicate transactions based on reference, date, and amount
function removeDuplicates(transactions) {
  const seen = new Set();
  return transactions.filter(transaction => {
    const key = `${transaction.tags.find(tag => tag.startsWith('REF:')) || ''}-${transaction.date.getTime()}-${transaction.amount}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

module.exports = router;