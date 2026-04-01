import { createContext, useEffect, useCallback, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { useSettings } from "./SettingsContext";
import AlertPopup from "../components/common/AlertPopup";

export const AlertContext = createContext();

let audioPlayer = null;

function initAudio() {
  return new Audio("/sounds/alert.mp3");
}

function playAlertSound(volume = 100) {
  console.log("🎵 Attempting to play alert sound...");
  
  const audio = new Audio("/sounds/alert.mp3");
  audio.volume = volume / 100;
  
  audio.play().then(() => {
    console.log("✅ Alert sound playing!");
  }).catch(err => {
    console.error("❌ Play failed:", err.message);
  });
}

function showBrowserNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/vite.svg" });
  } else if ("Notification" in window && Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, { body, icon: "/vite.svg" });
      }
    });
  }
}

window.testAlertSound = playAlertSound;

export default function GlobalAlertProvider({ children }) {
  const { addToast } = useToast();
  const { socket } = useAuth();
  const { settings } = useSettings();
  const [popupAlerts, setPopupAlerts] = useState([]);
  const audioInitialized = useRef(false);

  useEffect(() => {
    if (!audioInitialized.current) {
      const audio = initAudio();
      audioInitialized.current = true;
      
      const unlockAudio = () => {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
          console.log("🔊 Audio unlocked");
        }).catch(() => {});
      };
      
      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
    }
  }, []);

  const closePopup = useCallback((alertId) => {
    setPopupAlerts(prev => prev.filter(a => a._id !== alertId));
  }, []);

  useEffect(() => {
    if (!socket) {
      console.log("⚠️ No socket available in GlobalAlertProvider");
      return;
    }

    console.log("✅ Socket connected, setting up alert listeners");

    const handleNewAlert = (alert) => {
      console.log("🔔 ALERT RECEIVED:", alert);
      
      const severity = alert.severity || "normal";
      const patientName = alert.patient?.name || alert.patientName || 'Patient';
      
      addToast(`[${severity.toUpperCase()}] ${patientName}: ${alert.message}`, severity === 'critical' ? 'error' : 'warning');
      
      if (severity === "critical" || severity === "warning") {
        console.log("Showing popup and playing sound for:", severity);
        
        // Check settings for sound alerts
        if (settings.enableSoundAlerts) {
          playAlertSound(settings.alertVolume || 80);
        }
        
        // Check settings for browser notifications
        if (settings.enableBrowserNotifications) {
          showBrowserNotification(
            `${severity.toUpperCase()}: ${patientName}`,
            alert.message
          );
        }
        
        // Check settings for popup alerts
        if (settings.enableCriticalPopup) {
          setPopupAlerts(prev => [...prev, alert]);
        }
      }
    };

    const handleAlertsResolved = (data) => {
      addToast(data.message, "success");
    };

    socket.on("new-alert", handleNewAlert);
    socket.on("alerts-resolved", handleAlertsResolved);

    return () => {
      socket.off("new-alert", handleNewAlert);
      socket.off("alerts-resolved", handleAlertsResolved);
    };
  }, [socket, addToast, settings]);

  return (
    <AlertContext.Provider value={{ playAlertSound }}>
      {children}
      {popupAlerts.map((alert) => (
        <AlertPopup 
          key={alert._id} 
          alert={alert} 
          onClose={() => closePopup(alert._id)} 
        />
      ))}
    </AlertContext.Provider>
  );
}
