
'use client';

import { useEffect } from 'react';
import { useSettings } from './SettingsContext';

export function ThemeUpdater() {
  const { settings } = useSettings();
  const { themePrimary, themeBackground, themeAccent, themeSidebarBackground, themeSidebarForeground } = settings;

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--primary-hsl', `${themePrimary.h} ${themePrimary.s}% ${themePrimary.l}%`);
    root.style.setProperty('--background-hsl', `${themeBackground.h} ${themeBackground.s}% ${themeBackground.l}%`);
    root.style.setProperty('--accent-hsl', `${themeAccent.h} ${themeAccent.s}% ${themeAccent.l}%`);
    
    root.style.setProperty('--sidebar-background', `hsl(${themeSidebarBackground.h}, ${themeSidebarBackground.s}%, ${themeSidebarBackground.l}%)`);
    root.style.setProperty('--sidebar-foreground', `hsl(${themeSidebarForeground.h}, ${themeSidebarForeground.s}%, ${themeSidebarForeground.l}%)`);

    // You might need to adjust other related colors based on these primary ones,
    // for example, foreground colors. For simplicity, we'll keep it to these three for now.
    // For a more advanced setup, you could calculate foreground colors for better contrast.
    
  }, [themePrimary, themeBackground, themeAccent, themeSidebarBackground, themeSidebarForeground]);

  return null;
}
