import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

/**
 * Türkiye Saatini (Europe/Istanbul UTC+3) saat 0-23 arası sayı olarak döner.
 */
export function getTurkeyHour() {
  try {
    const now = new Date();
    const trHourStr = now.toLocaleTimeString('en-US', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false });
    return parseInt(trHourStr, 10);
  } catch {
    const now = new Date();
    const utcHours = now.getUTCHours();
    return (utcHours + 3) % 24;
  }
}

/**
 * Türkiye saatine göre otomatik tema seçimi:
 * 19:00 (akşam 7) ile 07:00 (sabah 7) arası GECE (dark)
 * 07:00 ile 19:00 arası GÜNDÜZ (light)
 */
export function getAutoThemeByTurkeyTime() {
  const hour = getTurkeyHour();
  return (hour >= 19 || hour < 7) ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const manualChoice = localStorage.getItem('user_manual_theme');
    if (manualChoice && (manualChoice === 'dark' || manualChoice === 'light')) {
      return manualChoice;
    }
    return getAutoThemeByTurkeyTime();
  });

  const [isAutoMode, setIsAutoMode] = useState(() => {
    return !localStorage.getItem('user_manual_theme');
  });

  // Document root data-theme attribute senkronizasyonu
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Canlı Döngü: Her 60 saniyede bir Türkiye saatini kontrol eder. 
  // 19:00 veya 07:00 olduğunda otomatik gece/gündüz moduna geçer.
  useEffect(() => {
    const checkAutoTheme = () => {
      const manualChoice = localStorage.getItem('user_manual_theme');
      if (!manualChoice) {
        const autoTheme = getAutoThemeByTurkeyTime();
        setTheme(prev => (prev !== autoTheme ? autoTheme : prev));
        setIsAutoMode(true);
      }
    };

    const intervalId = setInterval(checkAutoTheme, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('user_manual_theme', nextTheme);
      setIsAutoMode(false);
      return nextTheme;
    });
  }, []);

  const resetToAutoTheme = useCallback(() => {
    localStorage.removeItem('user_manual_theme');
    const autoTheme = getAutoThemeByTurkeyTime();
    setTheme(autoTheme);
    setIsAutoMode(true);
  }, []);

  const isLight = theme === 'light';
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, resetToAutoTheme, isAutoMode, isLight, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'dark',
      toggleTheme: () => {},
      resetToAutoTheme: () => {},
      isAutoMode: false,
      isLight: false,
      isDark: true
    };
  }
  return context;
}
