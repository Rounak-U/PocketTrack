"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedClient from '@/components/auth/ProtectedClient';
import {
  Home,
  LogOut,
  Upload,
  Lightbulb,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search,
  PieChart,
  CreditCard,
  Settings,
  Wallet
} from 'lucide-react';

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Logo } from "@/app/dashboard/page";
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { apiFetch, getApiBase } from "@/lib/api";

type Insight = {
  id: string;
  type: 'warning' | 'tip' | 'info';
  severity: 'high' | 'medium' | 'low';
  message: string;
  date: string;
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
    { label: "Analytics", href: "/analytics", icon: <PieChart className="text-white h-5 w-5 flex-shrink-0" /> },
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

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high': return 'bg-red-500/15 text-red-300 border border-red-500/40';
    case 'medium': return 'bg-amber-500/15 text-amber-300 border border-amber-500/40';
    case 'low': return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40';
    default: return 'bg-zinc-800 text-zinc-200 border border-zinc-600';
  }
};

const InsightsPage: React.FC = () => {
  const [activeItem, setActiveItem] = useState('insights');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all'|'high'|'medium'|'low'>('all');

  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canShowInsights, setCanShowInsights] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchInsights() {
      setLoading(true);
      setError(null);

      const API_ORIGIN = getApiBase();

      try {
        const [summaryRes, categoriesRes, trendsRes, monthlyRes] = await Promise.allSettled([
          apiFetch(`${API_ORIGIN}/api/analytics/summary`),
          apiFetch(`${API_ORIGIN}/api/analytics/categories`),
          apiFetch(`${API_ORIGIN}/api/analytics/trends`),
          apiFetch(`${API_ORIGIN}/api/analytics/monthly`)
        ]);

        // Process each response independently
        let summaryJson = null;
        let categoriesJson = null;
        let trendsJson = null;
        let monthlyJson = null;
        let summary: any = null;

        if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
          try {
            summaryJson = await summaryRes.value.json();
          } catch (e) {
            console.error('Error parsing summary:', e);
          }
        }

        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
          try {
            categoriesJson = await categoriesRes.value.json();
          } catch (e) {
            console.error('Error parsing categories:', e);
          }
        }

        if (trendsRes.status === 'fulfilled' && trendsRes.value.ok) {
          try {
            trendsJson = await trendsRes.value.json();
          } catch (e) {
            console.error('Error parsing trends:', e);
          }
        }

        if (monthlyRes.status === 'fulfilled' && monthlyRes.value.ok) {
          try {
            monthlyJson = await monthlyRes.value.json();
          } catch (e) {
            console.error('Error parsing monthly:', e);
          }
        }

        // Only throw error if ALL requests failed
        const allFailed = 
          (summaryRes.status === 'rejected' || (summaryRes.status === 'fulfilled' && !summaryRes.value.ok)) &&
          (categoriesRes.status === 'rejected' || (categoriesRes.status === 'fulfilled' && !categoriesRes.value.ok)) &&
          (trendsRes.status === 'rejected' || (trendsRes.status === 'fulfilled' && !trendsRes.value.ok)) &&
          (monthlyRes.status === 'rejected' || (monthlyRes.status === 'fulfilled' && !monthlyRes.value.ok));

        if (allFailed) {
          throw new Error('No analytics available. Please upload transactions first.');
        }

        const results: Insight[] = [];
        const now = new Date();

        // Generate insights from categories
        const categories = categoriesJson?.categories || [];
        if (Array.isArray(categories) && categories.length > 0) {
          const top = categories[0];
          if (top) {
            // If top category is >= 30%, it's a warning
            if (top.percentage >= 30) {
              results.push({ 
                id: 'cat-top', 
                type: 'warning', 
                severity: 'high', 
                message: `You spent ${top.percentage.toFixed(1)}% of your expenses on ${top.category} this period. Consider reviewing this category.`, 
                date: now.toISOString().split('T')[0] 
              });
            } else if (top.percentage >= 20) {
              // If 20-30%, it's a medium tip
              results.push({ 
                id: 'cat-top-medium', 
                type: 'tip', 
                severity: 'medium', 
                message: `${top.category} is your top spending category at ${top.percentage.toFixed(1)}% of total expenses.`, 
                date: now.toISOString().split('T')[0] 
              });
            }
            
            // If there are multiple categories, show distribution insight
            if (categories.length >= 3) {
              const top3Total = categories.slice(0, 3).reduce((sum: number, cat: any) => sum + (cat.percentage || 0), 0);
              if (top3Total >= 70) {
                results.push({ 
                  id: 'cat-concentrated', 
                  type: 'info', 
                  severity: 'low', 
                  message: `Your top 3 categories account for ${top3Total.toFixed(1)}% of spending, showing concentrated spending patterns.`, 
                  date: now.toISOString().split('T')[0] 
                });
              }
            }
          }
        }

        // Generate insights from monthly trends
        const monthlyTrends = monthlyJson?.monthlyTrends || [];
        if (Array.isArray(monthlyTrends) && monthlyTrends.length >= 2) {
          const last = monthlyTrends[monthlyTrends.length - 1];
          const prev = monthlyTrends[monthlyTrends.length - 2];
          const lastExpense = last.totalExpenses || 0;
          const prevExpense = prev.totalExpenses || 0;
          
          if (prevExpense > 0) {
            const changePercent = ((lastExpense - prevExpense) / prevExpense) * 100;
            if (changePercent >= 20) {
              results.push({ 
                id: 'momo-spike', 
                type: 'warning', 
                severity: 'medium', 
                message: `Spending increased ${Math.round(changePercent)}% compared to previous month. Review your expenses.`, 
                date: now.toISOString().split('T')[0] 
              });
            } else if (changePercent <= -15) {
              results.push({ 
                id: 'momo-decrease', 
                type: 'info', 
                severity: 'low', 
                message: `Great! Your spending decreased by ${Math.round(Math.abs(changePercent))}% compared to last month.`, 
                date: now.toISOString().split('T')[0] 
              });
            }
          }
        } else if (monthlyTrends.length === 1) {
          // If only one month of data, show encouraging message
          const month = monthlyTrends[0];
          if (month.totalExpenses > 0) {
            results.push({ 
              id: 'first-month', 
              type: 'info', 
              severity: 'low', 
              message: `You've tracked ${month.totalExpenses.toLocaleString('en-IN')} in expenses this month. Keep tracking to see trends!`, 
              date: now.toISOString().split('T')[0] 
            });
          }
        }

        // Generate insights from top merchants (recurring payments)
        const topMerchants = trendsJson?.topMerchants || [];
        if (Array.isArray(topMerchants) && topMerchants.length > 0) {
          topMerchants.slice(0, 5).forEach((m: any, idx: number) => {
            if (m.transactionCount >= 2) {
              results.push({ 
                id: `rec-${idx}`, 
                type: 'tip', 
                severity: 'medium', 
                message: `Recurring payments detected: ${m.merchant} (${m.transactionCount} transactions, ₹${(m.totalAmount || 0).toLocaleString('en-IN')}). Consider reviewing subscriptions.`, 
                date: now.toISOString().split('T')[0] 
              });
            }
          });
        }

        // Generate insights from summary data
        summary = summaryJson?.summary || summaryJson;

        const hasBudget = summary?.monthlyBudget && summary.monthlyBudget > 0;
        const hasSavings = typeof summary?.savingsRate === 'number';

        if (!hasBudget || !hasSavings) {
          if (mounted) {
            setCanShowInsights(false);
            setInsights([]);
            setLoading(false);
          }
          return;
        }

        setCanShowInsights(true);

        if (summary) {
          // Savings rate insights (only if budget is set)
          if (summary.savingsRate !== undefined && summary.savingsRate !== null) {
            if (summary.savingsRate < 10 && summary.savingsRate >= 0) {
              results.push({ 
                id: 'savings-low', 
                type: 'warning', 
                severity: 'high', 
                message: `Your savings rate is ${Math.round(summary.savingsRate)}% this month. Try to increase savings by at least 5%.`, 
                date: now.toISOString().split('T')[0] 
              });
            } else if (summary.savingsRate >= 20) {
              results.push({ 
                id: 'savings-good', 
                type: 'info', 
                severity: 'low', 
                message: `Excellent! Your savings rate is ${Math.round(summary.savingsRate)}%. Keep up the good work!`, 
                date: now.toISOString().split('T')[0] 
              });
            }
          }

          // Budget adherence insights (only if budget is set and > 0)
          if (summary.monthlyBudget && summary.monthlyBudget > 0 && summary.totalExpenses !== undefined) {
            const budgetUsed = (summary.totalExpenses / summary.monthlyBudget) * 100;
            if (budgetUsed >= 90 && budgetUsed < 100) {
              results.push({ 
                id: 'budget-warning', 
                type: 'warning', 
                severity: 'medium', 
                message: `You've used ${Math.round(budgetUsed)}% of your monthly budget. Be mindful of remaining expenses.`, 
                date: now.toISOString().split('T')[0] 
              });
            } else if (budgetUsed >= 100) {
              results.push({ 
                id: 'budget-exceeded', 
                type: 'warning', 
                severity: 'high', 
                message: `You've exceeded your monthly budget by ${Math.round(budgetUsed - 100)}%. Review your spending.`, 
                date: now.toISOString().split('T')[0] 
              });
            } else if (budgetUsed <= 50) {
              results.push({ 
                id: 'budget-good', 
                type: 'info', 
                severity: 'low', 
                message: `Great budget management! You've only used ${Math.round(budgetUsed)}% of your monthly budget.`, 
                date: now.toISOString().split('T')[0] 
              });
            }
          } else if (!summary.monthlyBudget || summary.monthlyBudget === 0) {
            // Suggest setting a budget if not set
            results.push({ 
              id: 'budget-not-set', 
              type: 'tip', 
              severity: 'low', 
              message: `Set a monthly budget in your dashboard to track your spending and get personalized insights.`, 
              date: now.toISOString().split('T')[0] 
            });
          }

          // Net income insights
          if (summary.netIncome !== undefined) {
            if (summary.netIncome < 0) {
              results.push({ 
                id: 'negative-net', 
                type: 'warning', 
                severity: 'high', 
                message: `Your expenses exceed income this month by ₹${Math.abs(summary.netIncome).toLocaleString('en-IN')}. Review your spending.`, 
                date: now.toISOString().split('T')[0] 
              });
            } else if (summary.netIncome > 0 && summary.totalIncome > 0) {
              const savingsPercent = (summary.netIncome / summary.totalIncome) * 100;
              if (savingsPercent >= 20) {
                results.push({ 
                  id: 'positive-net', 
                  type: 'info', 
                  severity: 'low', 
                  message: `You saved ₹${summary.netIncome.toLocaleString('en-IN')} this month (${Math.round(savingsPercent)}% of income). Well done!`, 
                  date: now.toISOString().split('T')[0] 
                });
              }
            }
          }
        }

        if (mounted) {
          setInsights(results.length ? results : []);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load insights');
          setInsights([]);
          setLoading(false);
        }
      }
    }

    fetchInsights();
    return () => { mounted = false; };
  }, []);

  const filtered = (insights || []).filter(i => (filterSeverity === 'all' || i.severity === filterSeverity) && i.message.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <ProtectedClient>
      <div className={cn("flex flex-col md:flex-row w-full flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100", "min-h-screen md:h-screen md:overflow-hidden")}>
        <SidebarComponent activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex flex-1">
          <div className="p-4 sm:p-6 md:p-8 rounded-tl-2xl border border-zinc-900 bg-gradient-to-br from-neutral-950 via-zinc-950 to-neutral-900 backdrop-blur-sm flex flex-col gap-4 sm:gap-6 flex-1 w-full md:h-full md:overflow-y-auto">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">Insights</h1>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">Signals and tips tailored from your spending.</p>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4 sm:w-5 sm:h-5" />
                  <input type="text" placeholder="Search insights..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-xs sm:text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="text-zinc-500 w-4 h-4 sm:w-5 sm:h-5" />
                <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as any)} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="all">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 sm:py-32">
                <Lightbulb className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-500 mx-auto mb-4 animate-pulse" />
                <p className="text-xs sm:text-sm text-zinc-500">Loading insights…</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 sm:py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-500/10 mb-4 sm:mb-6">
                  <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-rose-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-100 mb-2">Error loading insights</h3>
                <p className="text-xs sm:text-sm text-zinc-400 mb-4 sm:mb-6">{error}</p>
                <Link href="/upload" className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  Upload Statement
                </Link>
              </div>
            ) : !canShowInsights ? (
              <div className="text-center py-12 sm:py-24">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500/10 mb-4 sm:mb-6">
                  <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-100 mb-2">Set budget to see insights</h3>
                <p className="text-xs sm:text-sm text-zinc-400 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                  Add a monthly budget and savings rate in your dashboard to unlock personalized insights.
                </p>
                <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                  Go to Dashboard
                </Link>
              </div>
            ) : insights && insights.length ? (
              <div className="space-y-3 sm:space-y-4">
                {filtered.map(insight => (
                  <div key={insight.id} className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-xl p-4 sm:p-6 shadow-lg">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0">
                        {insight.type === 'warning' ? <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400" /> : insight.type === 'tip' ? <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-sky-400" /> : <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(insight.severity)}`}>{insight.severity.toUpperCase()}</span>
                          <span className="text-xs sm:text-sm text-zinc-500">{insight.date}</span>
                        </div>
                        <p className="text-slate-100 text-sm sm:text-base lg:text-lg break-words">{insight.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-24">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 mb-4 sm:mb-6">
                  <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-100 mb-2">No insights yet</h3>
                <p className="text-xs sm:text-sm text-zinc-400 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                  Upload your transaction statements to get personalized insights and recommendations about your spending habits.
                </p>
                <Link href="/upload" className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 hover-bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  Upload Statement
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </ProtectedClient>
  );
};

export default InsightsPage;


