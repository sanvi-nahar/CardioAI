import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../api/api";
import { Settings as SettingsIcon, Save, Building2, Bell, AlertTriangle, Palette, User, Info, Trash2, RefreshCw, Database, Wifi, WifiOff, CheckCircle, XCircle, Volume2, Layout, Activity } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-sm text-slate-700">{label}</span>
    <div 
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${checked ? 'bg-green-500' : 'bg-slate-300'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
    </div>
  </label>
);

const Settings = () => {
  const { settings, updateSetting, updateMultipleSettings, defaults } = useSettings();
  const { addToast } = useToast();
  const { socket } = useAuth();

  const [thresholdSettings, setThresholdSettings] = useState({
    heartRateLow: "",
    heartRateHigh: "",
    spo2Low: "",
    tempHigh: "",
    bpSystolicHigh: "",
    bpDiastolicHigh: ""
  });

  const [connectionStatus, setConnectionStatus] = useState({
    backend: "online",
    websocket: "disconnected"
  });

  const [showClearModal, setShowClearModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showReloadModal, setShowReloadModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSettings();
        setThresholdSettings({
          heartRateLow: res?.heartRateLow ?? "",
          heartRateHigh: res?.heartRateHigh ?? "",
          spo2Low: res?.spo2Low ?? "",
          tempHigh: res?.tempHigh ?? "",
          bpSystolicHigh: res?.bpSystolicHigh ?? "",
          bpDiastolicHigh: res?.bpDiastolicHigh ?? ""
        });
      } catch (err) {
        console.error("Error loading settings:", err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setConnectionStatus(prev => ({ ...prev, websocket: socket ? "connected" : "disconnected" }));
  }, [socket]);

  const handleThresholdUpdate = async () => {
    try {
      await updateSettings(thresholdSettings);
      addToast("Threshold settings updated successfully", "success");
    } catch (err) {
      addToast("Update failed", "error");
    }
  };

  const handleClearHistory = () => {
    setShowClearModal(false);
    addToast("Alert history cleared", "success");
  };

  const handleResetSimulation = () => {
    setShowResetModal(false);
    addToast("Simulation reset", "success");
  };

  const handleReloadData = () => {
    setShowReloadModal(false);
    window.location.reload();
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Reset all settings to defaults?")) {
      updateMultipleSettings(defaults);
      addToast("Settings reset to defaults", "success");
    }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition";
  const selectClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
            <SettingsIcon className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">System Settings</h2>
            <p className="text-slate-400">Configure application behavior and preferences</p>
          </div>
          <button 
            onClick={handleResetToDefaults}
            className="ml-auto px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition cursor-pointer"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Section 1: System Configuration */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Building2 className="text-blue-500" size={20} />
          System Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">System Name</label>
            <input
              type="text"
              value={settings.systemName}
              onChange={(e) => updateSetting("systemName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Hospital / Organization</label>
            <input
              type="text"
              value={settings.hospitalName}
              onChange={(e) => updateSetting("hospitalName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Default Ward</label>
            <select
              value={settings.defaultWard}
              onChange={(e) => updateSetting("defaultWard", e.target.value)}
              className={selectClass}
            >
              <option value="ICU">ICU</option>
              <option value="Emergency">Emergency</option>
              <option value="General">General Ward</option>
              <option value="Cardiology">Cardiology</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Monitoring Mode</label>
            <select
              value={settings.monitoringMode}
              onChange={(e) => updateSetting("monitoringMode", e.target.value)}
              className={selectClass}
            >
              <option value="simulation">Simulation</option>
              <option value="real">Real Monitoring</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => addToast("System configuration saved", "success")} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer">
            <Save size={16} /> Save Configuration
          </button>
        </div>
      </div>

      {/* Section 2: Notification Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Bell className="text-amber-500" size={20} />
          Notification Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Toggle 
              checked={settings.enableSoundAlerts} 
              onChange={(v) => updateSetting("enableSoundAlerts", v)} 
              label="Enable Sound Alerts" 
            />
            <Toggle 
              checked={settings.enableBrowserNotifications} 
              onChange={(v) => updateSetting("enableBrowserNotifications", v)} 
              label="Enable Browser Notifications" 
            />
            <Toggle 
              checked={settings.enableCriticalPopup} 
              onChange={(v) => updateSetting("enableCriticalPopup", v)} 
              label="Critical Alert Popups" 
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">Alert Auto-Refresh Interval (seconds)</label>
            <input
              type="number"
              value={settings.dashboardRefreshInterval}
              onChange={(e) => updateSetting("dashboardRefreshInterval", parseInt(e.target.value))}
              className={inputClass}
              min={5}
              max={300}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => addToast("Notification settings saved", "success")} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer">
            <Save size={16} /> Save Notifications
          </button>
        </div>
      </div>

      {/* Section 3: Alert Behavior */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={20} />
          Alert Behavior Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Toggle 
              checked={settings.autoEscalation} 
              onChange={(v) => updateSetting("autoEscalation", v)} 
              label="Automatic Alert Escalation" 
            />
            <Toggle 
              checked={settings.autoResolution} 
              onChange={(v) => updateSetting("autoResolution", v)} 
              label="Auto-Resolve Stable Alerts" 
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-600 font-medium">Acknowledgement Timeout (seconds)</label>
              <input
                type="number"
                value={settings.ackTimeout}
                onChange={(e) => updateSetting("ackTimeout", parseInt(e.target.value))}
                className={inputClass}
                min={30}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 font-medium">Max Alerts on Dashboard</label>
              <input
                type="number"
                value={settings.maxDashboardAlerts}
                onChange={(e) => updateSetting("maxDashboardAlerts", parseInt(e.target.value))}
                className={inputClass}
                min={5}
                max={50}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => addToast("Alert behavior settings saved", "success")} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer">
            <Save size={16} /> Save Alert Behavior
          </button>
        </div>
      </div>

      {/* Section 4: Display Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Palette className="text-purple-500" size={20} />
          Display Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Toggle 
              checked={settings.darkMode} 
              onChange={(v) => updateSetting("darkMode", v)} 
              label="Dark Mode" 
            />
            <Toggle 
              checked={settings.compactLayout} 
              onChange={(v) => updateSetting("compactLayout", v)} 
              label="Compact Monitoring Layout" 
            />
            <Toggle 
              checked={settings.waveformAnimation} 
              onChange={(v) => updateSetting("waveformAnimation", v)} 
              label="Waveform Animation" 
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium">Dashboard Refresh Speed (seconds)</label>
            <select
              value={settings.refreshSpeed}
              onChange={(e) => updateSetting("refreshSpeed", parseInt(e.target.value))}
              className={selectClass}
            >
              <option value={3}>3 seconds</option>
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => addToast("Display settings saved", "success")} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer">
            <Save size={16} /> Save Display
          </button>
        </div>
      </div>

      {/* Section 5: User Preferences */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <User className="text-green-500" size={20} />
          User Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-600 font-medium">Default Landing Page</label>
            <select
              value={settings.defaultLandingPage}
              onChange={(e) => updateSetting("defaultLandingPage", e.target.value)}
              className={selectClass}
            >
              <option value="dashboard">Dashboard</option>
              <option value="live-monitoring">Live Monitoring</option>
              <option value="alerts">Alerts</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium">Alert Sound Volume</label>
            <div className="flex items-center gap-2 mt-1.5">
              <Volume2 size={18} className="text-slate-400" />
              <input
                type="range"
                value={settings.alertVolume}
                onChange={(e) => updateSetting("alertVolume", parseInt(e.target.value))}
                className="flex-1 cursor-pointer"
                min={0}
                max={100}
              />
              <span className="text-sm text-slate-600 w-10">{settings.alertVolume}%</span>
            </div>
          </div>
          <div>
            <Toggle 
              checked={settings.showVitalsAnimation} 
              onChange={(v) => updateSetting("showVitalsAnimation", v)} 
              label="Show Vitals Animation" 
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => addToast("User preferences saved", "success")} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer">
            <Save size={16} /> Save Preferences
          </button>
        </div>
      </div>

      {/* Section 6: System Information */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Info className="text-blue-500" size={20} />
          System Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase">System Status</p>
            <p className="text-green-600 font-semibold flex items-center gap-2 mt-1">
              <CheckCircle size={16} /> Online
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase">Backend API</p>
            <p className="text-green-600 font-semibold flex items-center gap-2 mt-1">
              <CheckCircle size={16} /> Online
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase">WebSocket</p>
            <p className={`font-semibold flex items-center gap-2 mt-1 ${connectionStatus.websocket === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus.websocket === 'connected' ? <><Wifi size={16} /> Connected</> : <><WifiOff size={16} /> Disconnected</>}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase">App Version</p>
            <p className="text-slate-800 font-semibold mt-1">v1.0.0</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4">Last system update: {new Date().toLocaleString()}</p>
      </div>

      {/* Section 7: Internal Threshold Settings */}
      <details className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <summary className="text-lg font-semibold text-slate-800 flex items-center gap-2 cursor-pointer">
          <Activity className="text-slate-400" size={20} />
          Internal Threshold Configuration (Advanced)
        </summary>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600 font-medium">Heart Rate Min</label>
            <input type="number" value={thresholdSettings.heartRateLow} onChange={(e) => setThresholdSettings({ ...thresholdSettings, heartRateLow: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium">Heart Rate Max</label>
            <input type="number" value={thresholdSettings.heartRateHigh} onChange={(e) => setThresholdSettings({ ...thresholdSettings, heartRateHigh: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium">SpO₂ Min</label>
            <input type="number" value={thresholdSettings.spo2Low} onChange={(e) => setThresholdSettings({ ...thresholdSettings, spo2Low: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium">Temperature Max</label>
            <input type="number" value={thresholdSettings.tempHigh} onChange={(e) => setThresholdSettings({ ...thresholdSettings, tempHigh: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium">BP Systolic Max</label>
            <input type="number" value={thresholdSettings.bpSystolicHigh} onChange={(e) => setThresholdSettings({ ...thresholdSettings, bpSystolicHigh: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-slate-600 font-medium">BP Diastolic Max</label>
            <input type="number" value={thresholdSettings.bpDiastolicHigh} onChange={(e) => setThresholdSettings({ ...thresholdSettings, bpDiastolicHigh: e.target.value })} className={inputClass} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleThresholdUpdate} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-2 cursor-pointer">
            <Save size={16} /> Save Thresholds
          </button>
        </div>
      </details>

      {/* Section 8: Danger Zone */}
      <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
        <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={20} />
          Danger Zone
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setShowClearModal(true)}
            className="px-4 py-3 bg-white border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 size={18} /> Clear Alert History
          </button>
          <button 
            onClick={() => setShowResetModal(true)}
            className="px-4 py-3 bg-white border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={18} /> Reset Simulation
          </button>
          <button 
            onClick={() => setShowReloadModal(true)}
            className="px-4 py-3 bg-white border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Database size={18} /> Reload Patient Data
          </button>
        </div>
      </div>

      {/* Modals */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Clear Alert History?</h3>
            <p className="text-slate-600 mb-4">This will permanently delete all alert history. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowClearModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition cursor-pointer">Cancel</button>
              <button onClick={handleClearHistory} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition cursor-pointer">Clear History</button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Reset Simulation?</h3>
            <p className="text-slate-600 mb-4">This will reset all patient simulation data. Patients will revert to initial states.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResetModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition cursor-pointer">Cancel</button>
              <button onClick={handleResetSimulation} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition cursor-pointer">Reset</button>
            </div>
          </div>
        </div>
      )}

      {showReloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Reload Patient Data?</h3>
            <p className="text-slate-600 mb-4">This will reload all patient data from the database. Current unsaved changes may be lost.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowReloadModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition cursor-pointer">Cancel</button>
              <button onClick={handleReloadData} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition cursor-pointer">Reload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
