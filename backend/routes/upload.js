const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const pdfParseModule = require('pdf-parse');
const pdfParse = pdfParseModule.PDFParse || pdfParseModule;
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
    'MMM DD YYYY',  // "Dec 03, 2025" without comma
    'DD MMM, YYYY',
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

// @route   POST /api/upload/receipt
// @desc    Upload receipt (PDF/image) and extract transaction data
// @access  Private
router.post('/receipt', authMiddleware, receiptUpload.single('receiptFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No receipt file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let extractedData = null;

    // Parse PDF files
    if (fileExt === '.pdf') {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        // pdf-parse v2.x requires instantiating the PDFParse class
        const pdfParser = new pdfParse({ data: dataBuffer });
        const pdfTextData = await pdfParser.getText();
        // getText() returns an object with 'text' and 'pages' properties
        const pdfText = pdfTextData.text || '';
        extractedData = extractTransactionFromText(pdfText, req.user.userId);
      } catch (error) {
        console.error('PDF parsing error:', error);
        // Continue even if PDF parsing fails - user can manually enter data
      }
    } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt)) {
      // For images, we can't extract text without OCR, so we'll just store the file
      // and let the user manually enter transaction details
      // TODO: Add OCR support (e.g., Tesseract.js) for future enhancement
      extractedData = {
        user: req.user.userId,
        description: 'Receipt Upload',
        category: 'Other',
        type: 'expense',
        date: new Date(),
        paymentMethod: 'Other',
        tags: ['Receipt']
      };
    }

    // If we successfully extracted data and have an amount, create transaction
    // Check if extractedData contains multiple transactions (statement-style)
    const isStatement = Array.isArray(extractedData);
    let transactions = [];
    let transaction = null;

    if (isStatement && extractedData.length > 0) {
      // Handle multiple transactions from statement
      const receiptInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype
      };

      // Create a transaction for each extracted transaction
      for (const txnData of extractedData) {
        if (txnData && txnData.amount && txnData.amount > 0) {
          txnData.receipt = receiptInfo;
          if (txnData.description && txnData.description !== 'Receipt Upload' && txnData.description !== 'Receipt Transaction') {
            txnData.category = categorizeTransaction(txnData.description);
          }
          const newTxn = new Transaction(txnData);
          await newTxn.save();
          transactions.push(newTxn);
        }
      }
      // Set transaction to first one for backward compatibility
      if (transactions.length > 0) {
        transaction = transactions[0];
      }
    } else if (extractedData && extractedData.amount && extractedData.amount > 0) {
      // Handle single transaction (receipt)
      extractedData.receipt = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype
      };

      if (extractedData.description && extractedData.description !== 'Receipt Upload') {
        extractedData.category = categorizeTransaction(extractedData.description);
      }

      transaction = new Transaction(extractedData);
      await transaction.save();
      transactions = [transaction];
    } else if (extractedData) {
      // Store receipt file info even if we don't have amount
      extractedData.receipt = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype
      };
    }

    // Return transaction data (or extracted data for manual confirmation)
    res.json({
      message: isStatement 
        ? `Statement processed successfully. ${transactions.length} transaction(s) created.`
        : 'Receipt uploaded successfully',
      transaction: transaction ? {
        _id: transaction._id,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        type: transaction.type,
        date: transaction.date,
        receipt: transaction.receipt
      } : null,
      transactions: transactions.length > 0 ? transactions.map(t => ({
        _id: t._id,
        amount: t.amount,
        description: t.description,
        category: t.category,
        type: t.type,
        date: t.date,
        receipt: t.receipt
      })) : null,
      extractedData: extractedData && !isStatement ? {
        amount: extractedData.amount,
        description: extractedData.description,
        date: extractedData.date,
        needsConfirmation: !transaction
      } : null,
      receiptFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/api/upload/receipt/${req.file.filename}`
      }
    });

  } catch (error) {
    console.error('Receipt upload error:', error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.message && error.message.includes('Only PDF')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Server error processing receipt file' });
  }
});

// Extract transaction data from text (PDF content or OCR result)
function extractTransactionFromText(text, userId) {
  const extracted = {
    user: userId,
    amount: null,
    description: '',
    category: 'Other',
    type: 'expense',
    date: new Date(),
    paymentMethod: 'Other',
    tags: ['Receipt']
  };

  // Normalize text for better matching (remove extra whitespace, normalize line breaks)
  const normalizedText = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n');
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Check if this looks like a transaction statement with multiple transactions
  // If so, extract the most recent/largest transaction
  const isStatement = /transaction\s+statement/i.test(text) || 
                      /transaction\s+details/i.test(text) ||
                      /(?:debit|credit).*?(?:debit|credit)/i.test(text) || // Multiple transaction types
                      /(?:Payment\s+to|Paid\s+to).*?(?:Payment\s+to|Paid\s+to)/i.test(text); // Multiple payment entries
  
  if (isStatement) {
    return extractAllFromStatement(text, userId);
  }

  // Extract amount - prioritize amounts near "Total", "Amount", "Grand Total", "Payable", etc.
  const totalKeywords = ['total', 'amount', 'grand total', 'payable', 'paid', 'balance', 'due', 'sum'];
  
  // First, try to find amount near total keywords (more reliable)
  for (const keyword of totalKeywords) {
    const keywordRegex = new RegExp(`${keyword}[\\s:]*([₹$Rs\\.]?\\s*[\\d,]+\\.[\\d]{2}|[₹$Rs\\.]?\\s*[\\d,]+)`, 'gi');
    const match = normalizedText.match(keywordRegex);
    if (match && match.length > 0) {
      const amountMatch = match[match.length - 1]; // Take last match (usually final total)
      const amountStr = amountMatch.replace(new RegExp(keyword, 'gi'), '')
        .replace(/[₹$Rs\\.\\s,]/gi, '').trim();
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0 && amount < 10000000) { // Sanity check: reasonable amount
        extracted.amount = amount;
        break;
      }
    }
  }

  // If no amount found near keywords, look for currency symbols with numbers (but be more careful)
  if (!extracted.amount) {
    const currencyPattern = /[₹$Rs\.]\s*([\d,]+\.\d{2})/gi;
    const matches = [...normalizedText.matchAll(currencyPattern)];
    if (matches.length > 0) {
      // Prefer larger amounts (likely to be totals)
      const amounts = matches.map(m => parseFloat(m[1].replace(/,/g, '')))
        .filter(a => !isNaN(a) && a > 0 && a < 10000000)
        .sort((a, b) => b - a);
      if (amounts.length > 0) {
        extracted.amount = amounts[0]; // Take the largest reasonable amount
      }
    }
  }

  // Extract date - look for dates near "Date", "Transaction Date", "Bill Date", etc.
  const dateKeywords = ['date', 'transaction date', 'bill date', 'invoice date', 'receipt date', 'issued on'];
  let dateFound = false;
  
  for (const keyword of dateKeywords) {
    const keywordRegex = new RegExp(`${keyword}[\\s:]*([\\d]{1,2}[\\/\\-][\\d]{1,2}[\\/\\-][\\d]{2,4}|[\\d]{4}[\\/\\-][\\d]{1,2}[\\/\\-][\\d]{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+[\\d]{1,2},?\\s+[\\d]{4})`, 'gi');
    const match = normalizedText.match(keywordRegex);
    if (match && match.length > 0) {
      const dateStr = match[0].replace(new RegExp(keyword, 'gi'), '').trim();
      const normalizedDate = normalizeDate(dateStr);
      if (normalizedDate) {
        extracted.date = normalizedDate.toDate();
        dateFound = true;
        break;
      }
    }
  }

  // If no date found near keywords, look for date patterns in first few lines (often header)
  if (!dateFound) {
    const datePatterns = [
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
      /\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi
    ];

    // Check first 10 lines for date (usually in header)
    const headerText = lines.slice(0, 10).join(' ');
    for (const pattern of datePatterns) {
      const match = headerText.match(pattern);
      if (match && match.length > 0) {
        const normalizedDate = normalizeDate(match[0]);
        if (normalizedDate) {
          extracted.date = normalizedDate.toDate();
          break;
        }
      }
    }
  }

  // Extract merchant/description - look in first few lines (usually header area)
  // Avoid common receipt words that aren't merchant names
  const excludeWords = ['receipt', 'invoice', 'bill', 'transaction', 'date', 'time', 'total', 'amount', 
                        'paid', 'payment', 'thank', 'you', 'visit', 'again', 'gst', 'tax', 'subtotal'];
  
  // Look for merchant/store name patterns in first 5-10 lines
  const headerLines = lines.slice(0, 10);
  
  // First, try to find explicit merchant/store labels
  for (const line of headerLines) {
    const merchantPattern = /(?:merchant|store|vendor|shop|restaurant|from|to|sold\s+to|bill\s+to)[\s:]+([A-Z][A-Za-z0-9\s&.,'-]{2,50})/i;
    const match = line.match(merchantPattern);
    if (match && match[1]) {
      const merchantName = match[1].trim();
      // Exclude if it's just a date or number
      if (!merchantName.match(/^\d+/) && merchantName.length > 2) {
        extracted.description = merchantName.substring(0, 100);
        break;
      }
    }
  }

  // If no explicit merchant found, look for capitalized lines in header (likely merchant name)
  if (!extracted.description || extracted.description === '') {
    for (const line of headerLines.slice(0, 5)) {
      // Skip lines that are mostly numbers, dates, or common receipt words
      if (line.match(/^\d+/) || line.match(/^\d{1,2}[\/\-]/) || 
          excludeWords.some(word => line.toLowerCase().includes(word))) {
        continue;
      }
      
      // Look for lines that start with capital letter and have reasonable length
      if (line.match(/^[A-Z]/) && line.length >= 3 && line.length <= 60) {
        // Check if line doesn't contain too many numbers (likely not a merchant name)
        const numberCount = (line.match(/\d/g) || []).length;
        if (numberCount < line.length / 3) { // Less than 1/3 numbers
          extracted.description = line.substring(0, 100);
          break;
        }
      }
    }
  }

  // If still no description, use first meaningful non-empty line
  if (!extracted.description || extracted.description === '') {
    for (const line of lines) {
      if (line.length >= 3 && line.length <= 100 && 
          !line.match(/^\d+/) && 
          !excludeWords.some(word => line.toLowerCase().startsWith(word))) {
        extracted.description = line.substring(0, 100);
        break;
      }
    }
  }

  // Fallback to default if nothing found
  if (!extracted.description || extracted.description === '') {
    extracted.description = 'Receipt Transaction';
  }

  // Clean up description (remove extra spaces, special chars at start/end)
  extracted.description = extracted.description.trim().replace(/\s+/g, ' ');

  // Try to categorize based on description
  if (extracted.description && extracted.description !== 'Receipt Transaction') {
    extracted.category = categorizeTransaction(extracted.description);
  }

  return extracted;
}

// Extract ALL transactions from statement-style PDF (like PhonePe, bank statements)
function extractAllFromStatement(text, userId) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Pattern to find transaction rows - look for "Payment to" or "Paid to" followed by merchant name
  const transactionStartPattern = /(?:Payment\s+to|Paid\s+to)\s+[A-Z]/i;
  
  const allTransactions = [];
  
  // Find ALL transactions in the statement (don't break after first)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line starts a new transaction
    if (transactionStartPattern.test(line)) {
      // Extract merchant name from "Payment to NETFLIX COM" or "Paid to ZOMATO"
      const merchantMatch = line.match(/(?:Payment\s+to|Paid\s+to)\s+([A-Z][A-Z\s]+?)(?:\s+Transaction|\s+ID|\s+UTR|$)/i);
      if (merchantMatch) {
        const merchantName = merchantMatch[1].trim();
        
        // Look backwards for date (usually 1-2 lines above)
        let transactionDate = null;
        for (let j = Math.max(0, i - 3); j < i; j++) {
          const dateMatch = lines[j].match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})/i);
          if (dateMatch) {
            transactionDate = dateMatch[1];
            break;
          }
        }
        
        // Look forwards for amount (usually in same line or next few lines)
        let transactionAmount = null;
        for (let j = i; j < Math.min(lines.length, i + 5); j++) {
          const amountMatch = lines[j].match(/₹\s*([\d,]+\.?\d*)/);
          if (amountMatch) {
            const amountStr = amountMatch[1].replace(/,/g, '');
            const amount = parseFloat(amountStr);
            if (!isNaN(amount) && amount > 0 && amount < 10000000) {
              transactionAmount = amount;
              break;
            }
          }
        }
        
        // If we have both merchant and amount, create a transaction object
        if (merchantName && transactionAmount) {
          const extracted = {
            user: userId,
            amount: transactionAmount,
            description: '',
            category: 'Other',
            type: 'expense',
            date: new Date(),
            paymentMethod: 'Other',
            tags: ['Receipt']
          };
          
          // Parse date
          if (transactionDate) {
            const dateParts = transactionDate.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})/i);
            if (dateParts) {
              const monthMap = {
                jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
                jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
              };
              const month = monthMap[dateParts[1].toLowerCase()];
              const day = dateParts[2].padStart(2, '0');
              const year = dateParts[3];
              const dateStr = `${day}/${month}/${year}`;
              const normalizedDate = normalizeDate(dateStr);
              if (normalizedDate) {
                extracted.date = normalizedDate.toDate();
              }
            }
          }
          
          // Clean up merchant name
          extracted.description = merchantName
            .replace(/\s+/g, ' ')
            .replace(/\b(?:COM|INC|LTD|PVT|LLC)\b/gi, '')
            .trim()
            .substring(0, 100);
          
          // Remove transaction IDs and other noise
          extracted.description = extracted.description
            .replace(/\b(?:Transaction\s+ID|UTR\s+No\.?|TXN\s+ID)\s*:?\s*[A-Z0-9]+\b/gi, '')
            .replace(/\b[A-Z]{4}\d{20,}\b/g, '')
            .replace(/\bT\d{18,}\b/g, '')
            .replace(/\b\d{12}\b/g, '')
            .replace(/\bPaid\s+by\s+X+\d+\b/gi, '')
            .replace(/\bAUTOPAY\b/gi, '')
            .trim()
            .replace(/\s+/g, ' ');
          
          // Set transaction type (assume expense for debit transactions)
          if (/debit/i.test(line)) {
            extracted.type = 'expense';
          } else if (/credit/i.test(line)) {
            extracted.type = 'income';
          }
          
          // Categorize
          if (extracted.description && extracted.description !== 'Receipt Transaction') {
            extracted.category = categorizeTransaction(extracted.description);
          } else {
            extracted.description = 'Receipt Transaction';
          }
          
          allTransactions.push(extracted);
        }
      }
    }
  }
  
  // Return array of transactions (or single transaction object for backward compatibility if only one found)
  return allTransactions;
}

// @route   GET /api/upload/receipt/:filename
// @desc    Serve receipt file
// @access  Private
router.get('/receipt/:filename', authMiddleware, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Receipt file not found' });
    }

    // Security: Check if file belongs to user's transactions
    // For now, we'll allow any authenticated user to access receipts
    // In production, add additional authorization checks

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving receipt:', error);
    res.status(500).json({ error: 'Error serving receipt file' });
  }
});

module.exports = router;