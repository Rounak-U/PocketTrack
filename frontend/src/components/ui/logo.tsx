"use client";

import { TrendingUp } from "lucide-react";
import { usePathname } from "next/navigation";

export function Logo() {
  const pathname = usePathname();
  const isHidden = pathname === '/dashboard' || pathname === '/upload' || pathname === '/analytics' || pathname === '/insights' || pathname === '/transactions' || pathname === '/profile';

  if (isHidden) return null;

  return (
    <div className="fixed top-6 left-6 z-50 flex items-center gap-2">
      <TrendingUp className="w-8 h-8 text-green-400" />
      <span className="text-white font-bold text-xl">
        PocketTrack
      </span>
    </div>
  );
}