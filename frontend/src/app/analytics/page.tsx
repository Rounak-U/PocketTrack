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
import { Logo, LogoIcon } from "@/app/dashboard/page";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Mock data
const monthlyTrendData = [
  { month: 'Jan', spend: 8500, income: 50000, savings: 41500 },
  { month: 'Feb', spend: 9200, income: 50000, savings: 40800 },
  { month: 'Mar', spend: 7800, income: 50000, savings: 42200 },
  { month: 'Apr', spend: 10100, income: 50000, savings: 39900 },
  { month: 'May', spend: 12500, income: 50000, savings: 37500 },
  { month: 'Jun', spend: 11800, income: 52000, savings: 40200 }
];

const categoryTrendData = [
  { category: 'Food & Dining', current: 3500, previous: 2800, change: 25 },
  { category: 'Transportation', current: 2200, previous: 2400, change: -8.3 },
  { category: 'Shopping', current: 2800, previous: 3200, change: -12.5 },
  { category: 'Entertainment', current: 1500, previous: 1200, change: 25 },
  { category: 'Bills & Utilities', current: 1800, previous: 1700, change: 5.9 },
  { category: 'Others', current: 700, previous: 800, change: -12.5 }
];

const budgetData = [
  { category: 'Food & Dining', budget: 4000, spent: 3500, remaining: 500 },
  { category: 'Transportation', budget: 2500, spent: 2200, remaining: 300 },
  { category: 'Shopping', budget: 3000, spent: 2800, remaining: 200 },
  { category: 'Entertainment', budget: 2000, spent: 1500, remaining: 500 },
  { category: 'Bills & Utilities', budget: 2000, spent: 1800, remaining: 200 }
];

const insights = [
  { type: 'trend', message: 'Your savings rate has improved by 15% this quarter', icon: TrendingUpIcon, color: 'text-green-600' },
  { type: 'warning', message: 'Food spending exceeded budget by 12.5%', icon: TrendingDown, color: 'text-red-600' },
  { type: 'tip', message: 'Consider increasing transportation budget for work commute', icon: Lightbulb, color: 'text-blue-600' }
];

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

  const LogoWrapper = () => {
    try {
      // useSidebar may throw if used outside provider in some rendering paths — guard it
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useSidebar } = require('@/components/ui/sidebar') as any;
      const { open } = useSidebar();
      return open ? <Logo /> : <LogoIcon />;
    } catch (e) {
      return <Logo />;
    }
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
        <Wallet className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: (
        <Settings className="text-white h-5 w-5 flex-shrink-0" />
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 mt-2 text-sm text-white hover:bg-red-600/20 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
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

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const API_BASE = (process.env.NEXT_PUBLIC_API_URL) ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:5000';

        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch multiple endpoints in parallel
        const [monthlyRes, categoriesRes, trendsRes, summaryRes] = await Promise.all([
          fetch(`${API_BASE}/api/analytics/monthly`, { headers }),
          fetch(`${API_BASE}/api/analytics/categories`, { headers }),
          fetch(`${API_BASE}/api/analytics/trends`, { headers }),
          fetch(`${API_BASE}/api/analytics/summary`, { headers })
        ]);

        // Handle any non-ok responses
        const allResponses = [monthlyRes, categoriesRes, trendsRes, summaryRes];
        for (const res of allResponses) {
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || 'Failed to load analytics data');
          }
        }

        const monthlyJson = await monthlyRes.json();
        const categoriesJson = await categoriesRes.json();
        const trendsJson = await trendsRes.json();
        const summaryJson = await summaryRes.json();

        setMonthlyTrends(monthlyJson.monthlyTrends || monthlyJson.monthlyTrends || []);
        setCategories(categoriesJson.categories || categoriesJson.spendingByCategory || []);
        setTrends(trendsJson || {});
        setSummary(summaryJson.summary || summaryJson);
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
        "flex flex-col md:flex-row w-full flex-1 overflow-hidden bg-gradient-to-br from-black via-zinc-950 to-neutral-950 text-slate-100",
        "h-screen"
      )}
    >
      <SidebarComponent activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex flex-1">
        <div className="p-4 md:p-8 rounded-tl-2xl border border-zinc-900 bg-black/70 backdrop-blur-sm flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-slate-50 mb-2">Analytics</h1>
            <p className="text-sm text-zinc-400">Deep dive into your financial data with advanced analytics and insights.</p>
          </div>

          {/* Monthly Trend Chart */}
          <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-6 shadow-lg border border-zinc-800">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Income vs Spending Trend</h3>
            {loading ? (
              <div className="flex items-center justify-center h-72 text-sm text-zinc-400">Loading chart...</div>
            ) : error ? (
              <div className="flex items-center justify-center h-72 text-sm text-rose-400">{error}</div>
            ) : (monthlyTrends && monthlyTrends.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="monthName" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #27272a', borderRadius: '8px', color: '#e5e7eb' }}
                    formatter={(value) => `₹${value}`}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="totalIncome" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
                  <Area type="monotone" dataKey="totalExpenses" stackId="2" stroke="#f97316" fill="#f97316" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-72 text-sm text-zinc-400">No monthly data available</div>
            ))}
          </div>

          {/* Category Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-6 shadow-lg border border-zinc-800">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Category Spending Changes</h3>
              {loading ? (
                <div className="flex items-center justify-center h-72 text-sm text-zinc-400">Loading categories...</div>
              ) : error ? (
                <div className="flex items-center justify-center h-72 text-sm text-rose-400">{error}</div>
              ) : (categories && categories.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="category" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #27272a', borderRadius: '8px', color: '#e5e7eb' }}
                      formatter={(value) => [`₹${value}`, '']}
                    />
                    <Bar dataKey="totalAmount" fill="#38bdf8" name="Amount" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-72 text-sm text-zinc-400">No category data</div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-6 shadow-lg border border-zinc-800">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Budget vs Actual</h3>
                    <div className="space-y-4">
                    {loading ? (
                      <p className="text-sm text-zinc-400">Loading budget...</p>
                    ) : error ? (
                      <p className="text-sm text-rose-400">{error}</p>
                    ) : (categories && categories.length ? (
                      categories.slice(0,5).map((c:any, index:number)=>{
                        const item = { category: c.category || c._id, budget: (c.totalAmount||0)*1.2 || 0, spent: c.totalAmount || 0 };
                        const remaining = Math.round(item.budget - item.spent);
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-zinc-300">{item.category}</p>
                              <div className="w-full bg-zinc-800 rounded-full h-2 mt-1">
                                <div
                                  className="bg-emerald-500 h-2 rounded-full"
                                  style={{ width: `${(item.spent / Math.max(1, item.budget)) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-sm text-slate-100">₹{item.spent} / ₹{item.budget}</p>
                              <p className={`text-xs ${remaining > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {remaining > 0 ? `₹${remaining} left` : `₹${Math.abs(remaining)} over`}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-zinc-400">No budget/category data</p>
                    ))}
                  </div>
            </div>
          </div>

          {/* Advanced Insights */}
          <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-6 shadow-lg border border-zinc-800">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Advanced Insights</h3>
              <div className="space-y-4">
              {loading && <p className="text-sm text-zinc-400">Loading insights...</p>}
              {error && <p className="text-sm text-rose-400">{error}</p>}
              {!loading && !error && (summary ? (
                <>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-zinc-900/80">
                    <TrendingUpIcon className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="text-sm text-slate-100">Savings Rate: {summary.savingsRate ? `${Math.round(summary.savingsRate*100)/100}%` : '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-zinc-900/80">
                    <Target className="w-6 h-6 text-sky-400" />
                    <div>
                      <p className="text-sm text-slate-100">Budget: ₹{summary.monthlyBudget || '—'}</p>
                    </div>
                  </div>
                </>
              ) : (
                insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-zinc-900/80">
                    <insight.icon className={cn("w-6 h-6", insight.color.replace('text-', 'text-'))} />
                    <div>
                      <p className="text-sm text-slate-100">{insight.message}</p>
                    </div>
                  </div>
                ))
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-6 shadow-lg border border-zinc-800 text-center">
              <TrendingUpIcon className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-slate-100">Savings Rate</h4>
              <p className="text-2xl font-bold text-emerald-400">{loading ? '-' : (summary && typeof summary.savingsRate !== 'undefined' ? `${Math.round(summary.savingsRate*100)/100}%` : '-')}</p>
              <p className="text-sm text-zinc-400">{loading ? '' : (summary ? (summary.savingsRateChange ? `${summary.savingsRateChange >=0 ? '+' : ''}${Math.round(summary.savingsRateChange*100)/100}% from last month` : '') : '')}</p>
            </div>
            <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-6 shadow-lg border border-zinc-800 text-center">
              <Target className="w-8 h-8 text-sky-400 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-slate-100">Budget Adherence</h4>
              <p className="text-2xl font-bold text-sky-400">{loading ? '-' : (summary && summary.monthlyBudget ? `${Math.round(((summary.totalExpenses||0) / summary.monthlyBudget) * 10000) / 100}%` : '-')}</p>
              <p className="text-sm text-zinc-400">{loading ? '' : (summary ? `${summary.overBudgetCategories || 0} categories over budget` : '')}</p>
            </div>
            <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-6 shadow-lg border border-zinc-800 text-center">
              <Activity className="w-8 h-8 text-violet-400 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-slate-100">Spending Velocity</h4>
              <p className="text-2xl font-bold text-violet-400">{loading ? '-' : (() => {
                try {
                  const daily = (trends && trends.dailyTrends) || [];
                  if (!daily.length) return '-';
                  const sum = daily.reduce((s:any, d:any) => s + (d.totalAmount || 0), 0);
                  const avg = Math.round((sum / daily.length));
                  return `₹${avg}/day`;
                } catch (e) { return '-'; }
              })()}</p>
              <p className="text-sm text-zinc-400">Average daily spend</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedClient>
  );
};

export default Analytics;