import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings, DEFAULT_SETTINGS, SupportedFont, ActiveProjectHeaderInfo } from '../types/settings';

interface SettingsContextType {
  settings: AppSettings;
  setFontFamily: (font: SupportedFont) => void;
  setFontSizePt: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  updateGoogleDrivePath: (path: string) => void;
  headerTitle: string;
  setHeaderTitle: (title: string) => void;
  activeProjectInfo: ActiveProjectHeaderInfo | null;
  setActiveProjectInfo: (info: ActiveProjectHeaderInfo | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'projectm_app_settings_v1';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Lỗi đọc settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [headerTitle, setHeaderTitle] = useState<string>('DANH MỤC CÁC DỰ ÁN ĐẦU TƯ XÂY DỰNG');
  const [activeProjectInfo, setActiveProjectInfo] = useState<ActiveProjectHeaderInfo | null>(null);

  // Áp dụng Font và Kích thước font vào root DOM
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Lỗi lưu settings:', e);
    }

    const root = document.documentElement;
    // Map font family
    let fontFamilyStr = "'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif";
    if (settings.fontFamily === 'Roboto') {
      fontFamilyStr = "'Roboto', 'Segoe UI', system-ui, sans-serif";
    } else if (settings.fontFamily === 'Inter') {
      fontFamilyStr = "'Inter', 'Segoe UI', system-ui, sans-serif";
    }

    // Set properties
    root.style.setProperty('--app-font-family', fontFamilyStr);
    root.style.setProperty('--app-font-size', `${settings.fontSizePt}pt`);
    root.style.fontSize = `${settings.fontSizePt}pt`;
    if (document.body) {
      document.body.style.fontFamily = fontFamilyStr;
    }
  }, [settings]);

  const setFontFamily = (font: SupportedFont) => {
    setSettings((prev) => ({ ...prev, fontFamily: font }));
  };

  const setFontSizePt = (size: number) => {
    const clamped = Math.min(18, Math.max(12, size));
    setSettings((prev) => ({ ...prev, fontSizePt: clamped }));
  };

  const increaseFontSize = () => {
    setFontSizePt(settings.fontSizePt + 1);
  };

  const decreaseFontSize = () => {
    setFontSizePt(settings.fontSizePt - 1);
  };

  const updateGoogleDrivePath = (path: string) => {
    setSettings((prev) => ({ ...prev, googleDrivePath: path }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setFontFamily,
        setFontSizePt,
        increaseFontSize,
        decreaseFontSize,
        updateGoogleDrivePath,
        headerTitle,
        setHeaderTitle,
        activeProjectInfo,
        setActiveProjectInfo,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings phải được sử dụng bên trong SettingsProvider');
  }
  return context;
};
