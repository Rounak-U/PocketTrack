'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedClient({ children }: Props) {
  // mounted controls whether we're past the initial render/hydration.
  // Start false so server and client render the same placeholder initially.
  const [mounted, setMounted] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    try {
      const token = localStorage.getItem('accessToken');
      const authed = !!token;
      setIsAuthed(authed);
      if (!authed) {
        // Replace so history doesn't keep protected route
        router.replace('/login');
      }
    } catch (e) {
      setIsAuthed(false);
      router.replace('/login');
    }
  }, [router]);

  // Render a stable placeholder during SSR and until the client has checked auth.
  if (!mounted || isAuthed === null) {
    return <div data-protected="loading" />;
  }

  if (!isAuthed) return null;

  return <>{children}</>;
}
