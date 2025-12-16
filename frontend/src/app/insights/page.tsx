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
  Search
} from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "@/app/dashboard/page";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Mock insights data
const allInsights = [
  { id: 1, type: 'warning', severity: 'high', message: 'You spent 35% more on food this month compared to last month', icon: AlertTriangle, color: 'text-red-600', date: '2025-12-15' },
  { id: 2, type: 'tip', severity: 'medium', message: 'Zomato appears frequently — consider a monthly cap', icon: Lightbulb, color: 'text-blue-600', date: '2025-12-14' },
  { id: 3, type: 'info', severity: 'low', message: 'Recurring payment detected for Netflix subscription', icon: RefreshCw, color: 'text-green-600', date: '2025-12-13' },
  { id: 4, type: 'warning', severity: 'high', message: 'Transportation costs increased by 20% this week', icon: AlertTriangle, color: 'text-red-600', date: '2025-12-12' },
  { id: 5, type: 'tip', severity: 'medium', message: 'You have ₹5,000 left in entertainment budget', icon: Lightbulb, color: 'text-blue-600', date: '2025-12-11' },
  { id: 6, type: 'info', severity: 'low', message: 'Your savings rate improved by 2%', icon: TrendingUp, color: 'text-green-600', date: '2025-12-10' },
  { id: 7, type: 'warning', severity: 'medium', message: 'Unusual spending pattern detected on weekends', icon: AlertTriangle, color: 'text-orange-600', date: '2025-12-09' },
  { id: 8, type: 'tip', severity: 'low', message: 'Consider switching to a cheaper internet plan', icon: Lightbulb, color: 'text-blue-600', date: '2025-12-08' }
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

const Insights = () => {
  const [activeItem, setActiveItem] = useState('insights');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInsights = allInsights.filter(insight => {
    const matchesSeverity = filterSeverity === 'all' || insight.severity === filterSeverity;
    const matchesSearch = insight.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/15 text-red-300 border border-red-500/40';
      case 'medium':
        return 'bg-amber-500/15 text-amber-300 border border-amber-500/40';
      case 'low':
        return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40';
      default:
        return 'bg-zinc-800 text-zinc-200 border border-zinc-600';
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row w-full flex-1 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100",
        "h-screen"
      )}
    >
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

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search insights..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-zinc-500 w-5 h-5" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-4 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Insights List */}
          <div className="space-y-4">
            {filteredInsights.length === 0 ? (
              <div className="text-center py-12">
                <Lightbulb className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                <p className="text-zinc-500">No insights found matching your criteria.</p>
              </div>
            ) : (
              filteredInsights.map((insight) => (
                <div key={insight.id} className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <insight.icon className={`w-8 h-8 ${insight.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(insight.severity)}`}>
                          {insight.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-zinc-500">{insight.date}</span>
                      </div>
                      <p className="text-slate-100 text-lg">{insight.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-6 shadow-lg border border-zinc-800 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-slate-100">Warnings</h4>
              <p className="text-2xl font-bold text-rose-400">{allInsights.filter(i => i.type === 'warning').length}</p>
            </div>
            <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-6 shadow-lg border border-zinc-800 text-center">
              <Lightbulb className="w-8 h-8 text-sky-400 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-slate-100">Tips</h4>
              <p className="text-2xl font-bold text-sky-400">{allInsights.filter(i => i.type === 'tip').length}</p>
            </div>
            <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 rounded-2xl p-6 shadow-lg border border-zinc-800 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-slate-100">Info</h4>
              <p className="text-2xl font-bold text-emerald-400">{allInsights.filter(i => i.type === 'info').length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;