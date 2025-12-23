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

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const API_BASE = getApiBase();

        // Fetch multiple endpoints in parallel - handle each independently
        const [monthlyRes, categoriesRes, trendsRes, summaryRes] = await Promise.allSettled([
          apiFetch(`${API_BASE}/api/analytics/monthly`),
          apiFetch(`${API_BASE}/api/analytics/categories`),
          apiFetch(`${API_BASE}/api/analytics/trends`),
          apiFetch(`${API_BASE}/api/analytics/summary`)
        ]);

        // Process monthly trends
        if (monthlyRes.status === 'fulfilled' && monthlyRes.value.ok) {
          try {
            const monthlyJson = await monthlyRes.value.json();
            const monthlyData = monthlyJson?.monthlyTrends || monthlyJson?.data || [];
            setMonthlyTrends(Array.isArray(monthlyData) ? monthlyData : []);
          } catch (e) {
            console.error('Error parsing monthly data:', e);
            setMonthlyTrends([]);
          }
        } else {
          console.warn('Monthly analytics failed:', monthlyRes.status === 'rejected' ? monthlyRes.reason : 'Response not OK');
          setMonthlyTrends([]);
        }

        // Process categories - try multiple periods to get data
        let categoryDataFound = false;
        
        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
          try {
            const categoriesJson = await categoriesRes.value.json();
            console.log('Categories response:', categoriesJson);
            const categoryData = categoriesJson?.categories || categoriesJson?.spendingByCategory || categoriesJson?.data || [];
            console.log('Parsed category data:', categoryData, 'Length:', categoryData?.length);
            if (Array.isArray(categoryData) && categoryData.length > 0) {
              setCategories(categoryData);
              categoryDataFound = true;
              console.log('Set categories from current month:', categoryData.length);
            }
          } catch (e) {
            console.error('Error parsing categories data:', e);
          }
        } else {
          console.warn('Categories API failed:', categoriesRes.status === 'rejected' ? categoriesRes.reason : 'Response not OK');
        }

        // If no categories found, try different periods as fallback
        if (!categoryDataFound) {
          console.log('No categories in current month, trying fallback periods...');
          const fallbackPeriods = ['year', 'quarter'];
          for (const period of fallbackPeriods) {
            try {
              console.log(`Trying ${period} period...`);
              const fallbackRes = await apiFetch(`${API_BASE}/api/analytics/categories?period=${period}`);
              if (fallbackRes.ok) {
                const fallbackJson = await fallbackRes.json();
                const fallbackData = fallbackJson?.categories || fallbackJson?.spendingByCategory || [];
                console.log(`Fallback ${period} data:`, fallbackData, 'Length:', fallbackData?.length);
                if (Array.isArray(fallbackData) && fallbackData.length > 0) {
                  setCategories(fallbackData);
                  categoryDataFound = true;
                  console.log(`✓ Found ${fallbackData.length} categories using ${period} period`);
                  break;
                }
              } else {
                console.warn(`Fallback ${period} period failed:`, fallbackRes.status, fallbackRes.statusText);
              }
            } catch (fallbackError) {
              console.warn(`Error fetching categories for ${period} period:`, fallbackError);
            }
          }
          
          if (!categoryDataFound) {
            console.warn('No categories found in any period - user may not have expense transactions');
            setCategories([]);
          }
        }

        // Process trends
        if (trendsRes.status === 'fulfilled' && trendsRes.value.ok) {
          try {
            const trendsJson = await trendsRes.value.json();
            setTrends(trendsJson || {});
          } catch (e) {
            console.error('Error parsing trends data:', e);
            setTrends({});
          }
        } else {
          console.warn('Trends analytics failed:', trendsRes.status === 'rejected' ? trendsRes.reason : 'Response not OK');
          setTrends({});
        }

        // Process summary
        if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
          try {
            const summaryJson = await summaryRes.value.json();
            setSummary(summaryJson?.summary || summaryJson || null);
          } catch (e) {
            console.error('Error parsing summary data:', e);
            setSummary(null);
          }
        } else {
          console.warn('Summary analytics failed:', summaryRes.status === 'rejected' ? summaryRes.reason : 'Response not OK');
          setSummary(null);
        }

        // Only set error if ALL requests failed
        const allFailed = 
          (monthlyRes.status === 'rejected' || (monthlyRes.status === 'fulfilled' && !monthlyRes.value.ok)) &&
          (categoriesRes.status === 'rejected' || (categoriesRes.status === 'fulfilled' && !categoriesRes.value.ok)) &&
          (trendsRes.status === 'rejected' || (trendsRes.status === 'fulfilled' && !trendsRes.value.ok)) &&
          (summaryRes.status === 'rejected' || (summaryRes.status === 'fulfilled' && !summaryRes.value.ok));

        if (allFailed) {
          setError('Unable to load analytics data. Please try again or upload transactions first.');
        }
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
              value={loading ? "—" : (() => {
                const daily = trends?.dailyTrends || [];
                if (!daily.length) return "—";
                const avg = Math.round(daily.reduce((s: number, d: any) => s + (d.totalAmount || 0), 0) / daily.length);
                return `₹${avg.toLocaleString('en-IN')}`;
              })()}
              tone="from-violet-600/30 to-violet-600/10"
              helper="Past 30 days"
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