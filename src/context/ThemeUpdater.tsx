
'use client';

import { useEffect } from 'react';
import { useSettings } from './SettingsContext';

export function ThemeUpdater() {
  const { settings, loading } = useSettings();
  
  useEffect(() => {
    if (loading) return;

    const { 
      themePrimary, 
      themeBackground, 
      themeAccent, 
      themeSidebarBackground, 
      themeSidebarForeground 
    } = settings;

    const root = document.documentElement;

    root.style.setProperty('--primary-hsl', `${themePrimary.h} ${themePrimary.s}% ${themePrimary.l}%`);
    root.style.setProperty('--background-hsl', `${themeBackground.h} ${themeBackground.s}% ${themeBackground.l}%`);
    root.style.setProperty('--accent-hsl', `${themeAccent.h} ${themeAccent.s}% ${themeAccent.l}%`);
    root.style.setProperty('--sidebar-background-hsl', `${themeSidebarBackground.h} ${themeSidebarBackground.s}% ${themeSidebarBackground.l}%`);
    root.style.setProperty('--sidebar-foreground-hsl', `${themeSidebarForeground.h} ${themeSidebarForeground.s}% ${themeSidebarForeground.l}%`);
    
  }, [settings, loading]);

  return null;
}
