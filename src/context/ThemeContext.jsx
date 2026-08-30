import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

const MANUAL_THEME_KEY = 'user_manual_theme';
const MANUAL_THEME_TIME_KEY = 'user_manual_theme_time';
const MANUAL_THEME_HOUR_KEY = 'user_manual_theme_hour';

/**
 * Türkiye Saatini (Europe/Istanbul UTC+3) saat 0-23 arası sayı olarak döner.
 */
export function getTurkeyHour() {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Istanbul',
      hour: 'numeric',
      hourCycle: 'h23'
    });
    const parsed = parseInt(formatter.format(new Date()), 10);
    return isNaN(parsed) ? (new Date().getUTCHours() + 3) % 24 : parsed;
  } catch {
    const now = new Date();
    const utcHours = now.getUTCHours();
    return (utcHours + 3) % 24;
  }
}

/**
 * Türkiye saatine göre otomatik tema:
 * 19:00 (akşam 7) ile 07:00 (sabah 7) arası GECE (dark)
 * 07:00 ile 19:00 arası GÜNDÜZ (light)
 */
export function getAutoThemeByTurkeyTime() {
  const hour = getTurkeyHour();
  return (hour >= 19 || hour < 7) ? 'dark' : 'light';
}

/**
 * Manuel tema seçiminin geçerli olup olmadığını kontrol eder.
 * Kullanıcı örneğin gündüz vakti manuel bir seçim yaptıysa, akşam 19:00 olduğunda
 * veya aradan 6 saatten fazla geçtiğinde otomatik döngüye geri döner.
 */
export function getActiveManualTheme() {
  try {
    const manualChoice = localStorage.getItem(MANUAL_THEME_KEY);
    if (!manualChoice || (manualChoice !== 'dark' && manualChoice !== 'light')) {
      return null;
    }

    const savedTimestamp = parseInt(localStorage.getItem(MANUAL_THEME_TIME_KEY), 10);
    const savedHour = parseInt(localStorage.getItem(MANUAL_THEME_HOUR_KEY), 10);
    const currentHour = getTurkeyHour();
    const now = Date.now();

    // 1. Eğer 6 saatten fazla geçmişse manuel kilidi kaldır
    if (savedTimestamp && now - savedTimestamp > 6 * 60 * 60 * 1000) {
      localStorage.removeItem(MANUAL_THEME_KEY);
      localStorage.removeItem(MANUAL_THEME_TIME_KEY);
      localStorage.removeItem(MANUAL_THEME_HOUR_KEY);
      return null;
    }

    // 2. Eğer gündüz-gece geçiş eşiği (19:00 veya 07:00) aşıldıysa otomatik moda dön
    if (!isNaN(savedHour)) {
      const wasDay = savedHour >= 7 && savedHour < 19;
      const isDayNow = currentHour >= 7 && currentHour < 19;
      if (wasDay !== isDayNow) {
        localStorage.removeItem(MANUAL_THEME_KEY);
        localStorage.removeItem(MANUAL_THEME_TIME_KEY);
        localStorage.removeItem(MANUAL_THEME_HOUR_KEY);
        return null;
      }
    }

    return manualChoice;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const activeManual = getActiveManualTheme();
    if (activeManual) return activeManual;
    return getAutoThemeByTurkeyTime();
  });

  const [isAutoMode, setIsAutoMode] = useState(() => {
    return !getActiveManualTheme();
  });

  // Document root data-theme attribute senkronizasyonu
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Canlı Döngü: Her 30 saniyede bir Türkiye saatini ve geçişleri kontrol eder.
  // 19:00 veya 07:00 olduğunda otomatik gece/gündüz moduna kesintisiz geçer.
  useEffect(() => {
    const checkAutoTheme = () => {
      const activeManual = getActiveManualTheme();
      if (!activeManual) {
        const autoTheme = getAutoThemeByTurkeyTime();
        setTheme(prev => (prev !== autoTheme ? autoTheme : prev));
        setIsAutoMode(true);
      }
    };

    checkAutoTheme();
    const intervalId = setInterval(checkAutoTheme, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      const currentHour = getTurkeyHour();
      try {
        localStorage.setItem(MANUAL_THEME_KEY, nextTheme);
        localStorage.setItem(MANUAL_THEME_TIME_KEY, String(Date.now()));
        localStorage.setItem(MANUAL_THEME_HOUR_KEY, String(currentHour));
      } catch (err) {
        console.warn('LocalStorage theme write failed:', err);
      }
      setIsAutoMode(false);
      return nextTheme;
    });
  }, []);

  const resetToAutoTheme = useCallback(() => {
    try {
      localStorage.removeItem(MANUAL_THEME_KEY);
      localStorage.removeItem(MANUAL_THEME_TIME_KEY);
      localStorage.removeItem(MANUAL_THEME_HOUR_KEY);
    } catch {}
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
