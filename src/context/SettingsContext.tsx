
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { translations, TranslationKey } from '@/lib/i18n';

export interface Settings {
    isSetupComplete: boolean;
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
    payrollType: 'salaryTheory' | 'wagesBoard';
    enableCashDrawer: boolean;
    enableTax: boolean;
    taxRate: number;
}

const defaultSettings: Settings = {
    isSetupComplete: false,
    storeName: 'SOLO SOLUTIONS',
    currency: 'USD',
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    receiptHeaderText: 'Thank you for your business!',
    receiptFooterText: 'Please come again!',
    language: 'en',
    payrollType: 'salaryTheory',
    enableCashDrawer: true,
    enableTax: false,
    taxRate: 0,
};

interface SettingsContextType {
    settings: Settings;
    loading: boolean;
    updateSettings: (newSettings: Partial<Settings>) => void;
    setLanguage: (lang: string) => void;
    t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (e) {
      console.error("Failed to parse settings from localStorage", e);
      // If parsing fails, stick with default settings
    }
    setLoading(false);
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
        const updated = {...prev, ...newSettings};
        localStorage.setItem('appSettings', JSON.stringify(updated));
        return updated;
    });
  };

  const setLanguage = (lang: string) => {
    if (translations[lang as keyof typeof translations]) {
        updateSettings({ language: lang });
    }
  }

  const t = useCallback((key: TranslationKey): string => {
    const lang = settings.language as keyof typeof translations;
    if (translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    // Fallback to English if translation is missing
    return translations.en[key] || key;
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
