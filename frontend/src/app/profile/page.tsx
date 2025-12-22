"use client";

import React, { useState } from 'react';
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
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Edit,
  Save,
  X,
  Shield,
  Bell,
  CreditCard,
  Key
} from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import UserAvatar from "@/components/ui/user-avatar";
import { Logo } from "@/app/dashboard/page";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { apiFetch, getApiBase } from "@/lib/api";

const SidebarComponent = ({ activeItem, setActiveItem }: { activeItem: string, setActiveItem: (item: string) => void }) => {
  const router = useRouter();

  const handleLogout = () => {
    // Clear all auth and app state from localStorage on logout
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
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

const Profile = () => {
  const [activeItem, setActiveItem] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const [userData, setUserData] = useState<any>({
    name: '',
    email: '',
    phone: '',
    location: '',
    joinDate: '',
    monthlyBudget: 0,
    savingsGoal: 0,
    currentSavings: 0
  });

  const [editData, setEditData] = useState<any>(userData);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [accountStats, setAccountStats] = useState({
    totalTransactions: 0,
    activeCategories: 0,
    monthlyInsights: 0,
    savingsRate: 0
  });
  const [spendingProfile, setSpendingProfile] = useState([
    { label: "Essentials", value: "0%", tone: "text-emerald-300" },
    { label: "Lifestyle", value: "0%", tone: "text-sky-300" },
    { label: "Savings & Investing", value: "0%", tone: "text-amber-300" },
  ]);

  // Fetch profile on mount
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProfile(true);
      setProfileError(null);

      try {
        const API_BASE = getApiBase();
        const res = await apiFetch(`${API_BASE}/api/users/profile`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to fetch profile: ${res.status} ${res.statusText} - ${txt}`);
        }
        const json = await res.json();
        if (!mounted) return;
        const u = json.user || {};
        setUserData({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          location: u.location || '',
          joinDate: u.joinDate || (u.createdAt ? new Date(u.createdAt).toLocaleString() : ''),
          monthlyBudget: u.monthlyBudget || 0,
          savingsGoal: u.savingsGoal || 0,
          currentSavings: u.currentSavings || 0,
        });
        setEditData((prev: any) => ({ ...prev, ...(json.user || {}) }));
      } catch (err: any) {
        console.error('Fetch profile error:', err);
        if (mounted) setProfileError(err.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch account statistics and spending profile
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const API_BASE = getApiBase();
        
        // Fetch analytics data in parallel
        const [summaryRes, categoriesRes, insightsRes] = await Promise.all([
          apiFetch(`${API_BASE}/api/analytics/summary`),
          apiFetch(`${API_BASE}/api/analytics/categories`),
          apiFetch(`${API_BASE}/api/analytics/monthly`)
        ]);

        if (!mounted) return;

        // Get transaction count from summary
        const summaryJson = summaryRes.ok ? await summaryRes.json() : null;
        const transactionCount = summaryJson?.summary?.transactionCount || 0;

        // Get active categories count
        const categoriesJson = categoriesRes.ok ? await categoriesRes.json() : null;
        const activeCategories = categoriesJson?.categories?.length || 0;

        // Get savings rate
        const savingsRate = summaryJson?.summary?.savingsRate || 0;

        // Calculate monthly insights count (simplified - count insights from insights page logic)
        // We'll fetch insights separately or calculate from trends
        const monthlyInsights = 0; // Will be calculated from insights data

        // Calculate spending profile breakdown
        const categories = categoriesJson?.categories || [];
        const totalSpending = categories.reduce((sum: number, cat: any) => sum + (cat.totalAmount || 0), 0);
        
        // Categorize spending into Essentials, Lifestyle, Savings
        // Essentials: Food, Transport, Bills, Healthcare
        // Lifestyle: Entertainment, Shopping, Education
        // Savings: Income - Expenses (calculated separately)
        const essentialCategories = ['Food', 'Transport', 'Bills', 'Healthcare'];
        const lifestyleCategories = ['Entertainment', 'Shopping', 'Education'];
        
        let essentialsTotal = 0;
        let lifestyleTotal = 0;
        
        categories.forEach((cat: any) => {
          const categoryName = cat.category || cat._id;
          if (essentialCategories.includes(categoryName)) {
            essentialsTotal += cat.totalAmount || 0;
          } else if (lifestyleCategories.includes(categoryName)) {
            lifestyleTotal += cat.totalAmount || 0;
          }
        });

        const essentialsPercent = totalSpending > 0 ? Math.round((essentialsTotal / totalSpending) * 100) : 0;
        const lifestylePercent = totalSpending > 0 ? Math.round((lifestyleTotal / totalSpending) * 100) : 0;
        const savingsPercent = Math.max(0, 100 - essentialsPercent - lifestylePercent);

        if (mounted) {
          setAccountStats({
            totalTransactions: transactionCount,
            activeCategories: activeCategories,
            monthlyInsights: monthlyInsights,
            savingsRate: Math.round(savingsRate * 100) / 100
          });

          setSpendingProfile([
            { label: "Essentials", value: `${essentialsPercent}%`, tone: "text-emerald-300" },
            { label: "Lifestyle", value: `${lifestylePercent}%`, tone: "text-sky-300" },
            { label: "Savings & Investing", value: `${savingsPercent}%`, tone: "text-amber-300" },
          ]);
        }
      } catch (err: any) {
        console.error('Fetch account stats error:', err);
        // Don't set error state, just use defaults
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch insights count separately
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const API_BASE = getApiBase();
        const [summaryRes, categoriesRes, trendsRes, monthlyRes] = await Promise.all([
          apiFetch(`${API_BASE}/api/analytics/summary`),
          apiFetch(`${API_BASE}/api/analytics/categories`),
          apiFetch(`${API_BASE}/api/analytics/trends`),
          apiFetch(`${API_BASE}/api/analytics/monthly`)
        ]);

        if (!mounted) return;

        const [summaryJson, categoriesJson, trendsJson, monthlyJson] = await Promise.all([
          summaryRes.ok ? summaryRes.json() : Promise.resolve(null),
          categoriesRes.ok ? categoriesRes.json() : Promise.resolve(null),
          trendsRes.ok ? trendsRes.json() : Promise.resolve(null),
          monthlyRes.ok ? monthlyRes.json() : Promise.resolve(null)
        ]);

        const results: any[] = [];
        const categories = categoriesJson?.categories || [];
        if (Array.isArray(categories) && categories.length) {
          const top = categories[0];
          if (top && top.percentage >= 30) {
            results.push({ id: 'cat-top' });
          }
        }

        const monthlyTrends = monthlyJson?.monthlyTrends || [];
        if (Array.isArray(monthlyTrends) && monthlyTrends.length >= 2) {
          const last = monthlyTrends[monthlyTrends.length - 1];
          const prev = monthlyTrends[monthlyTrends.length - 2];
          const lastExpense = last.totalExpenses || 0;
          const prevExpense = prev.totalExpenses || 0;
          if (prevExpense > 0 && ((lastExpense - prevExpense) / prevExpense) * 100 >= 20) {
            results.push({ id: 'momo-spike' });
          }
        }

        const topMerchants = trendsJson?.topMerchants || [];
        if (Array.isArray(topMerchants) && topMerchants.length) {
          topMerchants.slice(0,5).forEach((m: any) => {
            if (m.transactionCount >= 2) {
              results.push({ id: `rec-${results.length}` });
            }
          });
        }

        const summary = summaryJson?.summary;
        if (summary) {
          if (summary.savingsRate !== undefined && summary.savingsRate < 10) {
            results.push({ id: 'savings-low' });
          }
        }

        if (mounted) {
          setAccountStats((prev) => ({
            ...prev,
            monthlyInsights: results.length
          }));
        }
      } catch (err: any) {
        console.error('Fetch insights count error:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);
  

  const handleSave = () => {
    // Save to backend
    (async () => {
      try {
        const API_BASE = getApiBase();
        const res = await apiFetch(`${API_BASE}/api/users/profile`, {
          method: 'PUT',
          body: JSON.stringify(editData),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to update profile: ${res.status} ${res.statusText} - ${txt}`);
        }
        const json = await res.json();
        setUserData(json.user || editData);
        setEditData(json.user || editData);
        setIsEditing(false);
        setProfileError(null);
      } catch (err: any) {
        console.error('Profile update error:', err);
        setProfileError(err.message || 'Failed to update profile');
      }
    })();
  };

  const handleCancel = () => {
    setEditData(userData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    // Clear all auth and app state from localStorage on logout
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    // Redirect to login page
    router.push('/login');
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
    setDeleteConfirmationText('');
    setDeleteError(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmationText('');
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!userData?.email) {
      setDeleteError('Unable to retrieve email address');
      return;
    }

    if (deleteConfirmationText.trim() !== userData.email) {
      setDeleteError('Email address does not match. Please type your email address exactly as shown.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const API_BASE = getApiBase();
      const res = await apiFetch(`${API_BASE}/api/users/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmationText: deleteConfirmationText.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete account' }));
        throw new Error(errorData.error || 'Failed to delete account');
      }

      // Account deleted successfully, clear all localStorage and redirect
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      
      // Redirect to login page with a message
      router.push('/login?deleted=true');
    } catch (error: any) {
      console.error('Delete account error:', error);
      setDeleteError(error.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const savingsProgress = userData.savingsGoal ? (userData.currentSavings / userData.savingsGoal) * 100 : 0;

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
        <div className="p-4 sm:p-6 md:p-8 rounded-tl-2xl border border-zinc-900 bg-gradient-to-br from-neutral-950 via-zinc-950 to-neutral-900 backdrop-blur-sm flex flex-col gap-4 sm:gap-6 flex-1 w-full md:h-full md:overflow-y-auto">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">Profile</h1>
                <p className="text-xs sm:text-sm text-zinc-400">Manage your account, goals, and security in one place.</p>
              </div>
            </div>
          </div>

          {loadingProfile ? (
            <div className="py-12 sm:py-24 w-full text-center">
              <RefreshCw className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-400 mx-auto animate-spin" />
              <p className="text-xs sm:text-sm text-zinc-400 mt-4">Loading profile…</p>
            </div>
          ) : profileError ? (
            <div className="py-12 sm:py-24 w-full text-center">
              <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 text-rose-400 mx-auto" />
              <p className="text-xs sm:text-sm text-zinc-400 mt-4">{profileError}</p>
              <div className="mt-4">
                <Link href="/login" className="inline-block px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs sm:text-sm">Go to login</Link>
              </div>
            </div>
          ) : null}

          {!loadingProfile && !profileError && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Personal Information Card */}
              <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-100">Personal Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-medium w-full sm:w-auto"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-medium flex-1 sm:flex-none"
                      >
                        <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-700 text-white rounded-lg text-xs sm:text-sm font-medium flex-1 sm:flex-none"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 sm:pb-6 border-b border-zinc-800">
                    <div className="relative">
                      <UserAvatar compact={true} size={80} />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-emerald-500 rounded-full border-4 border-zinc-900 flex items-center justify-center">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-100 mb-1">{userData.name || 'User'}</h3>
                      <p className="text-xs sm:text-sm text-zinc-400 flex items-center justify-center sm:justify-start gap-2">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                        {userData.email}
                      </p>
                      <p className="text-xs text-zinc-500 mt-2 flex items-center justify-center sm:justify-start gap-2">
                        <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Member since {userData.joinDate || 'Recently'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-400">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-zinc-700 rounded-lg bg-neutral-950/80 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                          <p className="text-sm text-slate-100">{userData.name || 'Not set'}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-400">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({...editData, email: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-zinc-700 rounded-lg bg-neutral-950/80 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          placeholder="Enter your email"
                        />
                      ) : (
                        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                          <p className="text-sm text-slate-100">{userData.email || 'Not set'}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-400">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                        Phone
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData.phone}
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-zinc-700 rounded-lg bg-neutral-950/80 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                          <p className="text-sm text-slate-100">{userData.phone || 'Not set'}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-400">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                        Location
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.location}
                          onChange={(e) => setEditData({...editData, location: e.target.value})}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-zinc-700 rounded-lg bg-neutral-950/80 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          placeholder="Enter your location"
                        />
                      ) : (
                        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                          <p className="text-sm text-slate-100">{userData.location || 'Not set'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Goals Card */}
              <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-2 rounded-lg bg-sky-500/20 border border-sky-500/30">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-100">Financial Goals</h2>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs sm:text-sm font-medium text-zinc-400">Monthly Budget</label>
                      <span className="text-base sm:text-lg font-semibold text-emerald-400">₹{userData.monthlyBudget.toLocaleString('en-IN')}</span>
                    </div>
                    <input
                      type="range"
                      min="10000"
                      max="200000"
                      step="5000"
                      value={userData.monthlyBudget}
                      onChange={(e) => setUserData({...userData, monthlyBudget: parseInt(e.target.value)})}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs sm:text-sm font-medium text-zinc-400">Savings Goal</label>
                      <span className="text-base sm:text-lg font-semibold text-sky-400">₹{userData.savingsGoal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2.5">
                      <div
                        className="bg-sky-500 h-2.5 rounded-full"
                        style={{ width: `${Math.min(savingsProgress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-zinc-500 mt-1">
                      <span>₹{userData.currentSavings.toLocaleString('en-IN')} saved</span>
                      <span>{savingsProgress.toFixed(1)}% complete</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spending Profile */}
              <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                    <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-100">Spending Profile</h2>
                </div>
                <p className="text-xs text-zinc-500 mb-3">
                  Rough breakdown of where your money usually goes each month.
                </p>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  {spendingProfile.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2"
                    >
                      <span className="text-zinc-200">{item.label}</span>
                      <span className={cn("font-medium", item.tone)}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions & Stats */}
            <div className="space-y-4 sm:space-y-6">
              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 rounded-lg bg-violet-500/20 border border-violet-500/30">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-100">Quick Actions</h2>
                </div>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 text-left rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-slate-100 transition-all group">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-sky-500/10 group-hover:bg-sky-500/20 transition-colors">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Security Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 text-left rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-slate-100 transition-all group">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Notification Preferences</span>
                  </button>
                  <button className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 text-left rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-slate-100 transition-all group">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Linked Accounts</span>
                  </button>
                  <button className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 text-left rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-slate-100 transition-all group">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                      <Key className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">Change Password</span>
                  </button>
                </div>
              </div>

              {/* Account Stats */}
              <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-100">Account Stats</h2>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 rounded bg-blue-500/10">
                        <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                      </div>
                      <span className="text-xs sm:text-sm text-zinc-300">Total Transactions</span>
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-slate-100">{accountStats.totalTransactions}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 rounded bg-purple-500/10">
                        <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                      </div>
                      <span className="text-xs sm:text-sm text-zinc-300">Active Categories</span>
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-slate-100">{accountStats.activeCategories}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 rounded bg-amber-500/10">
                        <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                      </div>
                      <span className="text-xs sm:text-sm text-zinc-300">Monthly Insights</span>
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-slate-100">{accountStats.monthlyInsights}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 rounded bg-emerald-500/10">
                        <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                      </div>
                      <span className="text-xs sm:text-sm text-zinc-300">Savings Rate</span>
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-emerald-400">{accountStats.savingsRate > 0 ? `${accountStats.savingsRate}%` : '—'}</span>
                  </div>
                </div>
              </div>

              {/* Delete Account */}
              <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-rose-950 border border-rose-800 rounded-2xl p-4 sm:p-6 shadow-lg">
                <h2 className="text-lg sm:text-xl font-semibold text-rose-100 mb-2">Danger Zone</h2>
                <p className="text-xs text-rose-200/80 mb-3 sm:mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Delete my account
                </button>
              </div>

              {/* Delete Account Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-zinc-900 border border-rose-800 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-rose-100 mb-1">Delete account</h3>
                        <p className="text-xs sm:text-sm text-zinc-400">
                          This action <strong className="text-rose-400">cannot</strong> be undone. This will permanently delete your account and remove all your data from our servers.
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 sm:mb-6">
                      <label htmlFor="delete-confirm" className="block text-xs sm:text-sm font-medium text-zinc-300 mb-2">
                        Please type <strong className="text-white break-all">{userData?.email || 'your email'}</strong> to confirm:
                      </label>
                      <input
                        id="delete-confirm"
                        type="text"
                        value={deleteConfirmationText}
                        onChange={(e) => {
                          setDeleteConfirmationText(e.target.value);
                          setDeleteError(null);
                        }}
                        placeholder={userData?.email || 'your email address'}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        disabled={isDeleting}
                        autoFocus
                      />
                      {deleteError && (
                        <p className="mt-2 text-xs sm:text-sm text-rose-400">{deleteError}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={handleCancelDelete}
                        disabled={isDeleting}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        disabled={isDeleting || deleteConfirmationText.trim() !== userData?.email}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isDeleting ? (
                          <>
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                            <span className="hidden sm:inline">Deleting...</span>
                            <span className="sm:hidden">Deleting</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">I understand, delete my account</span>
                            <span className="sm:hidden">Delete Account</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
    </ProtectedClient>
  );
};

export default Profile;