"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedClient from '@/components/auth/ProtectedClient';
import {
  BarChart3,
  FileText,
  Home,
  LogOut,
  PieChart,
  Settings,
  TrendingUp,
  Upload,
  Wallet,
  Lightbulb,
  DollarSign,
  Target,
  Activity,
  ShoppingBag,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Receipt
} from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Logo } from "@/app/dashboard/page";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { apiFetch, getApiBase } from "@/lib/api";

// Transaction interface
interface Transaction {
  _id: string;
  amount: number;
  description: string;
  category: string;
  type: string;
  date: string;
  paymentMethod: string;
  tags: string[];
  receipt?: {
    filename: string;
    originalName: string;
    path: string;
    mimeType: string;
  };
  createdAt: string;
  updatedAt: string;
}

// API Response interface
interface TransactionsResponse {
  transactions: Transaction[];
  totalPages: number;
  currentPage: number;
  totalTransactions: number;
}

const SidebarComponent = ({ activeItem, setActiveItem }: { activeItem: string, setActiveItem: (item: string) => void }) => {
  const router = useRouter();

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Redirect to login page
    router.push('/login');
  };

  const links = [
    { label: "Dashboard", href: "/dashboard", icon: <Home className="text-white h-5 w-5 flex-shrink-0" /> },
    { label: "Upload Statement", href: "/upload", icon: <Upload className="text-white h-5 w-5 flex-shrink-0" /> },
    { label: "Analytics", href: "/analytics", icon: <BarChart3 className="text-white h-5 w-5 flex-shrink-0" /> },
    { label: "Insights", href: "/insights", icon: <Lightbulb className="text-white h-5 w-5 flex-shrink-0" /> },
    { label: "Transactions", href: "/transactions", icon: <Wallet className="text-white h-5 w-5 flex-shrink-0" /> },
    { label: "Profile", href: "/profile", icon: <Settings className="text-white h-5 w-5 flex-shrink-0" /> },
    { label: "Logout", href: "/login", icon: <LogOut className="text-white h-5 w-5 flex-shrink-0" />, onClick: handleLogout }
  ];

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex items-center"><Logo /></div>
          <div className="mt-8 flex flex-col gap-2">{links.map((link, idx) => <SidebarLink key={idx} link={link} />)}</div>
        </div>
        {/* Logout is now part of the main links list */}
      </SidebarBody>
    </Sidebar>
  );
};

const Transactions = () => {
  const [activeItem, setActiveItem] = useState('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // No pagination - fetch all transactions
  const [totalTransactions, setTotalTransactions] = useState(0);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sort state
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Available categories and types
  const categories = ['all', 'Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other'];
  const types = ['all', 'income', 'expense'];

  

  // Fetch all transactions from API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all transactions with a high limit
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Large limit to get all transactions
      });

      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterType !== 'all') params.append('type', filterType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const API_ORIGIN = getApiBase();
      const response = await apiFetch(`${API_ORIGIN}/api/transactions?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        let bodyText = '';
        try {
          bodyText = await response.text();
        } catch (e) {
          bodyText = '<unable to read response body>';
        }
        const msg = `Failed to fetch transactions: ${response.status} ${response.statusText} - ${bodyText}`;
        console.error(msg);
        throw new Error(msg);
      }

      const data: TransactionsResponse = await response.json();
      setTransactions(data.transactions);
      setTotalTransactions(data.totalTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch transactions when filters change
  useEffect(() => {
    fetchTransactions();
  }, [filterCategory, filterType, startDate, endDate]);

  // Filter transactions locally for search (since search is client-side)
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === '' ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Sort transactions locally
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
        break;
      case 'amount':
        aValue = Math.abs(a.amount);
        bValue = Math.abs(b.amount);
        break;
      case 'description':
        aValue = a.description.toLowerCase();
        bValue = b.description.toLowerCase();
        break;
      default:
        return 0;
    }
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount);
    return `₹${absAmount.toLocaleString('en-IN')}`;
  };

  const getAmountColor = (type: string) => {
    return type === 'income' ? 'text-emerald-400' : 'text-rose-400';
  };

  const getTypeIcon = (type: string) => {
    return type === 'income' ? (
      <ArrowDownRight className="w-4 h-4 text-emerald-400" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-rose-400" />
    );
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };


  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterType('all');
    setStartDate('');
    setEndDate('');
  };

  // Calculate statistics from current filtered transactions
  const totalCredits = sortedTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = sortedTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netAmount = totalCredits - totalDebits;

  const creditCount = sortedTransactions.filter((t) => t.type === 'income').length;
  const debitCount = sortedTransactions.filter((t) => t.type === 'expense').length;

  return (
    <ProtectedClient>
    <div
      className={cn(
        "flex flex-col md:flex-row w-full flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100",
        "min-h-screen md:h-screen md:overflow-hidden"
      )}
    >
      <SidebarComponent activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex flex-1">
        <div className="p-4 sm:p-6 md:p-8 rounded-tl-2xl border border-zinc-900 bg-gradient-to-br from-neutral-950 via-zinc-950 to-neutral-900 backdrop-blur-sm flex flex-col gap-4 sm:gap-6 flex-1 w-full md:h-full md:overflow-y-auto">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">Transactions</h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">
              View and manage your transaction history with filters and quick stats.
            </p>
          </div>

          {/* Counts Strip */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 px-4 py-3 shadow-lg">
              <div className="text-xs text-zinc-400 mb-1">Total Transactions</div>
              <p className="text-xl font-semibold text-slate-100">
                {totalTransactions}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 px-4 py-3 shadow-lg">
              <div className="text-xs text-zinc-400 mb-1">Income</div>
              <p className="text-xl font-semibold text-emerald-300">
                {creditCount}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 px-4 py-3 shadow-lg">
              <div className="text-xs text-zinc-400 mb-1">Expenses</div>
              <p className="text-xl font-semibold text-rose-300">
                {debitCount}
              </p>
            </div>
            
          </div>

          {/* Amount Stats Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 px-4 py-3 shadow-lg">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Total Credits</span>
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-lg font-semibold text-emerald-300">
                {formatAmount(totalCredits)}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 px-4 py-3 shadow-lg">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Total Debits</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <p className="text-lg font-semibold text-rose-300">
                {formatAmount(-totalDebits)}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 px-4 py-3 shadow-lg">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Net Position</span>
                <Wallet className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <p
                className={cn(
                  "text-lg font-semibold",
                  netAmount >= 0 ? "text-emerald-300" : "text-rose-300"
                )}
              >
                {formatAmount(netAmount)}
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-3 sm:gap-4 mt-4 sm:mt-6 mb-4 sm:mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {types.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="End Date"
              />
              <button
                onClick={resetFilters}
                className="px-3 sm:px-4 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-xs sm:text-sm text-slate-100 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-neutral-950/80 border border-zinc-800 rounded-xl overflow-hidden shadow-lg flex flex-col md:h-[calc(100vh-450px)] h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 animate-spin" />
                <span className="ml-2 text-sm sm:text-base text-slate-100">Loading transactions...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400" />
                <span className="ml-2 text-sm sm:text-base text-rose-400">{error}</span>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-900 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('date')}
                          className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
                        >
                          Date
                          {sortBy === 'date' && (
                            sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('description')}
                          className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
                        >
                          Description
                          {sortBy === 'description' && (
                            sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Category</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Payment Method</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('amount')}
                          className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
                        >
                          Amount
                          {sortBy === 'amount' && (
                            sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-neutral-950/90 divide-y divide-zinc-900">
                    {sortedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                          <div className="flex flex-col items-center gap-2">
                            <Wallet className="w-12 h-12 text-zinc-600" />
                            <p>No transactions found</p>
                            {searchTerm || filterCategory !== 'all' || filterType !== 'all' || startDate || endDate ? (
                              <button
                                onClick={resetFilters}
                                className="text-emerald-400 hover:text-emerald-300 text-sm mt-2"
                              >
                                Clear filters
                              </button>
                            ) : (
                              <Link href="/upload" className="text-emerald-400 hover:text-emerald-300 text-sm mt-2">
                                Upload your first statement
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                        sortedTransactions.map((transaction) => (
                          <tr
                            key={transaction._id}
                            className="even:bg-gradient-to-r even:from-neutral-950 even:via-zinc-950 even:to-neutral-950 hover:bg-zinc-900/50 transition-colors"
                          >
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-100">
                              {new Date(transaction.date).toLocaleDateString('en-IN', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-100">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(transaction.type)}
                                <span className="max-w-[150px] sm:max-w-xs truncate">{transaction.description}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-100">
                              <span className="px-2 py-1 text-xs rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
                                {transaction.category}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-zinc-300 hidden sm:table-cell">
                              {transaction.paymentMethod || '—'}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                              <span className={getAmountColor(transaction.type)}>
                                {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                              <div className="flex items-center gap-1 sm:gap-2">
                                {transaction.receipt && (
                                  <a
                                    href={`${getApiBase()}${transaction.receipt.path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/70 px-2 py-1 text-xs text-amber-300 hover:bg-zinc-800 transition-colors"
                                    title="View Receipt"
                                  >
                                    <Receipt className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
    </ProtectedClient>
  );
};

export default Transactions;