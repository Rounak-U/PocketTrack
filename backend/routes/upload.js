const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const moment = require('moment');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const { categorizeTransaction } = require('../utils/categorization');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}.${file.originalname.split('.').pop()}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|csv|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                     file.mimetype === 'application/pdf' ||
                     file.mimetype === 'text/csv' ||
                     file.mimetype === 'application/vnd.ms-excel';
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, CSV, and image files are allowed.'));
    }
  }
});

// Helper function to parse date from various formats
function parseDate(dateString) {
  if (!dateString) return new Date();
  
  // Common date formats
  const formats = [
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'YYYY-MM-DD',
    'DD-MM-YYYY',
    'MM-DD-YYYY',
    'DD.MM.YYYY',
    'MM.DD.YYYY',
    'YYYY/MM/DD',
    'DD/MM/YYYY HH:mm:ss',
    'MM/DD/YYYY HH:mm:ss',
    'YYYY-MM-DD HH:mm:ss',
    'DD-MMM-YYYY',
    'DD MMM YYYY',
    'MMM DD, YYYY', // PhonePe format: Jan 01, 2026
    'MMMM DD, YYYY',
    'DD-MM-YY',
    'MM/DD/YY'
  ];
  
  // Try parsing with moment
  for (const format of formats) {
    const parsed = moment(dateString, format, true);
    if (parsed.isValid()) {
      return parsed.toDate();
    }
  }
  
  // Try standard Date parsing
  const standardDate = new Date(dateString);
  if (!isNaN(standardDate.getTime())) {
    return standardDate;
  }
  
  return new Date();
}

// Helper function to extract amount from text
function extractAmount(text) {
  if (!text) return null;
  
  // Remove currency symbols and extract numeric value
  const amountPatterns = [
    /(?:Rs\.?|INR|₹|\$|USD|EUR|£)?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/gi,
    /(?:Total|Amount|Paid|Payment|Balance|Due)[\s:]*[\-]?\s*(?:Rs\.?|INR|₹|\$|USD)?\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/gi,
    /(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)\s*(?:Rs\.?|INR|₹)/gi
  ];
  
  let maxAmount = 0;
  
  for (const pattern of amountPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > maxAmount) {
        maxAmount = amount;
      }
    }
  }
  
  // If no pattern matched, try simple number extraction
  if (maxAmount === 0) {
    const simpleMatch = text.match(/(\d+\.?\d*)/);
    if (simpleMatch) {
      maxAmount = parseFloat(simpleMatch[1]);
    }
  }
  
  return maxAmount > 0 ? maxAmount : null;
}

// Helper function to extract payment method from text
function extractPaymentMethod(text) {
  if (!text) return 'Other';
  
  const textLower = text.toLowerCase();
  
  if (textLower.match(/\b(upi|gpay|phonepe|paytm|amazon pay|bhim)\b/)) {
    return 'UPI';
  }
  if (textLower.match(/\b(credit card|cc|visa|mastercard|amex)\b/)) {
    return 'Credit Card';
  }
  if (textLower.match(/\b(debit card|dc|atm card)\b/)) {
    return 'Debit Card';
  }
  if (textLower.match(/\b(cash|notes|coins)\b/)) {
    return 'Cash';
  }
  if (textLower.match(/\b(neft|rtgs|imps|bank transfer|transfer)\b/)) {
    return 'Bank Transfer';
  }
  
  return 'Other';
}

// Helper function to extract date from text
function extractDateFromText(text) {
  if (!text) return new Date();
  
  // Date patterns
  const datePatterns = [
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/,
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\b/i,
    /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = parseDate(match[1]);
      if (parsed && !isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  
  return new Date();
}

// Helper function to extract description from text
function extractDescription(text) {
  if (!text) return 'Transaction';
  
  // Common receipt patterns
  const descPatterns = [
    /(?:Merchant|Store|Shop|Vendor)[\s:]+([^\n\r]+)/i,
    /(?:Description|Details|Item|Product)[\s:]+([^\n\r]+)/i,
    /(?:To|For|Paid to)[\s:]+([^\n\r]+)/i
  ];
  
  for (const pattern of descPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Extract first meaningful line (not headers/footers)
  const lines = text.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 5 && 
           !trimmed.match(/^(Date|Time|Amount|Total|Receipt|Invoice|Bill)/i) &&
           !trimmed.match(/^\d+$/);
  });
  
  if (lines.length > 0) {
    return lines[0].trim().substring(0, 200);
  }
  
  return 'Transaction';
}

// Parse text from receipt (PDF or Image OCR result) - single transaction
function parseReceiptText(text) {
  const amount = extractAmount(text);
  const date = extractDateFromText(text);
  const description = extractDescription(text);
  const paymentMethod = extractPaymentMethod(text);
  const category = categorizeTransaction(description);
  
  return {
    amount,
    date,
    description,
    paymentMethod,
    category,
    type: amount > 0 ? 'expense' : 'income'
  };
}

// Parse PhonePe-style transaction statement PDF (multiple transactions)
function parseStatementPDF(text) {
  const transactions = [];
  const seenUTRs = new Set(); // Track UTR numbers to avoid duplicates
  const seenTransactions = new Set(); // Track description+amount+date to avoid duplicates
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Check if it's a PhonePe statement or UPI statement
  const isPhonePeStatement = text.match(/phonepe|transaction statement/i);
  const isUPIStatement = text.match(/transaction statement|upi statement|payment statement/i);
  
  if (!isPhonePeStatement && !isUPIStatement) {
    // Not a statement, treat as single receipt
    return null;
  }
  
  // Pattern to match PhonePe transaction format:
  // Date: "Jan 01, 2026" or "01 Jan 2026"
  // Time: "10:12 am" or "10:12 AM" (usually on next line or same line)
  // Description: "Payment to [Merchant]" or "Paid to [Recipient]"
  // Type: "DEBIT" or "CREDIT"
  // Amount: "₹130" or "130.00"
  // UTR: "UTR No.: 150377500016" or "UTR No: 700371321496"
  
  let currentDate = null;
  let currentTime = null;
  let i = 0;
  
  // Join text for better pattern matching (handle line breaks in PDF extraction)
  const fullText = lines.join(' ');
  
  while (i < lines.length) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    const combinedLine = line + ' ' + nextLine;
    
    // Try to match date pattern (MMM DD, YYYY or DD MMM YYYY)
    const dateMatch = line.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i);
    if (dateMatch) {
      currentDate = parseDate(dateMatch[1]);
      // Check next line for time
      const timeMatch = nextLine.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))/i) || line.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))/i);
      if (timeMatch) {
        currentTime = timeMatch[1];
      } else {
        currentTime = null;
      }
      i++;
      continue;
    }
    
    // Try to match transaction description: "Payment to [Merchant]" or "Paid to [Recipient]"
    const paymentMatch = combinedLine.match(/(?:Payment to|Paid to)\s+([^₹\n\r,]+?)(?:\s+[₹]|\s+DEBIT|\s+CREDIT|Transaction ID|UTR|Paid by|$)/i) || 
                         line.match(/(?:Payment to|Paid to)\s+([^₹\n\r,]+?)(?:\s+[₹]|\s+DEBIT|\s+CREDIT|Transaction ID|UTR|Paid by|$)/i);
    
    if (paymentMatch && currentDate) {
      let description = paymentMatch[1].trim();
      let amount = null;
      let type = 'expense';
      let paymentMethod = 'UPI'; // Default for PhonePe/UPI statements
      let utrNumber = null;
      
      // Extract UTR number from current transaction block (look ahead for UTR)
      // UTR patterns: "UTR No.: 150377500016", "UTR No: 700371321496", "UTR: 123456789"
      // Also check for "UTR No" with colon and number
      for (let j = i; j < Math.min(i + 15, lines.length); j++) {
        // Try different UTR patterns
        const utrPatterns = [
          /UTR\s*No\.?\s*:?\s*(\d{10,})/i,
          /UTR\s*:?\s*(\d{10,})/i,
          /UTR\s*Number\s*:?\s*(\d{10,})/i,
          /(?:^|\s)UTR[:\s]+(\d{10,})/i
        ];
        
        for (const pattern of utrPatterns) {
          const utrMatch = lines[j].match(pattern);
          if (utrMatch && utrMatch[1]) {
            utrNumber = utrMatch[1].trim();
            break;
          }
        }
        
        if (utrNumber) break;
        
        // Also check in combined lines for current line
        if (j === i) {
          for (const pattern of utrPatterns) {
            const combinedUtrMatch = combinedLine.match(pattern);
            if (combinedUtrMatch && combinedUtrMatch[1]) {
              utrNumber = combinedUtrMatch[1].trim();
              break;
            }
          }
          if (utrNumber) break;
        }
      }
      
      // Check for duplicate UTR - skip if already seen
      if (utrNumber && seenUTRs.has(utrNumber)) {
        i++;
        continue; // Skip this transaction as it's a duplicate
      }
      
      // Extract amount from combined line or nearby lines
      const amountMatch = combinedLine.match(/[₹]\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/) || 
                          line.match(/[₹]\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      }
      
      // Look ahead/behind for amount if not found
      if (!amount) {
        for (let j = Math.max(0, i - 1); j < Math.min(i + 5, lines.length); j++) {
          const amountMatch = lines[j].match(/[₹]\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/);
          if (amountMatch) {
            amount = parseFloat(amountMatch[1].replace(/,/g, ''));
            break;
          }
        }
      }
      
      // Extract type (DEBIT/CREDIT)
      const typeMatch = combinedLine.match(/\b(DEBIT|CREDIT)\b/i) || line.match(/\b(DEBIT|CREDIT)\b/i);
      if (typeMatch) {
        type = typeMatch[1].toLowerCase() === 'credit' ? 'income' : 'expense';
      }
      
      // Check for AUTOPAY or payment method indicators
      if (combinedLine.match(/\bAUTOPAY\b/i) || line.match(/\bAUTOPAY\b/i)) {
        paymentMethod = 'UPI';
      }
      
      // Clean description (remove extra info like Transaction ID, UTR, etc.)
      description = description.split(/Transaction ID|UTR No|UTR:|Paid by/i)[0].trim();
      description = description.replace(/\s+/g, ' ').trim();
      
      if (amount && amount > 0 && description) {
        // Combine date and time if available
        let transactionDate = new Date(currentDate);
        if (currentTime) {
          const timeParts = currentTime.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i);
          if (timeParts) {
            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const period = timeParts[3].toLowerCase();
            if (period === 'pm' && hours !== 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;
            transactionDate.setHours(hours, minutes, 0, 0);
          }
        }
        
        // Normalize date to just date (without time) for duplicate checking
        const dateKey = transactionDate.toISOString().split('T')[0];
        // Create a key for duplicate detection: description + amount + date
        const transactionKey = `${description.toLowerCase().trim()}-${amount}-${dateKey}`;
        
        // Check if we've already seen this transaction (by UTR or by description+amount+date)
        if (seenTransactions.has(transactionKey)) {
          i++;
          continue; // Skip duplicate transaction
        }
        
        // Mark UTR as seen if it exists
        if (utrNumber) {
          seenUTRs.add(utrNumber);
        }
        
        // Mark this transaction as seen
        seenTransactions.add(transactionKey);
        
        const category = categorizeTransaction(description);
        
        transactions.push({
          date: transactionDate,
          description: description,
          category: category,
          paymentMethod: paymentMethod,
          amount: amount,
          type: type,
          utr: utrNumber // Store UTR for reference (optional)
        });
      }
    }
    
    i++;
  }
  
  return transactions.length > 0 ? transactions : null;
}

// Process CSV file
async function processCSV(filePath, userId) {
  return new Promise((resolve, reject) => {
    const transactions = [];
    const errors = [];
    let rowCount = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        try {
          // Detect column names (case-insensitive)
          const dateCol = Object.keys(row).find(k => 
            /^(date|txn.?date|transaction.?date|datetime|time)$/i.test(k)
          );
          const amountCol = Object.keys(row).find(k => 
            /^(amount|txn.?amount|transaction.?amount|value|total|balance)$/i.test(k)
          );
          const descCol = Object.keys(row).find(k => 
            /^(description|narration|particulars|details|merchant|to|payee|beneficiary)$/i.test(k)
          );
          const typeCol = Object.keys(row).find(k => 
            /^(type|txn.?type|transaction.?type|debit.?credit|dr.?cr|credit.?debit)$/i.test(k)
          );
          const paymentCol = Object.keys(row).find(k => 
            /^(payment.?method|method|mode|channel)$/i.test(k)
          );
          
          if (!amountCol || !descCol) {
            errors.push({ row: rowCount, error: 'Missing required columns' });
            return;
          }
          
          const amountStr = row[amountCol] || '0';
          const amount = Math.abs(parseFloat(amountStr.toString().replace(/[₹,Rs\s]/g, '')));
          
          if (isNaN(amount) || amount === 0) {
            errors.push({ row: rowCount, error: 'Invalid amount' });
            return;
          }
          
          const description = (row[descCol] || 'Transaction').trim();
          const date = dateCol ? parseDate(row[dateCol]) : new Date();
          
          // Determine transaction type
          let type = 'expense';
          if (typeCol) {
            const typeStr = (row[typeCol] || '').toLowerCase();
            if (typeStr.match(/\b(credit|cr|income|deposit|received)\b/)) {
              type = 'income';
            }
          }
          
          const paymentMethod = paymentCol ? extractPaymentMethod(row[paymentCol]) : 'Other';
          const category = categorizeTransaction(description);
          
          transactions.push({
            user: userId,
            amount,
            description,
            category,
            type,
            date,
            paymentMethod
          });
        } catch (error) {
          errors.push({ row: rowCount, error: error.message });
        }
      })
      .on('end', () => {
        resolve({ transactions, errors, totalRows: rowCount });
      })
      .on('error', reject);
  });
}

// Process PDF file - handles both single receipts and statements
async function processPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;
    
    // Try parsing as statement first (multiple transactions)
    const statementTransactions = parseStatementPDF(text);
    if (statementTransactions && statementTransactions.length > 0) {
      return { transactions: statementTransactions, isStatement: true };
    }
    
    // If not a statement, parse as single receipt
    const receiptData = parseReceiptText(text);
    return { transaction: receiptData, isStatement: false };
  } catch (error) {
    throw new Error(`PDF parsing error: ${error.message}`);
  }
}

// Process Image file with OCR
async function processImage(filePath) {
  try {
    // Preprocess image for better OCR
    const processedImageBuffer = await sharp(filePath)
      .greyscale()
      .normalize()
      .sharpen()
      .toBuffer();
    
    const { data: { text } } = await Tesseract.recognize(processedImageBuffer, 'eng', {
      logger: m => {} // Suppress logs
    });
    
    return parseReceiptText(text);
  } catch (error) {
    throw new Error(`Image OCR error: ${error.message}`);
  }
}

// Route: Upload receipt (PDF or Image)
router.post('/receipt', authMiddleware, upload.single('receiptFile'), async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let parsedData;
    
    try {
      if (fileExt === '.pdf') {
        parsedData = await processPDF(filePath);
      } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt)) {
        const imageData = await processImage(filePath);
        parsedData = { transaction: imageData, isStatement: false };
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }
      
      // Handle statement (multiple transactions)
      if (parsedData.isStatement && parsedData.transactions && parsedData.transactions.length > 0) {
        // Check for existing transactions to avoid duplicates
        const existingTransactions = await Transaction.find({ user: userId });
        const existingSet = new Set(
          existingTransactions.map(t => 
            `${t.description.toLowerCase().trim()}-${t.amount}-${t.date.toISOString().split('T')[0]}`
          )
        );
        
        const transactionsToSave = [];
        const seenInBatch = new Set(); // Track duplicates within this batch
        
        for (const txnData of parsedData.transactions) {
          // Normalize key (same as in parser)
          const key = `${txnData.description.toLowerCase().trim()}-${txnData.amount}-${txnData.date.toISOString().split('T')[0]}`;
          
          // Skip if already exists in DB or already in this batch
          if (!existingSet.has(key) && !seenInBatch.has(key)) {
            seenInBatch.add(key);
            transactionsToSave.push({
              user: userId,
              amount: txnData.amount,
              description: txnData.description,
              category: txnData.category,
              type: txnData.type,
              date: txnData.date,
              paymentMethod: txnData.paymentMethod,
              receipt: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                mimeType: req.file.mimetype
              }
            });
          }
        }
        
        if (transactionsToSave.length > 0) {
          const savedTransactions = await Transaction.insertMany(transactionsToSave, { ordered: false });
          return res.json({
            message: 'Statement processed successfully',
            transactions: savedTransactions,
            count: savedTransactions.length,
            duplicatesSkipped: parsedData.transactions.length - savedTransactions.length
          });
        } else {
          return res.json({
            message: 'Statement processed - all transactions already exist',
            transactions: [],
            count: 0,
            duplicatesSkipped: parsedData.transactions.length
          });
        }
      }
      
      // Handle single receipt
      const receiptData = parsedData.transaction;
      if (!receiptData) {
        return res.status(400).json({ 
          error: 'Could not parse transaction data from file'
        });
      }
      
      // Validate parsed data
      if (!receiptData.amount || receiptData.amount <= 0) {
        return res.status(400).json({ 
          error: 'Could not extract valid amount from receipt',
          parsedData: receiptData
        });
      }
      
      if (!receiptData.description || receiptData.description.trim() === '') {
        receiptData.description = 'Transaction from receipt';
      }
      
      // Create transaction
      const transaction = new Transaction({
        user: userId,
        amount: receiptData.amount,
        description: receiptData.description,
        category: receiptData.category,
        type: receiptData.type,
        date: receiptData.date,
        paymentMethod: receiptData.paymentMethod,
        receipt: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          mimeType: req.file.mimetype
        }
      });
      
      await transaction.save();
      
      res.json({
        message: 'Receipt processed successfully',
        transaction
      });
    } catch (error) {
      // Clean up file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  } catch (error) {
    console.error('Receipt upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to process receipt' });
  }
});

// Route: Upload CSV file
router.post('/upi-csv', authMiddleware, upload.single('csvFile'), async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }
    
    const filePath = req.file.path;
    
    try {
      const { transactions, errors, totalRows } = await processCSV(filePath, userId);
      
      if (transactions.length === 0) {
        return res.status(400).json({ 
          error: 'No valid transactions found in CSV file',
          errors 
        });
      }
      
      // Remove duplicates based on description, amount, and date
      const uniqueTransactions = [];
      const seen = new Set();
      
      for (const txn of transactions) {
        const key = `${txn.description}-${txn.amount}-${txn.date.toISOString().split('T')[0]}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueTransactions.push(txn);
        }
      }
      
      // Check for existing transactions
      const existingTransactions = await Transaction.find({ user: userId });
      const existingSet = new Set(
        existingTransactions.map(t => 
          `${t.description}-${t.amount}-${t.date.toISOString().split('T')[0]}`
        )
      );
      
      const newTransactions = uniqueTransactions.filter(t => {
        const key = `${t.description}-${t.amount}-${t.date.toISOString().split('T')[0]}`;
        return !existingSet.has(key);
      });
      
      // Save transactions
      const savedTransactions = await Transaction.insertMany(newTransactions, { ordered: false });
      
      res.json({
        message: 'CSV file processed successfully',
        stats: {
          totalRows,
          processedTransactions: savedTransactions.length,
          duplicatesRemoved: uniqueTransactions.length - newTransactions.length,
          errors: errors.length
        },
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      // Clean up file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to process CSV file' });
  }
});

module.exports = router;

