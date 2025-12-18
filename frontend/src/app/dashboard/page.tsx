"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedClient from '@/components/auth/ProtectedClient';
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
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

// UI state defaults
const defaultSummary = {
  totalSpend: 0,
  totalIncome: 0,
  netIncome: 0,
  transactionCount: 0,
  topCategory: 'None',
  savingsRate: 0,
  monthlyBudget: 0,
  currentSavings: 0,
  savingsGoal: 0,
  budgetProgress: 0
};

const defaultRecent: any[] = [];

const defaultInsights = [
  { type: 'info', message: 'No insights available yet', icon: Lightbulb }
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
    { label: "Profile", href: "/profile", icon: <Settings className="text-white h-5 w-5 flex-shrink-0" /> }
  ];

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex items-center"><Logo /></div>
          <div className="mt-8 flex flex-col gap-2">{links.map((link, idx) => <SidebarLink key={idx} link={link} />)}</div>
        </div>
        <div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 mt-2 text-sm text-white hover:bg-red-600/20 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </SidebarBody>
    </Sidebar>
  );
};

const SummaryCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-6 shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</p>
        <p className="text-2xl font-semibold text-slate-100">{value}</p>
      </div>
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-white", color)}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [summary, setSummary] = useState(defaultSummary as any);
  const [recentTransactionsState, setRecentTransactionsState] = useState(defaultRecent as any[]);
  const [insightsState, setInsightsState] = useState(defaultInsights as any[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch dashboard data from backend
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const API_BASE = (process.env.NEXT_PUBLIC_API_URL) ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:5000';

        const res = await fetch(`${API_BASE}/api/dashboard/summary`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load dashboard data');
        }

        const data = await res.json();

        setSummary(data.summary || defaultSummary);
        setRecentTransactionsState((data.summary && data.summary.recentTransactions) || defaultRecent);
        // Build simple insights from summary changes — backend may supply richer insights later
        const builtInsights = [];
        if (data.summary && data.summary.budgetProgress >= 90) {
          builtInsights.push({ type: 'warning', message: 'You are close to your monthly budget limit', icon: AlertTriangle });
        }
        if (data.summary && data.summary.topCategory && data.summary.topCategory !== 'None') {
          builtInsights.push({ type: 'tip', message: `Top spending category: ${data.summary.topCategory}`, icon: Lightbulb });
        }
        setInsightsState(builtInsights.length ? builtInsights : defaultInsights);
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <ProtectedClient>
      <div className={cn("flex flex-col md:flex-row w-full flex-1 overflow-hidden bg-gradient-to-br from-black via-zinc-950 to-neutral-950 text-slate-100", "h-screen")}>
        <SidebarComponent activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex flex-1">
          <div className="flex flex-col gap-6 p-4 md:p-8 rounded-tl-2xl border border-zinc-900 bg-black/60 backdrop-blur-sm flex-1 w-full h-full overflow-y-auto">
            <div className="mb-6">
              <h1 className="mb-2 text-3xl font-semibold text-slate-50">Dashboard</h1>
              <p className="text-sm text-zinc-400">Welcome back! Here's your financial overview.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard title="Total Spend (This Month)" value={`₹${Number(summary.totalSpend || 0).toLocaleString()}`} icon={DollarSign} color="bg-gradient-to-r from-rose-500 to-orange-500" />
              <SummaryCard title="Remaining Budget" value={`₹${Number((summary.monthlyBudget || 0) - (summary.totalSpend || 0)).toLocaleString()}`} icon={Target} color="bg-gradient-to-r from-emerald-500 to-teal-500" />
              <SummaryCard title="Transactions Count" value={summary.transactionCount || 0} icon={Activity} color="bg-gradient-to-r from-sky-500 to-cyan-500" />
              <SummaryCard title="Top Spending Category" value={summary.topCategory || 'None'} icon={ShoppingBag} color="bg-gradient-to-r from-violet-500 to-indigo-500" />
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-6 shadow-lg mt-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Transactions</h3>
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-zinc-400 text-xs uppercase tracking-wide">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-400 text-xs uppercase tracking-wide">Merchant</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-400 text-xs uppercase tracking-wide">Category</th>
                    <th className="text-right py-3 px-4 font-medium text-zinc-400 text-xs uppercase tracking-wide">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={4} className="py-6 px-4 text-center text-sm text-zinc-400">Loading...</td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan={4} className="py-6 px-4 text-center text-sm text-rose-400">{error}</td>
                    </tr>
                  )}
                  {!loading && !error && recentTransactionsState.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 px-4 text-center text-sm text-zinc-400">No recent transactions</td>
                    </tr>
                  )}
                  {!loading && !error && recentTransactionsState.map((transaction: any, index: number) => (
                    <tr key={index} className="border-b border-zinc-900 last:border-0">
                      <td className="py-3 px-4 text-sm text-slate-200">{new Date(transaction.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm text-slate-200">{transaction.merchant || transaction.description || '—'}</td>
                      <td className="py-3 px-4 text-sm text-zinc-400">{transaction.category}</td>
                      <td className={`py-3 px-4 text-right font-medium ${transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{transaction.type === 'income' ? '+' : '-'}₹{Math.abs(transaction.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-6 shadow-lg mt-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Smart Insights</h3>
              <div className="space-y-3">
                {insightsState.map((insight, index) => (
                  <div key={index} className={cn("flex items-start gap-3 rounded-xl px-4 py-3", insight.type === 'warning' ? 'bg-amber-500/15 border border-amber-500/30' : insight.type === 'tip' ? 'bg-sky-500/15 border border-sky-500/30' : 'bg-emerald-500/15 border border-emerald-500/30')}>
                    <insight.icon className={cn("h-5 w-5", insight.type === 'warning' ? 'text-amber-300' : insight.type === 'tip' ? 'text-sky-300' : 'text-emerald-300')} />
                    <div><p className="text-sm text-slate-100">{insight.message}</p></div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </ProtectedClient>
  );
};

export default Dashboard;
