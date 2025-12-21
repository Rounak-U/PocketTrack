# PocketTrack Backend

Backend API for the PocketTrack FinTech application built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization (JWT)
- Transaction management
- Financial analytics
- Budget tracking
- File upload for bank statements

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer

## Authentication

The API uses JWT (JSON Web Token) for authentication:

1. **Registration/Login**: Returns a JWT token
2. **Protected Routes**: Include `Authorization: Bearer <token>` header
3. **Token Expiry**: 7 days
4. **Frontend Storage**: Store JWT in HTTP-only cookies (recommended) or localStorage

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Start MongoDB (if running locally)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password

### Transactions
- `GET /api/transactions` - Get all transactions (paginated)
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary data

Response:
```json
{
  "summary": {
    "totalSpend": 45000,
    "totalIncome": 75000,
    "netIncome": 30000,
    "transactionCount": 24,
    "topCategory": "Food",
    "savingsRate": 40,
    "monthlyBudget": 50000,
    "currentSavings": 25000,
    "savingsGoal": 100000,
    "budgetProgress": 90,
    "recentTransactions": [...]
  }
}
```

### Upload
- `POST /api/upload/upi-csv` - Upload and process UPI CSV file

**CSV Format Support:**
The endpoint accepts UPI transaction CSV files with flexible column names. It automatically detects and normalizes:
- Date formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.)
- Amount formats (with/without currency symbols, commas)
- Transaction types (Debit/Credit, DR/CR, etc.)
- Merchant descriptions for auto-categorization

**Supported Columns (case-insensitive):**
- Date: `date`, `txn date`, `transaction date`, `datetime`
- Amount: `amount`, `txn amount`, `transaction amount`, `value`
- Type: `type`, `txn type`, `transaction type`, `debit/credit`, `dr/cr`
- Description: `description`, `narration`, `particulars`, `details`, `merchant`
- Reference: `reference`, `ref no`, `txn id`, `transaction id`, `utr`

**Response:**
```json
{
  "message": "CSV file processed successfully",
  "stats": {
    "totalRows": 150,
    "processedTransactions": 145,
    "duplicatesRemoved": 3,
    "errors": 2
  }
}
```

## Expense Categorization

The system automatically categorizes transactions based on merchant names and descriptions using intelligent keyword matching.

### Supported Categories
- **Food**: Swiggy, Zomato, restaurants, groceries, dining
- **Travel**: Uber, Ola, taxis, fuel, tolls, public transport
- **Shopping**: Amazon, Flipkart, online stores, retail purchases
- **Entertainment**: Netflix, OTT platforms, movies, gaming, music
- **Education**: Coaching classes, books, courses, educational materials
- **Healthcare**: Pharmacies, hospitals, medical expenses, wellness
- **Bills**: Electricity, water, gas, internet, phone, insurance, EMIs
- **Personal**: Salary, transfers, investments, banking fees

### How It Works
1. **Upload Time**: Transactions are categorized during CSV upload
2. **Background Processing**: Use `/api/categorization/recategorize` to update existing transactions
3. **Custom Keywords**: Add merchant-specific keywords via `/api/categorization/add-keywords`
4. **Statistics**: View categorization breakdown with `/api/categorization/stats`

### API Endpoints

### Categorization
- `POST /api/categorization/recategorize` - Recategorize all user transactions
- `GET /api/categorization/categories` - Get all categories and keywords
- `POST /api/categorization/add-keywords` - Add custom keywords to categories
- `GET /api/categorization/stats` - Get categorization statistics

### Analytics
- `GET /api/analytics/summary` - Get analytics summary
- `GET /api/analytics/spending` - Get spending by category
- `GET /api/analytics/budget` - Get budget vs spending

## Request/Response Examples

### Login
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### Protected Route
```javascript
GET /api/transactions
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}
```

## Development

- Run tests: `npm test`
- Start production server: `npm start`