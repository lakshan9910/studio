
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Settings {
    storeName: string;
    storeLogo?: string;
    currency: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser?: string;
    smtpPass?: string;
    receiptHeaderText?: string;
    receiptFooterText?: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
    storeName: 'Cashy',
    storeLogo: '',
    currency: 'USD',
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUser: 'user@example.com',
    smtpPass: '',
    receiptHeaderText: 'Thank you for your purchase!',
    receiptFooterText: 'Please come again!',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('appSettings');
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error("Failed to parse settings from local storage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => {
        const updated = { ...prevSettings, ...newSettings };
        localStorage.setItem('appSettings', JSON.stringify(updated));
        return updated;
    });
  };

  const value = { settings, loading, updateSettings };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
