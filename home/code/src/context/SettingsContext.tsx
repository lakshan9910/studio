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
    storeLogo: 'data:image/png;base64,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',
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
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
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
    if (translations[lang]) {
        updateSettings({ language: lang });
    }
  }

  const t = useCallback((key: TranslationKey): string => {
    return translations[settings.language as keyof typeof translations]?.[key] || translations.en[key] || key;
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
    
