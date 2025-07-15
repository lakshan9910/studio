
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { translations, TranslationKey } from '@/lib/i18n';

interface HSLColor {
    h: number;
    s: number;
    l: number;
}

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
    language: string;
    themePrimary: HSLColor;
    themeBackground: HSLColor;
    themeAccent: HSLColor;
    themeSidebarBackground: HSLColor;
    themeSidebarForeground: HSLColor;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => void;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey) => string;
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
    language: 'en',
    themePrimary: { h: 200, s: 95, l: 74 },
    themeBackground: { h: 220, s: 13, l: 95 },
    themeAccent: { h: 170, s: 65, l: 53 },
    themeSidebarBackground: { h: 0, s: 0, l: 100 },
    themeSidebarForeground: { h: 222.2, s: 84, l: 4.9 },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('appSettings');
      if (storedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
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

  const setLanguage = (lang: string) => {
    updateSettings({ language: lang });
  };

  const t = useCallback((key: TranslationKey): string => {
    const lang = settings.language;
    if (lang in translations && key in translations[lang as keyof typeof translations]) {
        return translations[lang as keyof typeof translations][key] as string;
    }
    // Fallback to English
    return translations.en[key] as string;
  }, [settings.language]);


  const value = { settings, loading, updateSettings, setLanguage, t };

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
