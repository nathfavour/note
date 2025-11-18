"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/ui/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    if (isAuthenticated) {
      router.replace('/notes');
    } else {
      router.replace('/landing');
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render anything - just redirect
  return null;
}