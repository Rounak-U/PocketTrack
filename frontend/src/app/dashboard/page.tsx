"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  CreditCard,
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
  RefreshCw
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Mock data
const summaryData = {
  totalSpend: 12500,
  remainingBudget: 2500,
  transactionsCount: 47,
  topCategory: 'Food & Dining'
};

const categoryData = [
  { name: 'Food & Dining', value: 3500, color: '#FF6B6B' },
  { name: 'Transportation', value: 2200, color: '#4ECDC4' },
  { name: 'Shopping', value: 2800, color: '#45B7D1' },
  { name: 'Entertainment', value: 1500, color: '#96CEB4' },
  { name: 'Bills & Utilities', value: 1800, color: '#FFEAA7' },
  { name: 'Others', value: 700, color: '#DDA0DD' }
];

const monthlyData = [
  { month: 'Jan', spend: 8500 },
  { month: 'Feb', spend: 9200 },
  { month: 'Mar', spend: 7800 },
  { month: 'Apr', spend: 10100 },
  { month: 'May', spend: 12500 }
];

const recentTransactions = [
  { date: '2025-12-15', merchant: 'Zomato', category: 'Food & Dining', amount: -450, type: 'debit' },
  { date: '2025-12-14', merchant: 'Uber', category: 'Transportation', amount: -320, type: 'debit' },
  { date: '2025-12-13', merchant: 'Amazon', category: 'Shopping', amount: -1200, type: 'debit' },
  { date: '2025-12-12', merchant: 'Netflix', category: 'Entertainment', amount: -499, type: 'debit' },
  { date: '2025-12-11', merchant: 'Salary', category: 'Income', amount: 50000, type: 'credit' }
];

const insights = [
  { type: 'warning', message: 'You spent 35% more on food this month compared to last month', icon: AlertTriangle },
  { type: 'tip', message: 'Zomato appears frequently — consider a monthly cap', icon: Lightbulb },
  { type: 'info', message: 'Recurring payment detected for Netflix subscription', icon: RefreshCw }
];

export const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <TrendingUp className="w-8 h-8 text-green-400" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-white text-2xl whitespace-pre"
      >
        PocketTrack
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <TrendingUp className="h-5 w-5 text-green-400" />
    </Link>
  );
};

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

const SummaryCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-6 shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
          {title}
        </p>
        <p className="text-2xl font-semibold text-slate-100">
          {value}
        </p>
      </div>
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-white", color)}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [activeItem, setActiveItem] = useState('dashboard');

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row w-full flex-1 overflow-hidden bg-gradient-to-br from-black via-zinc-950 to-neutral-950 text-slate-100",
        "h-screen"
      )}
    >
      <SidebarComponent activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex flex-1">
        <div className="flex flex-col gap-6 p-4 md:p-8 rounded-tl-2xl border border-zinc-900 bg-black/60 backdrop-blur-sm flex-1 w-full h-full overflow-y-auto">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-semibold text-slate-50">Dashboard</h1>
            <p className="text-sm text-zinc-400">Welcome back! Here&apos;s your financial overview.</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              title="Total Spend (This Month)"
              value={`₹${summaryData.totalSpend.toLocaleString()}`}
              icon={DollarSign}
              color="bg-gradient-to-r from-rose-500 to-orange-500"
            />
            <SummaryCard
              title="Remaining Budget"
              value={`₹${summaryData.remainingBudget.toLocaleString()}`}
              icon={Target}
              color="bg-gradient-to-r from-emerald-500 to-teal-500"
            />
            <SummaryCard
              title="Transactions Count"
              value={summaryData.transactionsCount}
              icon={Activity}
              color="bg-gradient-to-r from-sky-500 to-cyan-500"
            />
            <SummaryCard
              title="Top Spending Category"
              value={summaryData.topCategory}
              icon={ShoppingBag}
              color="bg-gradient-to-r from-violet-500 to-indigo-500"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Pie Chart */}
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Spending by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trend Line Chart */}
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Monthly Spending Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="spend" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Recent Transactions</h3>
              <button className="text-emerald-300 font-medium">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 font-medium text-zinc-400 text-xs uppercase tracking-wide">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-400 text-xs uppercase tracking-wide">Merchant</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-400 text-xs uppercase tracking-wide">Category</th>
                    <th className="text-right py-3 px-4 font-medium text-zinc-400 text-xs uppercase tracking-wide">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction, index) => (
                    <tr key={index} className="border-b border-zinc-900 last:border-0">
                      <td className="py-3 px-4 text-sm text-slate-200">{transaction.date}</td>
                      <td className="py-3 px-4 text-sm text-slate-200">{transaction.merchant}</td>
                      <td className="py-3 px-4 text-sm text-zinc-400">{transaction.category}</td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        transaction.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{Math.abs(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Smart Insights */}
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Smart Insights</h3>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 rounded-xl px-4 py-3",
                    insight.type === 'warning'
                      ? 'bg-amber-500/15 border border-amber-500/30'
                      : insight.type === 'tip'
                        ? 'bg-sky-500/15 border border-sky-500/30'
                        : 'bg-emerald-500/15 border border-emerald-500/30'
                  )}
                >
                  <insight.icon
                    className={cn(
                      "h-5 w-5",
                      insight.type === 'warning'
                        ? 'text-amber-300'
                        : insight.type === 'tip'
                          ? 'text-sky-300'
                          : 'text-emerald-300'
                    )}
                  />
                  <div>
                    <p className="text-sm text-slate-100">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;