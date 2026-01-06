"use client";

import React, { useEffect, useState } from 'react';
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
  TrendingDown,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Logo } from "@/app/dashboard/page";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { apiFetch, getApiBase } from "@/lib/api";

const colors = ['#22c55e', '#38bdf8', '#f97316', '#a855f7', '#ef4444', '#eab308', '#06b6d4', '#f43f5e'];

const StatCard = ({ icon, label, value, helper, tone }: { icon: React.ReactNode; label: string; value: string; helper?: string; tone?: string }) => (
  <div className={cn("rounded-2xl border border-zinc-800 bg-gradient-to-br p-4 sm:p-5 shadow-lg", tone || "from-zinc-900/60 to-zinc-900/30")}>
    <div className="flex items-center justify-between">
      <div className="p-2 rounded-xl bg-white/5 border border-white/10">
        {icon}
      </div>
    </div>
    <div className="mt-3">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="text-xl sm:text-2xl font-semibold text-white mt-1">{value}</p>
      {helper ? <p className="text-xs text-zinc-400 mt-1">{helper}</p> : null}
    </div>
  </div>
);

const Card = ({ shellTitle, children, className }: { shellTitle: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-4 sm:p-6 shadow-lg border border-zinc-800", className)}>
    <div className="flex items-center justify-between mb-3 sm:mb-4">
      <h3 className="text-base sm:text-lg font-semibold text-slate-100">{shellTitle}</h3>
    </div>
    {children}
  </div>
);

const EmptyState = ({ message, icon }: { message: string; icon: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-xs sm:text-sm text-zinc-400 gap-2">
    {icon}
    <p className="text-sm text-zinc-300">{message}</p>
  </div>
);

const EmptyPrompt = () => (
  <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-xs sm:text-sm text-zinc-400 gap-3">
    <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-600" />
    <div className="text-center space-y-1">
      <p className="text-sm sm:text-base text-zinc-300">Add transactions to see analytics</p>
      <p className="text-xs text-zinc-500">Upload statements to generate insights</p>
    </div>
    <Link href="/upload" className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors">
      <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
      Upload Statement
    </Link>
  </div>
);

const Insight = ({ pill, icon, text }: { pill: string; icon: React.ReactNode; text: string }) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex gap-3 items-start">
    <div className="flex items-center gap-2 text-xs text-emerald-300">
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">{pill}</span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 text-sm text-slate-100">
        {icon}
        <span className="truncate">{text}</span>
      </div>
    </div>
  </div>
);

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

const Analytics = () => {
  const [activeItem, setActiveItem] = useState('analytics');
  const router = useRouter();

  // Data state
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>({});
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const buildFallbackAnalytics = (transactions: any[]) => {
    const now = new Date();
    const monthsCount = 12;
    const startWindow = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);
    const monthLabels = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyAccumulator: Record<string, any> = {};
    const categoryAccumulator: Record<string, number> = {};
    const dailyAccumulator: Record<string, { totalAmount: number; transactionCount: number }> = {};

    transactions.forEach((txn) => {
      if (!txn || !txn.date) return;
      const dt = new Date(txn.date);
      if (isNaN(dt.getTime()) || dt < startWindow) return;

      const monthKey = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
      monthlyAccumulator[monthKey] = monthlyAccumulator[monthKey] || {
        year: dt.getFullYear(),
        month: dt.getMonth() + 1,
        monthName: monthLabels[dt.getMonth() + 1],
        totalIncome: 0,
        totalExpenses: 0,
        transactionCount: 0,
        incomeTransactions: 0,
        expenseTransactions: 0,
        savingsRate: 0,
      };

      const amt = Number(txn.amount) || 0;
      const type = txn.type === 'income' ? 'income' : 'expense';
      if (type === 'income') {
        monthlyAccumulator[monthKey].totalIncome += amt;
        monthlyAccumulator[monthKey].incomeTransactions += 1;
      } else {
        monthlyAccumulator[monthKey].totalExpenses += amt;
        monthlyAccumulator[monthKey].expenseTransactions += 1;
      }
      monthlyAccumulator[monthKey].transactionCount += 1;

      if (type === 'expense') {
        const cat = txn.category || 'Other';
        categoryAccumulator[cat] = (categoryAccumulator[cat] || 0) + amt;
      }

      const dailyKey = dt.toISOString().slice(0, 10);
      dailyAccumulator[dailyKey] = dailyAccumulator[dailyKey] || { totalAmount: 0, transactionCount: 0 };
      dailyAccumulator[dailyKey].totalAmount += type === 'expense' ? amt : 0;
      dailyAccumulator[dailyKey].transactionCount += 1;
    });

    const monthlyTrendsComputed = [] as any[];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${target.getFullYear()}-${target.getMonth() + 1}`;
      const existing = monthlyAccumulator[key];
      if (existing) {
        const income = existing.totalIncome;
        const expenses = existing.totalExpenses;
        existing.netIncome = income - expenses;
        existing.savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
        monthlyTrendsComputed.push(existing);
      } else {
        monthlyTrendsComputed.push({
          year: target.getFullYear(),
          month: target.getMonth() + 1,
          monthName: monthLabels[target.getMonth() + 1],
          totalIncome: 0,
          totalExpenses: 0,
          netIncome: 0,
          transactionCount: 0,
          incomeTransactions: 0,
          expenseTransactions: 0,
          savingsRate: 0,
        });
      }
    }

    const categoriesComputed = Object.entries(categoryAccumulator)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([category, totalAmount]) => ({
        category,
        totalAmount,
        percentage: 0,
      }));

    const totalCatSpend = categoriesComputed.reduce((s, c) => s + (c.totalAmount || 0), 0);
    categoriesComputed.forEach((c) => {
      c.percentage = totalCatSpend > 0 ? Math.round((c.totalAmount / totalCatSpend) * 1000) / 10 : 0;
    });

    const dailyTrends = Object.entries(dailyAccumulator)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Current month summary
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentMonthTransactions = transactions.filter((txn) => {
      const dt = new Date(txn.date);
      return !isNaN(dt.getTime()) && dt >= startOfMonth && dt < endOfMonth;
    });
    const totalIncome = currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalExpenses = currentMonthTransactions
      .filter((t) => t.type !== 'income')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    return {
      monthlyTrends: monthlyTrendsComputed,
      categories: categoriesComputed,
      dailyTrends,
      summary: {
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        monthlyBudget: 0,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      },
    };
  };

  const computeDailyAverage = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const daysElapsed = now.getDate();

    // Prefer summary (current month) if available
    if (summary && summary.totalExpenses != null) {
      const avg = (summary.totalExpenses || 0) / Math.max(1, daysElapsed);
      if (avg > 0) return `₹${Math.round(avg).toLocaleString('en-IN')}`;
    }

    const monthData = monthlyTrends.find(
      (m) => (m.month && m.year ? m.month === currentMonth && m.year === currentYear : m.monthName === now.toLocaleString('en-US', { month: 'short' }))
    );

    if (monthData) {
      const spend = monthData.totalExpenses || 0;
      const avg = spend / Math.max(1, daysElapsed);
      return `₹${Math.round(avg).toLocaleString('en-IN')}`;
    }

    const daily = trends?.dailyTrends || [];
    if (daily.length) {
      const avg = Math.round(daily.reduce((s: number, d: any) => s + (d.totalAmount || 0), 0) / daily.length);
      return `₹${avg.toLocaleString('en-IN')}`;
    }

    return "—";
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const API_BASE = getApiBase();

        const [monthlyRes, categoriesRes, trendsRes, summaryRes] = await Promise.allSettled([
          apiFetch(`${API_BASE}/api/analytics/monthly?rolling=true&months=12`),
          apiFetch(`${API_BASE}/api/analytics/categories?period=rolling`),
          apiFetch(`${API_BASE}/api/analytics/trends?days=90`),
          apiFetch(`${API_BASE}/api/analytics/summary`)
        ]);

        let monthlyData: any[] = [];
        let categoriesData: any[] = [];
        let trendsData: any = {};
        let summaryData: any = null;

        if (monthlyRes.status === 'fulfilled' && monthlyRes.value.ok) {
          try {
            const monthlyJson = await monthlyRes.value.json();
            monthlyData = Array.isArray(monthlyJson?.monthlyTrends || monthlyJson?.data)
              ? (monthlyJson?.monthlyTrends || monthlyJson?.data)
              : [];
          } catch (e) {
            console.error('Error parsing monthly data:', e);
          }
        } else {
          console.warn('Monthly analytics failed:', monthlyRes.status === 'rejected' ? monthlyRes.reason : monthlyRes.value?.status);
        }

        let categoryDataFound = false;
        const setCategoriesFromResponse = async (res: any) => {
          const json = await res.json();
          const categoryData = json?.categories || json?.spendingByCategory || json?.data || [];
          if (Array.isArray(categoryData) && categoryData.length > 0) {
            categoriesData = categoryData;
            categoryDataFound = true;
          }
        };

        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
          try {
            await setCategoriesFromResponse(categoriesRes.value);
          } catch (e) {
            console.error('Error parsing categories data:', e);
          }
        }

        if (!categoryDataFound) {
          const fallbackPeriods = ['quarter', 'year'];
          for (const period of fallbackPeriods) {
            try {
              const fallbackRes = await apiFetch(`${API_BASE}/api/analytics/categories?period=${period}`);
              if (fallbackRes.ok) {
                await setCategoriesFromResponse(fallbackRes);
              }
              if (categoryDataFound) break;
            } catch (fallbackError) {
              console.warn(`Error fetching categories for ${period} period:`, fallbackError);
            }
          }
        }

        if (trendsRes.status === 'fulfilled' && trendsRes.value.ok) {
          try {
            const trendsJson = await trendsRes.value.json();
            trendsData = trendsJson || {};
          } catch (e) {
            console.error('Error parsing trends data:', e);
          }
        } else {
          console.warn('Trends analytics failed:', trendsRes.status === 'rejected' ? trendsRes.reason : trendsRes.value?.status);
        }

        if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
          try {
            const summaryJson = await summaryRes.value.json();
            summaryData = summaryJson?.summary || summaryJson || null;
          } catch (e) {
            console.error('Error parsing summary data:', e);
          }
        } else {
          console.warn('Summary analytics failed:', summaryRes.status === 'rejected' ? summaryRes.reason : summaryRes.value?.status);
        }

        const allFailed =
          (monthlyRes.status === 'rejected' || (monthlyRes.status === 'fulfilled' && !monthlyRes.value.ok)) &&
          (categoriesRes.status === 'rejected' || (categoriesRes.status === 'fulfilled' && !categoriesRes.value.ok)) &&
          (trendsRes.status === 'rejected' || (trendsRes.status === 'fulfilled' && !trendsRes.value.ok)) &&
          (summaryRes.status === 'rejected' || (summaryRes.status === 'fulfilled' && !summaryRes.value.ok));

        if (allFailed) {
          setError('Unable to load analytics data. Please try again or upload transactions first.');
        }

        const categoriesMissing = categoriesData.length === 0;
        const trendsMissing = !trendsData?.dailyTrends || trendsData.dailyTrends.length === 0;
        const looksEmpty =
          monthlyData.length === 0 &&
          categoriesData.length === 0 &&
          (!summaryData || (!summaryData.totalIncome && !summaryData.totalExpenses));

        if (looksEmpty || categoriesMissing || trendsMissing) {
          try {
            const fallbackRes = await apiFetch(`${API_BASE}/api/transactions?limit=2000`);
            if (fallbackRes.ok) {
              const fallbackJson = await fallbackRes.json();
              const transactions = fallbackJson?.transactions || [];
              if (Array.isArray(transactions) && transactions.length > 0) {
                console.info('Analytics API missing pieces; using client-side fallback derived from transactions');
                const fallbackAnalytics = buildFallbackAnalytics(transactions);
                if (monthlyData.length === 0) monthlyData = fallbackAnalytics.monthlyTrends;
                if (categoriesMissing) categoriesData = fallbackAnalytics.categories;
                if (trendsMissing) trendsData = { ...(trendsData || {}), dailyTrends: fallbackAnalytics.dailyTrends };
                if (!summaryData || (!summaryData.totalIncome && !summaryData.totalExpenses)) {
                  summaryData = fallbackAnalytics.summary;
                }
              }
            } else {
              console.warn('Fallback transactions request failed', fallbackRes.status);
            }
          } catch (fallbackErr) {
            console.error('Fallback analytics error:', fallbackErr);
          }
        }

        setMonthlyTrends(Array.isArray(monthlyData) ? monthlyData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setTrends(trendsData || {});
        setSummary(summaryData || null);
      } catch (err: any) {
        console.error('Analytics fetch error:', err);
        setError(err.message || 'Error fetching analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <ProtectedClient>
    <div
      className={cn(
        "flex flex-col md:flex-row w-full flex-1 bg-gradient-to-br from-black via-zinc-950 to-neutral-950 text-slate-100",
        "min-h-screen md:h-screen md:overflow-hidden"
      )}
    >
      <SidebarComponent activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex flex-1">
        <div className="p-4 sm:p-6 md:p-8 rounded-tl-2xl border border-zinc-900 bg-black/70 backdrop-blur-sm flex flex-col gap-6 sm:gap-7 flex-1 w-full md:h-full md:overflow-y-auto">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">Analytics</h1>
            <p className="text-xs sm:text-sm text-zinc-400">Clear, responsive views of your money across devices.</p>
          </div>

          {/* Temp debug panel to validate data presence */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="font-semibold text-zinc-200">Data debug (temporary)</span>
              <button
                onClick={() => setShowDebug((prev) => !prev)}
                className="px-2 py-1 rounded-lg border border-zinc-700 text-[11px] text-zinc-200 hover:border-zinc-500 transition-colors"
              >
                {showDebug ? "Hide" : "Show"}
              </button>
            </div>
            {showDebug && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-300">
                <div className="rounded-lg border border-zinc-800 bg-black/30 p-2">
                  <p>monthlyTrends: {monthlyTrends?.length ?? 0}</p>
                  {monthlyTrends?.[0] && (
                    <p className="text-zinc-400">first month: {monthlyTrends[0].monthName || monthlyTrends[0].month}</p>
                  )}
                </div>
                <div className="rounded-lg border border-zinc-800 bg-black/30 p-2">
                  <p>categories: {categories?.length ?? 0}</p>
                  {categories?.[0] && <p className="text-zinc-400">first: {categories[0].category || categories[0]._id}</p>}
                </div>
                <div className="rounded-lg border border-zinc-800 bg-black/30 p-2">
                  <p>dailyTrends: {trends?.dailyTrends?.length ?? 0}</p>
                  {trends?.dailyTrends?.[0] && <p className="text-zinc-400">first date: {trends.dailyTrends[0].date}</p>}
                </div>
                <div className="rounded-lg border border-zinc-800 bg-black/30 p-2">
                  <p>summary present: {summary ? "yes" : "no"}</p>
                  {summary && (
                    <>
                      <p className="text-zinc-400">expenses: {summary.totalExpenses ?? "-"}</p>
                      <p className="text-zinc-400">budget: {summary.monthlyBudget ?? "-"}</p>
                    </>
                  )}
                </div>
                {error && (
                  <div className="rounded-lg border border-rose-700 bg-rose-900/20 p-2 text-rose-200">
                    error: {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
              label="Net Income"
              value={loading ? "—" : summary ? `₹${Number(summary.netIncome ?? 0).toLocaleString('en-IN')}` : "—"}
              tone="from-emerald-600/30 to-emerald-600/10"
              helper={summary?.netIncomeChange ? `${summary.netIncomeChange >= 0 ? "+" : ""}${summary.netIncomeChange}% vs last month` : ""}
            />
            <StatCard
              icon={<Wallet className="w-5 h-5 text-sky-400" />}
              label="Monthly Budget"
              value={loading ? "—" : summary?.monthlyBudget ? `₹${Number(summary.monthlyBudget).toLocaleString('en-IN')}` : "Not set"}
              tone="from-sky-600/30 to-sky-600/10"
              helper={summary?.monthlyBudget ? `${Math.min(100, Math.round(((summary.totalExpenses || 0) / summary.monthlyBudget) * 100))}% used` : "Set a budget in Dashboard"}
            />
            <StatCard
              icon={<Activity className="w-5 h-5 text-violet-400" />}
              label="Daily Avg Spend"
              value={loading ? "—" : computeDailyAverage()}
              tone="from-violet-600/30 to-violet-600/10"
              helper="Current month average"
            />
            <StatCard
              icon={<Target className="w-5 h-5 text-amber-400" />}
              label="Savings Rate"
              value={loading ? "—" : summary?.savingsRate != null ? `${Math.round(summary.savingsRate * 100) / 100}%` : "—"}
              tone="from-amber-600/30 to-amber-600/10"
              helper={summary?.savingsRateChange ? `${summary.savingsRateChange >= 0 ? "+" : ""}${summary.savingsRateChange}% vs last month` : ""}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <Card shellTitle="Income vs Spending">
              {loading ? (
                <EmptyState message="Loading chart..." icon={<BarChart3 className="w-10 h-10 text-zinc-600" />} />
              ) : error ? (
                <EmptyState message={error} icon={<TrendingDown className="w-10 h-10 text-rose-500" />} />
              ) : monthlyTrends?.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="monthName" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #27272a', borderRadius: '8px', color: '#e5e7eb' }} formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                    <Area type="monotone" dataKey="totalIncome" stroke="#22c55e" fill="#22c55e" fillOpacity={0.22} name="Income" />
                    <Area type="monotone" dataKey="totalExpenses" stroke="#f97316" fill="#f97316" fillOpacity={0.22} name="Expenses" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPrompt />
              )}
            </Card>

            <Card shellTitle="Category Share">
              {loading ? (
                <EmptyState message="Loading categories..." icon={<PieChart className="w-10 h-10 text-zinc-600" />} />
              ) : error ? (
                <EmptyState message={error} icon={<TrendingDown className="w-10 h-10 text-rose-500" />} />
              ) : categories?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={categories} dataKey="totalAmount" nameKey="category" cx="50%" cy="50%" outerRadius="80%">
                          {categories.map((_, idx) => (
                            <Cell key={idx} fill={colors[idx % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {categories.slice(0, 5).map((c: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                          <p className="text-sm text-slate-100 truncate">{c.category || c._id || 'Category'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">₹{Number(c.totalAmount || 0).toLocaleString('en-IN')}</p>
                          {c.percentage != null && <p className="text-xs text-zinc-400">{c.percentage.toFixed(1)}%</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyPrompt />
              )}
            </Card>
          </div>

          {/* Bars + list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            <Card shellTitle="Category Spend (Top)">
              {loading ? (
                <EmptyState message="Loading..." icon={<BarChart3 className="w-10 h-10 text-zinc-600" />} />
              ) : categories?.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={categories.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="category" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #27272a', borderRadius: '8px', color: '#e5e7eb' }} formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                    <Bar dataKey="totalAmount" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyPrompt />
              )}
            </Card>

            <Card shellTitle="Budget & Overruns" className="lg:col-span-2">
              {loading ? (
                <EmptyState message="Loading..." icon={<Target className="w-10 h-10 text-zinc-600" />} />
              ) : categories?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {categories.slice(0, 6).map((c: any, idx: number) => {
                    const spent = c.totalAmount || 0;
                    const budget = c.budget || Math.max(spent * 1.2, spent + 1);
                    const pct = Math.min(120, Math.round((spent / budget) * 100));
                    return (
                      <div key={idx} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-100 truncate">{c.category || c._id || 'Category'}</p>
                          <span className="text-xs text-zinc-400">{pct}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full",
                              pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-zinc-400 mt-2">
                          <span>Spent: ₹{Math.round(spent).toLocaleString('en-IN')}</span>
                          <span>Budget: ₹{Math.round(budget).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyPrompt />
              )}
            </Card>
          </div>

          {/* Insights */}
          <Card shellTitle="Smart Insights">
            {loading ? (
              <EmptyState message="Loading insights..." icon={<Lightbulb className="w-8 h-8 text-amber-400" />} />
            ) : summary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Insight pill="Savings" icon={<TrendingUpIcon className="w-4 h-4 text-emerald-400" />} text={`Savings rate: ${summary.savingsRate != null ? `${Math.round(summary.savingsRate * 100) / 100}%` : 'N/A'}`} />
                <Insight pill="Budget" icon={<Target className="w-4 h-4 text-sky-400" />} text={summary.monthlyBudget ? `Budget: ₹${summary.monthlyBudget.toLocaleString('en-IN')}` : "Set your budget to track adherence"} />
                <Insight pill="Spend" icon={<Activity className="w-4 h-4 text-violet-400" />} text={(() => {
                  const daily = trends?.dailyTrends || [];
                  if (!daily.length) return "Add transactions to see spend velocity";
                  const avg = Math.round(daily.reduce((s: number, d: any) => s + (d.totalAmount || 0), 0) / daily.length);
                  return `Avg daily spend: ₹${avg.toLocaleString('en-IN')}`;
                })()} />
              </div>
            ) : (
              <EmptyPrompt />
            )}
          </Card>
        </div>
      </div>
    </div>
    </ProtectedClient>
  );
};

export default Analytics;