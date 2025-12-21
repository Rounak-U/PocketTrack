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

  const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Fetch profile on mount
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProfile(true);
      setProfileError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        setProfileError('Not authenticated');
        setLoadingProfile(false);
        return;
      }

      try {
        const res = await fetch(`${API_ORIGIN}/api/users/profile`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
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
        setEditData(prev => ({ ...prev, ...(json.user || {}) }));
      } catch (err: any) {
        console.error('Fetch profile error:', err);
        if (mounted) setProfileError(err.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  

  const handleSave = () => {
    // Save to backend
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setProfileError('Not authenticated');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_ORIGIN}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
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
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Redirect to login page
    router.push('/login');
  };

  const savingsProgress = userData.savingsGoal ? (userData.currentSavings / userData.savingsGoal) * 100 : 0;

  const spendingProfile = [
    { label: "Essentials", value: "52%", tone: "text-emerald-300" },
    { label: "Lifestyle", value: "31%", tone: "text-sky-300" },
    { label: "Savings & Investing", value: "17%", tone: "text-amber-300" },
  ];

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
            <h1 className="text-3xl font-semibold text-slate-50 mb-2">👤 Profile</h1>
            <p className="text-sm text-zinc-400">Manage your account, goals, and security in one place.</p>
          </div>

          {loadingProfile ? (
            <div className="py-24 w-full text-center">
              <RefreshCw className="w-12 h-12 text-emerald-400 mx-auto animate-spin" />
              <p className="text-zinc-400 mt-4">Loading profile…</p>
            </div>
          ) : profileError ? (
            <div className="py-24 w-full text-center">
              <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
              <p className="text-zinc-400 mt-4">{profileError}</p>
              <div className="mt-4">
                <Link href="/login" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg">Go to login</Link>
              </div>
            </div>
          ) : null}

          {!loadingProfile && !profileError && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information Card */}
              <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-100">Personal Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm font-medium"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <UserAvatar compact={false} size={80} />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">{userData.name}</h3>
                      <p className="text-zinc-400">Member since {userData.joinDate}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Full Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="w-full px-3 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-slate-100">{userData.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({...editData, email: e.target.value})}
                          className="w-full px-3 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-slate-100">{userData.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData.phone}
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-slate-100">{userData.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Location</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.location}
                          onChange={(e) => setEditData({...editData, location: e.target.value})}
                          className="w-full px-3 py-2 border border-zinc-700 rounded-lg bg-neutral-950/80 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-slate-100">{userData.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Goals Card */}
              <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-slate-100 mb-6">Financial Goals</h2>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-zinc-400">Monthly Budget</label>
                      <span className="text-lg font-semibold text-emerald-400">₹{userData.monthlyBudget.toLocaleString('en-IN')}</span>
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
                      <label className="text-sm font-medium text-zinc-400">Savings Goal</label>
                      <span className="text-lg font-semibold text-sky-400">₹{userData.savingsGoal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2.5">
                      <div
                        className="bg-sky-500 h-2.5 rounded-full"
                        style={{ width: `${Math.min(savingsProgress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-zinc-500 mt-1">
                      <span>₹{userData.currentSavings.toLocaleString('en-IN')} saved</span>
                      <span>{savingsProgress.toFixed(1)}% complete</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spending Profile */}
              <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">Spending Profile</h2>
                <p className="text-xs text-zinc-500 mb-3">
                  Rough breakdown of where your money usually goes each month.
                </p>
                <div className="space-y-3 text-sm">
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
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 text-left rounded-lg bg-zinc-900 border border-zinc-800 text-slate-100">
                    <Shield className="w-5 h-5 text-sky-400" />
                    <span>Security Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left rounded-lg bg-zinc-900 border border-zinc-800 text-slate-100">
                    <Bell className="w-5 h-5 text-amber-400" />
                    <span>Notification Preferences</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left rounded-lg bg-zinc-900 border border-zinc-800 text-slate-100">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <span>Linked Accounts</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left rounded-lg bg-zinc-900 border border-zinc-800 text-slate-100">
                    <Key className="w-5 h-5 text-violet-400" />
                    <span>Change Password</span>
                  </button>
                </div>
              </div>

              {/* Account Stats */}
              <div className="bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">Account Stats</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-zinc-300"><span>Total Transactions</span><span className="font-semibold text-slate-100">247</span></div>
                  <div className="flex justify-between text-zinc-300"><span>Active Categories</span><span className="font-semibold text-slate-100">12</span></div>
                  <div className="flex justify-between text-zinc-300"><span>Monthly Insights</span><span className="font-semibold text-slate-100">8</span></div>
                  <div className="flex justify-between text-zinc-300"><span>Savings Rate</span><span className="font-semibold text-emerald-400">23%</span></div>
                </div>
              </div>

              {/* Delete Account */}
              <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-rose-950 border border-rose-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-rose-100 mb-2">Danger Zone</h2>
                <p className="text-xs text-rose-200/80 mb-4">
                  This will remove your data from PocketTrack. This action cannot be undone.
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-lg text-sm font-semibold"
                >
                  <LogOut className="w-5 h-5" />
                  Delete my account
                </button>
              </div>
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