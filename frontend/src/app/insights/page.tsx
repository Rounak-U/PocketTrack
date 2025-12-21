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
  Settings
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
    { label: "Transactions", href: "/transactions", icon: <CreditCard className="text-white h-5 w-5 flex-shrink-0" /> },
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

  useEffect(() => {
    let mounted = true;

    async function fetchInsights() {
      setLoading(true);
      setError(null);

      const API_ORIGIN = getApiBase();

      try {
        const [summaryRes, categoriesRes, trendsRes, monthlyRes] = await Promise.all([
          apiFetch(`${API_ORIGIN}/api/analytics/summary`),
          apiFetch(`${API_ORIGIN}/api/analytics/categories`),
          apiFetch(`${API_ORIGIN}/api/analytics/trends`),
          apiFetch(`${API_ORIGIN}/api/analytics/monthly`)
        ]);

        if (!summaryRes.ok && !categoriesRes.ok && !trendsRes.ok) {
          throw new Error('No analytics available');
        }

        const [summaryJson, categoriesJson, trendsJson, monthlyJson] = await Promise.all([
          summaryRes.ok ? summaryRes.json() : Promise.resolve(null),
          categoriesRes.ok ? categoriesRes.json() : Promise.resolve(null),
          trendsRes.ok ? trendsRes.json() : Promise.resolve(null),
          monthlyRes.ok ? monthlyRes.json() : Promise.resolve(null)
        ]);

        const results: Insight[] = [];
        const now = new Date();

        const categories = categoriesJson?.categories || [];
        if (Array.isArray(categories) && categories.length) {
          const top = categories[0];
          if (top && top.percentage >= 30) {
            results.push({ id: 'cat-top', type: 'warning', severity: 'high', message: `You spent ${top.percentage}% on ${top.category} this period. Consider reviewing this category.`, date: now.toISOString().split('T')[0] });
          }
        }

        const monthlyTrends = monthlyJson?.monthlyTrends || [];
        if (Array.isArray(monthlyTrends) && monthlyTrends.length >= 2) {
          const last = monthlyTrends[monthlyTrends.length - 1];
          const prev = monthlyTrends[monthlyTrends.length - 2];
          const lastExpense = last.totalExpenses || 0;
          const prevExpense = prev.totalExpenses || 0;
          if (prevExpense > 0 && ((lastExpense - prevExpense) / prevExpense) * 100 >= 20) {
            const pct = Math.round(((lastExpense - prevExpense) / prevExpense) * 100);
            results.push({ id: 'momo-spike', type: 'warning', severity: 'medium', message: `Spending increased ${pct}% compared to previous month.`, date: now.toISOString().split('T')[0] });
          }
        }

        const topMerchants = trendsJson?.topMerchants || [];
        if (Array.isArray(topMerchants) && topMerchants.length) {
          topMerchants.slice(0,5).forEach((m: any, idx: number) => {
            if (m.transactionCount >= 2) {
              results.push({ id: `rec-${idx}`, type: 'tip', severity: 'medium', message: `Recurring payments detected: ${m.merchant} (${m.transactionCount} transactions). Consider subscription management.`, date: now.toISOString().split('T')[0] });
            }
          });
        }

        const summary = summaryJson?.summary;
        if (summary) {
          if (summary.savingsRate !== undefined && summary.savingsRate < 10) {
            results.push({ id: 'savings-low', type: 'tip', severity: 'medium', message: `Your savings rate is ${Math.round(summary.savingsRate)}% this month. Try increasing savings by 5%.`, date: now.toISOString().split('T')[0] });
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
      <div className={cn("flex flex-col md:flex-row w-full flex-1 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100", "h-screen")}>
        <SidebarComponent activeItem={activeItem} setActiveItem={setActiveItem} />
        <div className="flex flex-1">
          <div className="p-4 md:p-8 rounded-tl-2xl border border-zinc-900 bg-gradient-to-br from-neutral-950 via-zinc-950 to-neutral-900 backdrop-blur-sm flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-6 w-6 text-emerald-400" />
                <h1 className="text-3xl font-semibold text-slate-50">Insights</h1>
              </div>
              <p className="text-sm text-zinc-400">Signals and tips tailored from your spending.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
                  <input type="text" placeholder="Search insights..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="text-zinc-500 w-5 h-5" />
                <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as any)} className="px-4 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="all">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-32">
                <Lightbulb className="w-16 h-16 text-zinc-500 mx-auto mb-4 animate-pulse" />
                <p className="text-zinc-500">Loading insights…</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                <p className="text-zinc-400 mb-4">{error}</p>
                <Link href="/upload" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg">Upload Statement</Link>
              </div>
            ) : ((insights && insights.length) ? (
              <div className="space-y-4">
                {filtered.map(insight => (
                  <div key={insight.id} className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-xl p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {insight.type === 'warning' ? <AlertTriangle className="w-8 h-8 text-rose-400" /> : insight.type === 'tip' ? <Lightbulb className="w-8 h-8 text-sky-400" /> : <RefreshCw className="w-8 h-8 text-emerald-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(insight.severity)}`}>{insight.severity.toUpperCase()}</span>
                          <span className="text-sm text-zinc-500">{insight.date}</span>
                        </div>
                        <p className="text-slate-100 text-lg">{insight.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <Lightbulb className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                <p className="text-zinc-500 mb-4">No insights available yet.</p>
                <Link href="/upload" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg">Upload Statement</Link>
              </div>
            ))}

          </div>
        </div>
      </div>
    </ProtectedClient>
  );
};

export default InsightsPage;


