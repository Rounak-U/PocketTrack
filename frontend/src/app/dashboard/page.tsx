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
  RefreshCw,
  Receipt,
  Edit,
  Save,
  X,
  Clock,
  Award,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { apiFetch, getApiBase } from "@/lib/api";

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
const defaultInsights = [{ type: 'info', message: 'No insights available yet', icon: Lightbulb }];

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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
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
      </SidebarBody>
    </Sidebar>
  );
};

// Modern Summary Card with animations
const SummaryCard = ({ title, value, icon: Icon, color, trend, subtitle }: { 
  title: string, 
  value: string | number, 
  icon: any, 
  color: string,
  trend?: string,
  subtitle?: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="group relative rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-6 shadow-lg hover:shadow-xl hover:border-zinc-700 transition-all duration-300 overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <div className="relative flex items-center justify-between">
      <div className="flex-1">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">{title}</p>
        <p className="text-3xl font-bold text-slate-100 mb-1">{value}</p>
        {trend && <p className="text-xs text-zinc-500">{trend}</p>}
        {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
      </div>
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-lg", color)}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </motion.div>
);

// Circular Progress Component
const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = "#22c55e" }: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-100">{Math.round(percentage)}%</p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [summary, setSummary] = useState(defaultSummary as any);
  const [recentTransactionsState, setRecentTransactionsState] = useState(defaultRecent as any[]);
  const [insightsState, setInsightsState] = useState(defaultInsights as any[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState(0);
  const [savingsGoalValue, setSavingsGoalValue] = useState(0);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>({});
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const API_BASE = getApiBase();

        // Fetch all dashboard data in parallel
        const [dashboardRes, categoriesRes, trendsRes, monthlyRes] = await Promise.allSettled([
          apiFetch(`${API_BASE}/api/dashboard/summary`),
          apiFetch(`${API_BASE}/api/analytics/categories?period=month`),
          apiFetch(`${API_BASE}/api/analytics/trends?days=30`),
          apiFetch(`${API_BASE}/api/analytics/monthly?months=6`)
        ]);

        // Process dashboard summary
        if (dashboardRes.status === 'fulfilled' && dashboardRes.value.ok) {
          const data = await dashboardRes.value.json();
          setSummary(data.summary || defaultSummary);
          setRecentTransactionsState((data.summary?.recentTransactions || []).slice(0, 5));
          setBudgetValue(data.summary?.monthlyBudget || 0);
          setSavingsGoalValue(data.summary?.savingsGoal || 0);

          // Build insights
          const builtInsights = [];
          if (data.summary?.monthlyBudget > 0 && data.summary?.budgetProgress >= 90) {
            builtInsights.push({ type: 'warning', message: 'You are close to your monthly budget limit', icon: AlertTriangle });
          }
          if (data.summary?.topCategory && data.summary.topCategory !== 'None') {
            builtInsights.push({ type: 'tip', message: `Top spending category: ${data.summary.topCategory}`, icon: Lightbulb });
          }
          if (data.summary?.savingsRate !== null && data.summary?.savingsRate >= 20) {
            builtInsights.push({ type: 'info', message: `Great! Your savings rate is ${Math.round(data.summary.savingsRate)}%`, icon: Award });
          }
          setInsightsState(builtInsights.length ? builtInsights : defaultInsights);
        }

        // Process categories
        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
          const catData = await categoriesRes.value.json();
          setCategories((catData?.categories || []).slice(0, 5));
        }

        // Process trends
        if (trendsRes.status === 'fulfilled' && trendsRes.value.ok) {
          const trendsData = await trendsRes.value.json();
          setTrends(trendsData);
        }

        // Process monthly data
        if (monthlyRes.status === 'fulfilled' && monthlyRes.value.ok) {
          const monthlyJson = await monthlyRes.value.json();
          setMonthlyData(monthlyJson?.monthlyTrends || []);
        }
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveBudget = async () => {
    setIsSavingBudget(true);
    try {
      const API_BASE = getApiBase();
      const res = await apiFetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          monthlyBudget: budgetValue,
          savingsGoal: savingsGoalValue
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save budget');
      }

      setIsEditingBudget(false);
      const dashboardRes = await apiFetch(`${API_BASE}/api/dashboard/summary`);
      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setSummary(data.summary || defaultSummary);
        setBudgetValue(data.summary?.monthlyBudget || 0);
        setSavingsGoalValue(data.summary?.savingsGoal || 0);
      }
    } catch (err: any) {
      console.error('Save budget error:', err);
      setError(err.message || 'Failed to save budget');
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleCancelBudget = () => {
    setIsEditingBudget(false);
    setBudgetValue(summary.monthlyBudget || 0);
    setSavingsGoalValue(summary.savingsGoal || 0);
  };

  // Calculate financial health score
  const calculateHealthScore = () => {
    let score = 50;
    if (summary.monthlyBudget > 0) {
      if (summary.budgetProgress < 50) score += 20;
      else if (summary.budgetProgress < 80) score += 10;
      else if (summary.budgetProgress < 100) score -= 10;
      else score -= 20;
    }
    if (summary.savingsRate !== null && summary.savingsRate > 0) {
      if (summary.savingsRate >= 20) score += 20;
      else if (summary.savingsRate >= 10) score += 10;
      else score -= 10;
    }
    if (summary.netIncome > 0) score += 10;
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  const healthColor = healthScore >= 70 ? 'text-emerald-400' : healthScore >= 50 ? 'text-amber-400' : 'text-rose-400';
  const healthLabel = healthScore >= 70 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs Attention';

  // Calculate spending velocity
  const spendingVelocity = trends?.dailyTrends?.length > 0
    ? Math.round(trends.dailyTrends.reduce((sum: number, d: any) => sum + (d.totalAmount || 0), 0) / trends.dailyTrends.length)
    : 0;

  // Get top merchants
  const topMerchants = (trends?.topMerchants || []).slice(0, 3);

  // Calculate month-over-month change
  const momChange = monthlyData.length >= 2
    ? ((monthlyData[monthlyData.length - 1]?.totalExpenses || 0) - (monthlyData[monthlyData.length - 2]?.totalExpenses || 0))
    : null;

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  return (
    <ProtectedClient>
      <div className={cn("flex flex-col md:flex-row w-full flex-1 bg-gradient-to-br from-black via-zinc-950 to-neutral-950 text-slate-100", "min-h-screen md:h-screen md:overflow-hidden")}>
        <SidebarComponent activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex flex-1">
          <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 rounded-tl-2xl border border-zinc-900 bg-black/60 backdrop-blur-sm flex-1 w-full md:h-full md:overflow-y-auto">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <h1 className="mb-1 text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50">Dashboard</h1>
              <p className="text-xs sm:text-sm text-zinc-400">Your financial overview at a glance</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Spend"
                value={`₹${Number(summary.totalSpend || 0).toLocaleString('en-IN')}`}
                icon={DollarSign}
                color="bg-gradient-to-r from-rose-500 to-orange-500"
                trend={momChange !== null ? `${momChange >= 0 ? '+' : ''}₹${Math.abs(momChange).toLocaleString('en-IN')} vs last month` : undefined}
                subtitle="This month"
              />
              <SummaryCard
                title="Net Income"
                value={`₹${Number(summary.netIncome || 0).toLocaleString('en-IN')}`}
                icon={TrendingUp}
                color="bg-gradient-to-r from-emerald-500 to-teal-500"
                subtitle={summary.netIncome >= 0 ? "Positive" : "Negative"}
              />
              <SummaryCard
                title="Transactions"
                value={summary.transactionCount || 0}
                icon={Activity}
                color="bg-gradient-to-r from-sky-500 to-cyan-500"
                subtitle="This month"
              />
              <SummaryCard
                title="Financial Health"
                value={healthLabel}
                icon={Award}
                color={cn("bg-gradient-to-r", healthScore >= 70 ? "from-emerald-500 to-teal-500" : healthScore >= 50 ? "from-amber-500 to-orange-500" : "from-rose-500 to-red-500")}
                subtitle={`Score: ${healthScore}/100`}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Column - Budget & Savings */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Budget Progress */}
                {summary.monthlyBudget > 0 && (
                  <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-4 sm:p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-slate-100">Budget Progress</h3>
                        <p className="text-xs sm:text-sm text-zinc-400">Monthly spending vs budget</p>
                      </div>
                      <button
                        onClick={() => setIsEditingBudget(true)}
                        className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        <Edit className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <CircularProgress
                        percentage={summary.budgetProgress || 0}
                        size={100}
                        color={summary.budgetProgress >= 90 ? "#ef4444" : summary.budgetProgress >= 70 ? "#f59e0b" : "#22c55e"}
                      />
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">Spent</span>
                          <span className="text-lg font-bold text-slate-100">₹{Number(summary.totalSpend || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400">Budget</span>
                          <span className="text-lg font-semibold text-zinc-300">₹{Number(summary.monthlyBudget).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 mt-4">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-500",
                              summary.budgetProgress >= 90 ? "bg-rose-500" : summary.budgetProgress >= 70 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(100, summary.budgetProgress || 0)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                          ₹{Number((summary.monthlyBudget || 0) - (summary.totalSpend || 0)).toLocaleString('en-IN')} remaining
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Spending Trends Chart */}
                {trends?.dailyTrends && trends.dailyTrends.length > 0 && (
                  <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-4 sm:p-6 shadow-lg">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-4">Spending Trends (Last 30 Days)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={trends.dailyTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#020617', border: '1px solid #27272a', borderRadius: '8px', color: '#e5e7eb' }}
                          formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                        />
                        <Line type="monotone" dataKey="totalAmount" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Category Breakdown */}
                {categories.length > 0 && (
                  <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-4 sm:p-6 shadow-lg">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-4">Spending by Category</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <ResponsiveContainer width="100%" height={180}>
                        <RechartsPieChart>
                          <Pie
                            data={categories}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="totalAmount"
                          >
                            {categories.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {categories.map((cat: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                              <span className="text-sm text-zinc-300">{cat.category}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-100">₹{Number(cat.totalAmount || 0).toLocaleString('en-IN')}</p>
                              <p className="text-xs text-zinc-400">{cat.percentage?.toFixed(1)}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Transactions */}
                <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-4 sm:p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-100">Recent Transactions</h3>
                    <Link href="/transactions" className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                      View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {loading ? (
                      <div className="text-center py-8 text-zinc-400">Loading...</div>
                    ) : recentTransactionsState.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400">
                        <Wallet className="w-12 h-12 mx-auto mb-2 text-zinc-600" />
                        <p>No transactions yet</p>
                        <Link href="/upload" className="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block">
                          Upload your first statement
                        </Link>
                      </div>
                    ) : (
                      recentTransactionsState.map((transaction: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              transaction.type === 'income' ? "bg-emerald-500/20" : "bg-rose-500/20"
                            )}>
                              {transaction.type === 'income' ? (
                                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-100">{transaction.description || transaction.merchant || '—'}</p>
                              <p className="text-xs text-zinc-400">{transaction.category} • {new Date(transaction.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-sm font-semibold",
                              transaction.type === 'income' ? "text-emerald-400" : "text-rose-400"
                            )}>
                              {transaction.type === 'income' ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Insights & Quick Stats */}
              <div className="space-y-4 sm:space-y-6">
                {/* Savings Goal */}
                {summary.savingsGoal > 0 && (
                  <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-4 sm:p-6 shadow-lg">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-4">Savings Goal</h3>
                    <div className="flex items-center justify-center mb-4">
                      <CircularProgress
                        percentage={summary.savingsGoal > 0 ? (summary.currentSavings / summary.savingsGoal) * 100 : 0}
                        size={80}
                        color="#3b82f6"
                      />
                    </div>
                    <div className="space-y-2 text-center">
                      <p className="text-sm text-zinc-400">Current Savings</p>
                      <p className="text-2xl font-bold text-slate-100">₹{Number(summary.currentSavings || 0).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-zinc-500">of ₹{Number(summary.savingsGoal).toLocaleString('en-IN')} goal</p>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-4 sm:p-6 shadow-lg">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-zinc-300">Daily Average</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-100">₹{spendingVelocity.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-zinc-300">Top Category</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-100">{summary.topCategory || 'None'}</span>
                    </div>
                    {summary.savingsRate !== null && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                          <span className="text-sm text-zinc-300">Savings Rate</span>
                        </div>
                        <span className="text-sm font-semibold text-emerald-400">{Math.round(summary.savingsRate || 0)}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Merchants */}
                {topMerchants.length > 0 && (
                  <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-4 sm:p-6 shadow-lg">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-4">Top Merchants</h3>
                    <div className="space-y-3">
                      {topMerchants.map((merchant: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50">
                          <div>
                            <p className="text-sm font-medium text-slate-100">{merchant.merchant}</p>
                            <p className="text-xs text-zinc-400">{merchant.transactionCount} transactions</p>
                          </div>
                          <p className="text-sm font-semibold text-zinc-300">₹{Number(merchant.totalAmount || 0).toLocaleString('en-IN')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Smart Insights */}
                <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-4 sm:p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    <h3 className="text-base sm:text-lg font-semibold text-slate-100">Smart Insights</h3>
                  </div>
                  <div className="space-y-3">
                    {insightsState.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "flex items-start gap-3 rounded-xl px-4 py-3",
                          insight.type === 'warning' ? 'bg-amber-500/15 border border-amber-500/30' :
                          insight.type === 'tip' ? 'bg-sky-500/15 border border-sky-500/30' :
                          'bg-emerald-500/15 border border-emerald-500/30'
                        )}
                      >
                        <insight.icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          insight.type === 'warning' ? 'text-amber-300' :
                          insight.type === 'tip' ? 'text-sky-300' :
                          'text-emerald-300'
                        )} />
                        <p className="text-sm text-slate-100">{insight.message}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Budget Settings */}
                <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 p-4 sm:p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-100">Budget & Goals</h3>
                    {!isEditingBudget ? (
                      <button
                        onClick={() => setIsEditingBudget(true)}
                        className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        <Edit className="w-4 h-4 text-zinc-400" />
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveBudget}
                          disabled={isSavingBudget}
                          className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelBudget}
                          disabled={isSavingBudget}
                          className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Monthly Budget</label>
                      {isEditingBudget ? (
                        <input
                          type="number"
                          value={budgetValue}
                          onChange={(e) => setBudgetValue(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Enter budget"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-slate-100">
                          {summary.monthlyBudget > 0 ? `₹${Number(summary.monthlyBudget).toLocaleString('en-IN')}` : 'Not Set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Savings Goal</label>
                      {isEditingBudget ? (
                        <input
                          type="number"
                          value={savingsGoalValue}
                          onChange={(e) => setSavingsGoalValue(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Enter goal"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-slate-100">
                          {summary.savingsGoal > 0 ? `₹${Number(summary.savingsGoal).toLocaleString('en-IN')}` : 'Not Set'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedClient>
  );
};

export default Dashboard;
