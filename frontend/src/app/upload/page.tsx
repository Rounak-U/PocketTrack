"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedClient from '@/components/auth/ProtectedClient';
import { Upload, FileText, CheckCircle, AlertCircle, LogOut, Home, BarChart3, Lightbulb, Settings, Wallet, Receipt } from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Logo } from "@/app/dashboard/page";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { apiFetch, getApiBase } from "@/lib/api";

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

const UploadPage = () => {
  const [activeItem, setActiveItem] = useState('upload');
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus('idle');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setUploadStatus('idle');
    }
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setUploadStatus('idle');

    try {
      const API_BASE = getApiBase();
      const formData = new FormData();
      
      // Determine upload type based on file extension
      const fileExt = file.name.toLowerCase().split('.').pop() || '';
      const isReceipt = ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(fileExt);
      const isCSV = fileExt === 'csv';
      
      if (isReceipt) {
        // Upload receipt
        formData.append('receiptFile', file);
        
        const response = await apiFetch(`${API_BASE}/api/upload/receipt`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to upload receipt');
        }

        const data = await response.json();
        
        if (data.transaction) {
          setUploadStatus('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        } else {
          // Transaction needs manual confirmation
          setUploadStatus('success');
          setTimeout(() => {
            router.push('/transactions');
          }, 1500);
        }
      } else if (isCSV) {
        // Upload CSV statement
        formData.append('csvFile', file);
        
        const response = await apiFetch(`${API_BASE}/api/upload/upi-csv`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to upload CSV file');
        }

        setUploadStatus('success');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        throw new Error('Unsupported file type. Please upload CSV, PDF, or image files.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
      setProgress(100);
    }
  };

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
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">Upload Statement or Receipt</h1>
              <p className="text-xs sm:text-sm text-zinc-400">Upload your bank statement (CSV) or transaction receipt (PDF/Image) to track your expenses.</p>
            </div>

            <div className="max-w-2xl mx-auto w-full">
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 sm:p-8 text-center",
                  "border-zinc-700 bg-neutral-950/60"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <motion.div animate={{ scale: isDragOver ? 1.1 : 1 }} transition={{ duration: 0.2 }}>
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-500 mx-auto mb-3 sm:mb-4" />
                </motion.div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-2">Drag & Drop Your File Here</h3>
                <p className="text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4">or click to browse files</p>
                <input
                  type="file"
                  accept=".csv,.pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-emerald-500 text-white rounded-lg cursor-pointer text-xs sm:text-sm font-medium"
                >
                  Choose File
                </label>
                {file && (
                  <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-zinc-300 text-xs sm:text-sm">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    <span className="truncate max-w-[200px] sm:max-w-none">{file.name}</span>
                  </div>
                )}
              </div>

              {file && (
                <div className="mt-4 sm:mt-6 text-center">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-6 sm:px-8 py-2 sm:py-3 bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </button>
                  {uploading && (
                    <div className="mt-3 sm:mt-4 w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 text-emerald-400 text-xs sm:text-sm">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Upload successful! Redirecting to dashboard...</span>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 text-rose-400 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Upload failed. Please try again.</span>
                </div>
              )}
            </div>

            <div className="max-w-2xl mx-auto mt-6 sm:mt-8 w-full">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-3 sm:mb-4">Supported Formats</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-xl p-3 sm:p-4 text-center border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-sky-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-100 text-xs sm:text-sm">CSV Files</p>
                  <p className="text-xs text-zinc-500 mt-1">Comma-separated values</p>
                </div>
                <div className="rounded-xl p-3 sm:p-4 text-center border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950">
                  <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-100 text-xs sm:text-sm">PDF Receipts</p>
                  <p className="text-xs text-zinc-500 mt-1">Transaction receipts</p>
                </div>
                <div className="rounded-xl p-3 sm:p-4 text-center border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950">
                  <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-100 text-xs sm:text-sm">Image Receipts</p>
                  <p className="text-xs text-zinc-500 mt-1">JPG, PNG, WebP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedClient>
  );
};

export default UploadPage;
