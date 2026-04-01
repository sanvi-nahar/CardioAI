import { createContext, useContext, useState, useEffect, useCallback } from "react";

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  enableSoundAlerts: true,
  enableBrowserNotifications: true,
  enableCriticalPopup: true,
  dashboardRefreshInterval: 30,
  monitoringMode: "simulation",
  darkMode: false,
  waveformAnimation: true,
  compactLayout: false,
  refreshSpeed: 5,
  defaultLandingPage: "dashboard",
  alertVolume: 80,
  showVitalsAnimation: true,
  autoEscalation: true,
  autoResolution: true,
  ackTimeout: 60,
  maxDashboardAlerts: 10,
  systemName: "CardioAI",
  hospitalName: "City General Hospital",
  defaultWard: "ICU",
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cardioai_settings");
      if (saved) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch (e) {
          console.error("Error parsing settings:", e);
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("cardioai_settings", JSON.stringify(settings));
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateMultipleSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSetting, 
      updateMultipleSettings, 
      resetSettings,
      defaults: DEFAULT_SETTINGS 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
