
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || settingsLoading) {
      return; // Wait for both contexts to load
    }

    if (!settings.isSetupComplete) {
      router.replace('/setup');
    } else if (user) {
      router.replace('/dashboard/home');
    } else {
      router.replace('/login');
    }
  }, [user, authLoading, settings, settingsLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-2">
        <svg
          className="h-8 w-8 animate-spin text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span className="text-xl text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}
