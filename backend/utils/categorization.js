const CATEGORY_KEYWORDS = {
  Food: [
    'swiggy', 'zomato', 'dominos', 'pizza hut', 'mcdonalds', 'burger king',
    'kfc', 'subway', 'starbucks', 'cafe coffee day', 'barista', 'food',
    'restaurant', 'dining', 'meal', 'lunch', 'dinner', 'snacks', 'tiffin',
    'biryani', 'chicken', 'hotel', 'dhaba', 'juice', 'bakery', 'cake',
    'ice cream', 'frozen', 'grocery', 'supermarket', 'bigbasket', 'grofers',
    'milk', 'bread', 'vegetables', 'fruits', 'meat', 'fish', 'eggs'
  ],

  Travel: [
    'uber', 'ola', 'rapido', 'meru', 'taxi', 'cab', 'auto', 'rickshaw',
    'bus', 'train', 'railway', 'irctc', 'flight', 'airline', 'indigo',
    'air india', 'spicejet', 'goair', 'airasia', 'makemytrip', 'redbus',
    'abhibus', 'petrol', 'fuel', 'diesel', 'gas station', 'parking',
    'toll', 'highway', 'metro', 'local train', 'autorickshaw', 'bike taxi'
  ],

  Shopping: [
    'amazon', 'flipkart', 'myntra', 'ajio', 'snapdeal', 'ebay', 'shopclues',
    'bigbasket', 'grofers', 'blinkit', 'zepto', 'swiggy instamart',
    'dmart', 'reliance fresh', 'more', 'big bazaar', 'lifestyle',
    'westside', 'pantaloons', 'central', 'brand factory', 'max', 'spencers',
    'clothing', 'fashion', 'shoes', 'watch', 'jewelry', 'cosmetics',
    'perfume', 'laptop', 'mobile', 'electronics', 'home appliances'
  ],

  Entertainment: [
    'netflix', 'prime video', 'amazon prime', 'hotstar', 'altbalaji',
    'zee5', 'sonyliv', 'mx player', 'altflix', 'hoichoi', 'addatimes',
    'jio cinema', 'eros now', 'bookmyshow', 'paytm movies', 'pvr',
    'inox', 'cinepolis', 'movie', 'theatre', 'cinema', 'ott', 'streaming',
    'spotify', 'gaana', 'wynk', 'music', 'game', 'gaming', 'playstation',
    'xbox', 'nintendo', 'pubg', 'cod', 'fortnite'
  ],

  Education: [
    'byjus', 'vedantu', 'unacademy', 'testbook', 'gradeup', 'pw',
    'physics wallah', 'allen', 'aakash', 'fiitjee', 'resonance', 'career point',
    'time kids', 'school', 'college', 'university', 'tuition', 'coaching',
    'course', 'class', 'exam', 'test', 'admission', 'fee', 'books',
    'stationery', 'pen', 'pencil', 'notebook', 'bag', 'uniform'
  ],

  Healthcare: [
    'pharmacy', 'medical', 'hospital', 'clinic', 'doctor', 'medicine',
    'tablet', 'capsule', 'injection', 'surgery', 'treatment', 'diagnosis',
    'apollo', 'max healthcare', 'fortis', 'aiims', 'medanta', 'manipal',
    'narayana', 'care', 'health', 'wellness', 'fitness', 'gym', 'yoga',
    'spa', 'massage', 'therapy', 'counseling', 'psychologist'
  ],

  Bills: [
    'electricity', 'power', 'eb bill', 'bescom', 'torrent', 'mseb',
    'water', 'bwssb', 'corporation', 'gas', 'indane', 'bharat gas',
    'hp gas', 'lpg', 'cylinder', 'internet', 'broadband', 'airtel',
    'jio', 'vodafone', 'bsnl', 'wifi', 'mobile', 'phone', 'landline',
    'dish tv', 'tatasky', 'dth', 'cable', 'insurance', 'lic', 'hdfc ergo',
    'policy', 'premium', 'emi', 'loan', 'credit card', 'maintenance'
  ],

  Personal: [
    'salary', 'income', 'refund', 'cashback', 'reward', 'bonus', 'gift',
    'transfer', 'wallet', 'paytm', 'google pay', 'phonepe', 'amazon pay',
    'bhim upi', 'bank transfer', 'neft', 'rtgs', 'imps', 'atm', 'withdrawal',
    'deposit', 'fd', 'rd', 'mutual fund', 'sip', 'investment', 'stock',
    'demat', 'trading', 'zerodha', 'upstox', 'angel one', 'groww'
  ]
};

// Priority order for categorization (higher priority categories checked first)
const CATEGORY_PRIORITY = [
  'Food',
  'Travel',
  'Shopping',
  'Entertainment',
  'Education',
  'Healthcare',
  'Bills',
  'Personal'
];

/**
 * Categorize a transaction based on description/merchant name
 * @param {string} description - Transaction description or merchant name
 * @returns {string} - Category name
 */
function categorizeTransaction(description) {
  if (!description || typeof description !== 'string') {
    return 'Other';
  }

  const desc = description.toLowerCase().trim();

  // Check each category in priority order
  for (const category of CATEGORY_PRIORITY) {
    const keywords = CATEGORY_KEYWORDS[category];

    for (const keyword of keywords) {
      if (desc.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return 'Other';
}

/**
 * Update transaction categories in bulk
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} - Transactions with updated categories
 */
function updateTransactionCategories(transactions) {
  return transactions.map(transaction => ({
    ...transaction,
    category: categorizeTransaction(transaction.description)
  }));
}

/**
 * Get all available categories
 * @returns {Array} - List of category names
 */
function getAllCategories() {
  return [...CATEGORY_PRIORITY, 'Other'];
}

/**
 * Get keywords for a specific category
 * @param {string} category - Category name
 * @returns {Array} - List of keywords for the category
 */
function getCategoryKeywords(category) {
  return CATEGORY_KEYWORDS[category] || [];
}

/**
 * Add custom keywords to a category
 * @param {string} category - Category name
 * @param {Array} keywords - Array of keywords to add
 */
function addCategoryKeywords(category, keywords) {
  if (!CATEGORY_KEYWORDS[category]) {
    CATEGORY_KEYWORDS[category] = [];
  }

  CATEGORY_KEYWORDS[category].push(...keywords);
  // Remove duplicates
  CATEGORY_KEYWORDS[category] = [...new Set(CATEGORY_KEYWORDS[category])];
}

/**
 * Recategorize transactions for a user (useful for background processing)
 * @param {string} userId - User ID
 * @param {Object} Transaction - Transaction model
 * @returns {Promise<Object>} - Update result
 */
async function recategorizeUserTransactions(userId, Transaction) {
  try {
    const transactions = await Transaction.find({ user: userId });

    let updatedCount = 0;
    for (const transaction of transactions) {
      const newCategory = categorizeTransaction(transaction.description);
      if (newCategory !== transaction.category) {
        await Transaction.findByIdAndUpdate(transaction._id, { category: newCategory });
        updatedCount++;
      }
    }

    return {
      success: true,
      totalTransactions: transactions.length,
      updatedCount
    };
  } catch (error) {
    console.error('Error recategorizing transactions:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  categorizeTransaction,
  updateTransactionCategories,
  getAllCategories,
  getCategoryKeywords,
  addCategoryKeywords,
  recategorizeUserTransactions,
  CATEGORY_KEYWORDS,
  CATEGORY_PRIORITY
};