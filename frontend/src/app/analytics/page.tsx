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
  TrendingDown,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
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
        <FileText className="text-white h-5 w-5 flex-shrink-0" />
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

const Analytics = () => {
  const [activeItem, setActiveItem] = useState('analytics');

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-black w-full flex-1 overflow-hidden",
        "h-screen"
      )}
    >
      <SidebarComponent activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex flex-1">
        <div className="p-4 md:p-8 rounded-tl-2xl border border-gray-200 bg-white flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-black mb-2">Analytics</h1>
            <p className="text-gray-700">Deep dive into your financial data with advanced analytics and insights.</p>
          </div>

          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
            <h3 className="text-lg font-semibold text-black mb-4">Income vs Spending Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#111827' }}
                  formatter={(value) => `₹${value}`}
                />
                <Legend />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
                <Area type="monotone" dataKey="spend" stackId="2" stroke="#dc2626" fill="#dc2626" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-black mb-4">Category Spending Changes</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
                <XAxis dataKey="category" stroke="#6B7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#111827' }}
                  formatter={(value) => [`₹${value}`, '']}
                />
                <Bar dataKey="current" fill="#2563eb" name="Current Month" />
                <Bar dataKey="previous" fill="#9ca3af" name="Previous Month" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-black mb-4">Budget vs Actual</h3>
              <div className="space-y-4">
                {budgetData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{item.category}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(item.spent / item.budget) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-black">₹{item.spent} / ₹{item.budget}</p>
                      <p className={`text-xs ${item.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.remaining > 0 ? `₹${item.remaining} left` : `₹${Math.abs(item.remaining)} over`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Insights */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
            <h3 className="text-lg font-semibold text-black mb-4">Advanced Insights</h3>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                  <insight.icon className={`w-6 h-6 ${insight.color}`} />
                  <div>
                    <p className="text-black">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 text-center">
              <TrendingUpIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-black">Savings Rate</h4>
              <p className="text-2xl font-bold text-green-600">78.5%</p>
              <p className="text-sm text-gray-600">+5.2% from last month</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 text-center">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-black">Budget Adherence</h4>
              <p className="text-2xl font-bold text-blue-600">87.3%</p>
              <p className="text-sm text-gray-600">4 categories over budget</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 text-center">
              <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-black">Spending Velocity</h4>
              <p className="text-2xl font-bold text-purple-600">₹2,450/day</p>
              <p className="text-sm text-gray-600">Average daily spend</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;