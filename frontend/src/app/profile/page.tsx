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
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "@/app/dashboard/page";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

const Profile = () => {
  const [activeItem, setActiveItem] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 98765 43210',
    location: 'Mumbai, India',
    joinDate: 'January 2024',
    monthlyBudget: 75000,
    savingsGoal: 50000,
    currentSavings: 25000
  });

  const [editData, setEditData] = useState(userData);

  const handleSave = () => {
    setUserData(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(userData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    // In a real app, this would clear authentication tokens and redirect
    window.location.href = '/';
  };

  const savingsProgress = (userData.currentSavings / userData.savingsGoal) * 100;

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
            <h1 className="text-3xl font-bold text-black mb-2">👤 Profile</h1>
            <p className="text-gray-700">Manage your account settings and preferences.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-black">Personal Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Image
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"
                      className="w-20 h-20 rounded-full"
                      width={80}
                      height={80}
                      alt="Profile Picture"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-black">{userData.name}</h3>
                      <p className="text-gray-600">Member since {userData.joinDate}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{userData.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({...editData, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{userData.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData.phone}
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{userData.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.location}
                          onChange={(e) => setEditData({...editData, location: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{userData.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Goals Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-black mb-6">Financial Goals</h2>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Monthly Budget</label>
                      <span className="text-lg font-semibold text-green-600">₹{userData.monthlyBudget.toLocaleString('en-IN')}</span>
                    </div>
                    <input
                      type="range"
                      min="10000"
                      max="200000"
                      step="5000"
                      value={userData.monthlyBudget}
                      onChange={(e) => setUserData({...userData, monthlyBudget: parseInt(e.target.value)})}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Savings Goal</label>
                      <span className="text-lg font-semibold text-blue-600">₹{userData.savingsGoal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min(savingsProgress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>₹{userData.currentSavings.toLocaleString('en-IN')} saved</span>
                      <span>{savingsProgress.toFixed(1)}% complete</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Stats */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-black mb-6">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-900">Security Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Bell className="w-5 h-5 text-orange-600" />
                    <span className="text-gray-900">Notification Preferences</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span className="text-gray-900">Linked Accounts</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Key className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-900">Change Password</span>
                  </button>
                </div>
              </div>

              {/* Account Stats */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-black mb-6">Account Stats</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Transactions</span>
                    <span className="font-semibold text-black">247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Categories</span>
                    <span className="font-semibold text-black">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Insights</span>
                    <span className="font-semibold text-black">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Savings Rate</span>
                    <span className="font-semibold text-green-600">23%</span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-red-800 mb-4">Account Actions</h2>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;