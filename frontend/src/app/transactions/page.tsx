"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Eye,
  Download
} from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "@/app/dashboard/page";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Mock transactions data
const allTransactions = [
  { id: 1, date: '2025-12-15', description: 'Zomato', category: 'Food & Dining', amount: -450, type: 'debit', merchant: 'Zomato' },
  { id: 2, date: '2025-12-15', description: 'Salary Credit', category: 'Income', amount: 50000, type: 'credit', merchant: 'Company' },
  { id: 3, date: '2025-12-14', description: 'Uber Ride', category: 'Transportation', amount: -320, type: 'debit', merchant: 'Uber' },
  { id: 4, date: '2025-12-14', description: 'Netflix Subscription', category: 'Entertainment', amount: -499, type: 'debit', merchant: 'Netflix' },
  { id: 5, date: '2025-12-13', description: 'ATM Withdrawal', category: 'Cash', amount: -2000, type: 'debit', merchant: 'HDFC Bank' },
  { id: 6, date: '2025-12-13', description: 'Amazon Purchase', category: 'Shopping', amount: -1250, type: 'debit', merchant: 'Amazon' },
  { id: 7, date: '2025-12-12', description: 'Electricity Bill', category: 'Utilities', amount: -2800, type: 'debit', merchant: 'BSES' },
  { id: 8, date: '2025-12-12', description: 'Freelance Payment', category: 'Income', amount: 15000, type: 'credit', merchant: 'Client' },
  { id: 9, date: '2025-12-11', description: 'Starbucks Coffee', category: 'Food & Dining', amount: -180, type: 'debit', merchant: 'Starbucks' },
  { id: 10, date: '2025-12-11', description: 'Movie Tickets', category: 'Entertainment', amount: -600, type: 'debit', merchant: 'PVR' },
  { id: 11, date: '2025-12-10', description: 'Grocery Shopping', category: 'Groceries', amount: -2200, type: 'debit', merchant: 'BigBasket' },
  { id: 12, date: '2025-12-10', description: 'Fuel Station', category: 'Transportation', amount: -1500, type: 'debit', merchant: 'Indian Oil' },
  { id: 13, date: '2025-12-09', description: 'Medical Checkup', category: 'Healthcare', amount: -2500, type: 'debit', merchant: 'Apollo Hospital' },
  { id: 14, date: '2025-12-09', description: 'Online Course', category: 'Education', amount: -2999, type: 'debit', merchant: 'Udemy' },
  { id: 15, date: '2025-12-08', description: 'Mobile Recharge', category: 'Utilities', amount: -599, type: 'debit', merchant: 'Jio' }
];

const SidebarComponent = ({ activeItem, setActiveItem }: { activeItem: string, setActiveItem: (item: string) => void }) => {
  const router = useRouter();

  const LogoWrapper = () => {
    const { open } = useSidebar();
    return open ? <Logo /> : <LogoIcon />;
  };

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <Home className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Upload Statement",
      href: "/upload",
      icon: (
        <Upload className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: (
        <BarChart3 className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Insights",
      href: "/insights",
      icon: (
        <Lightbulb className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Transactions",
      href: "/transactions",
      icon: (
        <FileText className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: (
        <Settings className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "/",
      icon: (
        <LogOut className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex items-center">
            <LogoWrapper />
          </div>
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
        <div>
          <SidebarLink
            link={{
              label: "User",
              href: "/profile",
              icon: (
                <Image
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                  className="h-7 w-7 flex-shrink-0 rounded-full"
                  width={32}
                  height={32}
                  alt="Avatar"
                />
              ),
            }}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
};

const Transactions = () => {
  const [activeItem, setActiveItem] = useState('transactions');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const categories = ['all', ...Array.from(new Set(allTransactions.map(t => t.category)))];
  const types = ['all', 'credit', 'debit'];

  const filteredAndSortedTransactions = allTransactions
    .filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
      const matchesType = filterType === 'all' || transaction.type === filterType;
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
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

  const getAmountColor = (amount: number) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTypeIcon = (type: string) => {
    return type === 'credit' ? <ArrowDownRight className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-600" />;
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-black w-full flex-1 overflow-hidden",
        "h-screen"
      )}
    >
      <SidebarComponent activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex flex-1">
        <div className="p-4 md:p-8 rounded-tl-2xl border border-gray-200 bg-white flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-black mb-2">💳 Transactions</h1>
            <p className="text-gray-700">View and manage all your transactions.</p>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {types.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Date
                        {sortBy === 'date' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('description')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Description
                        {sortBy === 'description' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Amount
                        {sortBy === 'amount' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.type)}
                          {transaction.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.merchant}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={getAmountColor(transaction.amount)}>
                          {transaction.amount > 0 ? '+' : ''}{formatAmount(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-900 mr-2">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
              <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-black">Total Transactions</h4>
              <p className="text-2xl font-bold text-blue-600">{filteredAndSortedTransactions.length}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
              <ArrowDownRight className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-black">Credits</h4>
              <p className="text-2xl font-bold text-green-600">
                {filteredAndSortedTransactions.filter(t => t.type === 'credit').length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
              <ArrowUpRight className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-black">Debits</h4>
              <p className="text-2xl font-bold text-red-600">
                {filteredAndSortedTransactions.filter(t => t.type === 'debit').length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
              <DollarSign className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-black">Net Amount</h4>
              <p className={`text-2xl font-bold ${filteredAndSortedTransactions.reduce((sum, t) => sum + t.amount, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(filteredAndSortedTransactions.reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;