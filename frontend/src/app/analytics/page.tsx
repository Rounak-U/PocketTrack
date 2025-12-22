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
        <div className="p-4 sm:p-6 md:p-8 rounded-tl-2xl border border-zinc-900 bg-black/70 backdrop-blur-sm flex flex-col gap-4 sm:gap-6 flex-1 w-full md:h-full md:overflow-y-auto">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">Analytics</h1>
            <p className="text-xs sm:text-sm text-zinc-400">Deep dive into your financial data with advanced analytics and insights.</p>
          </div>

          {/* Monthly Trend Chart */}
          <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-4 sm:p-6 shadow-lg border border-zinc-800">
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-4">Income vs Spending Trend</h3>
            {loading ? (
              <div className="flex items-center justify-center h-48 sm:h-72 text-xs sm:text-sm text-zinc-400">Loading chart...</div>
            ) : error ? (
              <div className="flex items-center justify-center h-48 sm:h-72 text-xs sm:text-sm text-rose-400">{error}</div>
            ) : (monthlyTrends && monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="monthName" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #27272a', borderRadius: '8px', color: '#e5e7eb' }}
                    formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="totalIncome" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} name="Income" />
                  <Area type="monotone" dataKey="totalExpenses" stackId="2" stroke="#f97316" fill="#f97316" fillOpacity={0.25} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 sm:h-72 text-xs sm:text-sm text-zinc-400">
                <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-600 mb-4" />
                <p className="text-sm sm:text-base text-zinc-400 mb-2">No monthly data available</p>
                <p className="text-xs text-zinc-500 mb-4">Upload transaction statements to see your analytics</p>
                <Link href="/upload" className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  Upload Statement
                </Link>
              </div>
            ))}
          </div>

          {/* Category Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-4 sm:p-6 shadow-lg border border-zinc-800">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-4">Category Spending Changes</h3>
              {loading ? (
                <div className="flex items-center justify-center h-48 sm:h-72 text-xs sm:text-sm text-zinc-400">Loading categories...</div>
              ) : error ? (
                <div className="flex items-center justify-center h-48 sm:h-72 text-xs sm:text-sm text-rose-400">{error}</div>
              ) : (categories && categories.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis 
                      dataKey="category" 
                      stroke="#6b7280" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #27272a', borderRadius: '8px', color: '#e5e7eb' }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spent']}
                      labelFormatter={(label) => `Category: ${label}`}
                    />
                    <Bar 
                      dataKey="totalAmount" 
                      fill="#38bdf8" 
                      name="Amount"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 sm:h-72 text-xs sm:text-sm text-zinc-400">
                  <PieChart className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-600 mb-4" />
                  <p className="text-sm sm:text-base text-zinc-400 mb-2">No category data</p>
                  <p className="text-xs text-zinc-500 mb-4">Upload transactions to see category breakdown</p>
                  <Link href="/upload" className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Statement
                  </Link>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-4 sm:p-6 shadow-lg border border-zinc-800">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-4">Category Spending Overview</h3>
                    <div className="space-y-3 sm:space-y-4">
                    {loading ? (
                      <p className="text-xs sm:text-sm text-zinc-400">Loading categories...</p>
                    ) : error ? (
                      <p className="text-xs sm:text-sm text-rose-400">{error}</p>
                    ) : (categories && categories.length > 0 ? (
                      categories.slice(0,5).map((c:any, index:number)=>{
                        const categoryName = c.category || c._id || 'Unknown';
                        const spent = c.totalAmount || 0;
                        // Calculate estimated budget (120% of spent) or use actual budget if available
                        const estimatedBudget = Math.round(spent * 1.2);
                        const remaining = estimatedBudget - spent;
                        const percentage = Math.min(100, (spent / Math.max(1, estimatedBudget)) * 100);
                        
                        return (
                          <div key={index} className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm text-zinc-300 font-medium truncate">{categoryName}</p>
                              <div className="w-full bg-zinc-800 rounded-full h-2 mt-1">
                                <div
                                  className={`h-2 rounded-full ${percentage >= 100 ? 'bg-rose-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-right ml-2 sm:ml-4 flex-shrink-0">
                              <p className="text-xs sm:text-sm text-slate-100">₹{Math.round(spent).toLocaleString('en-IN')}</p>
                              <p className="text-xs text-zinc-400 mt-1">
                                {c.percentage ? `${c.percentage.toFixed(1)}%` : ''}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-xs sm:text-sm text-zinc-400">
                        <Target className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-600 mb-3" />
                        <p className="text-sm sm:text-base">No category data available</p>
                        <p className="text-xs text-zinc-500 mt-1 mb-4">Upload transactions to see category breakdown</p>
                        <Link href="/upload" className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors">
                          <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                          Upload Statement
                        </Link>
                      </div>
                    ))}
                  </div>
            </div>
          </div>

          {/* Advanced Insights */}
          <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-4 sm:p-6 shadow-lg border border-zinc-800">
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-4">Advanced Insights</h3>
              <div className="space-y-4">
              {loading && <p className="text-sm text-zinc-400">Loading insights...</p>}
              {error && <p className="text-sm text-rose-400">{error}</p>}
              {!loading && !error && (summary ? (
                <>
                  {summary.savingsRate !== null && summary.savingsRate !== undefined ? (
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-zinc-900/80">
                      <TrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-slate-100">Savings Rate: {Math.round(summary.savingsRate*100)/100}%</p>
                      </div>
                    </div>
                  ) : null}
                  {summary.monthlyBudget && summary.monthlyBudget > 0 ? (
                    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-zinc-900/80">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-slate-100">Budget: ₹{summary.monthlyBudget.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-zinc-900/80">
                      <Target className="w-6 h-6 text-zinc-400" />
                      <div>
                        <p className="text-sm text-slate-100">Budget: Not Set</p>
                        <p className="text-xs text-zinc-400 mt-1">Set your budget in the dashboard to track spending</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-sm text-zinc-400">
                  <Target className="w-12 h-12 text-zinc-600 mb-3" />
                  <p className="text-base">No insights available</p>
                  <p className="text-xs text-zinc-500 mt-1">Upload transactions to see insights</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-6 shadow-lg border border-zinc-800 text-center">
              <TrendingUpIcon className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-slate-100">Savings Rate</h4>
              <p className="text-2xl font-bold text-emerald-400">{loading ? '-' : (summary && summary.savingsRate !== null && summary.savingsRate !== undefined ? `${Math.round(summary.savingsRate*100)/100}%` : 'Not Set')}</p>
              <p className="text-sm text-zinc-400">{loading ? '' : (summary && summary.savingsRate !== null ? (summary.savingsRateChange ? `${summary.savingsRateChange >=0 ? '+' : ''}${Math.round(summary.savingsRateChange*100)/100}% from last month` : '') : 'Set budget to see savings rate')}</p>
            </div>
            <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-6 shadow-lg border border-zinc-800 text-center">
              <Target className="w-8 h-8 text-sky-400 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-slate-100">Budget Adherence</h4>
              <p className="text-2xl font-bold text-sky-400">{loading ? '-' : (summary && summary.monthlyBudget && summary.monthlyBudget > 0 ? `${Math.round(((summary.totalExpenses||0) / summary.monthlyBudget) * 10000) / 100}%` : 'Not Set')}</p>
              <p className="text-sm text-zinc-400">{loading ? '' : (summary && summary.monthlyBudget > 0 ? `${summary.overBudgetCategories || 0} categories over budget` : 'Set budget in dashboard')}</p>
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