"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedClient from '@/components/auth/ProtectedClient';
import { Upload, FileText, CheckCircle, AlertCircle, LogOut, Home, BarChart3, Lightbulb, Settings, Wallet } from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Logo } from "@/app/dashboard/page";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

    // Simulate upload with progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUploadStatus('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

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
              <h1 className="text-3xl font-semibold text-slate-50 mb-2">Upload Bank Statement</h1>
              <p className="text-sm text-zinc-400">Upload your bank statement to analyze your spending patterns.</p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center",
                  "border-zinc-700 bg-neutral-950/60"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <motion.div animate={{ scale: isDragOver ? 1.1 : 1 }} transition={{ duration: 0.2 }}>
                  <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Drag & Drop Your File Here</h3>
                <p className="text-sm text-zinc-500 mb-4">or click to browse files</p>
                <input
                  type="file"
                  accept=".csv,.pdf,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-6 py-3 bg-emerald-500 text-white rounded-lg cursor-pointer text-sm font-medium"
                >
                  Choose File
                </label>
                {file && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-zinc-300 text-sm">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>

              {file && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-100 mb-2">Statement Month & Year</label>
                  <div className="flex gap-4 justify-center">
                    <select
                      className="px-4 py-2 border border-zinc-700 bg-neutral-950/80 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      <option value="">Select Month</option>
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </select>
                    <select
                      className="px-4 py-2 border border-zinc-700 bg-neutral-950/80 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      <option value="">Select Year</option>
                      <option value="2023">2023</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                </div>
              )}

              {file && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !selectedMonth || !selectedYear}
                    className="px-8 py-3 bg-emerald-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload Statement'}
                  </button>
                  {uploading && (
                    <div className="mt-4 w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="mt-6 flex items-center justify-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="w-5 h-5" />
                  <span>Upload successful! Redirecting to dashboard...</span>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="mt-6 flex items-center justify-center gap-2 text-rose-400 text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>Upload failed. Please try again.</span>
                </div>
              )}
            </div>

            <div className="max-w-2xl mx-auto mt-8">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Supported Formats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl p-4 text-center border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950">
                  <FileText className="w-8 h-8 text-sky-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-100 text-sm">CSV Files</p>
                  <p className="text-xs text-zinc-500 mt-1">Comma-separated values</p>
                </div>
                <div className="rounded-xl p-4 text-center border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950">
                  <FileText className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-100 text-sm">PDF Files</p>
                  <p className="text-xs text-zinc-500 mt-1">Portable document format</p>
                </div>
                <div className="rounded-xl p-4 text-center border border-zinc-800 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950">
                  <FileText className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-100 text-sm">Excel Files</p>
                  <p className="text-xs text-zinc-500 mt-1">Spreadsheet format</p>
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
