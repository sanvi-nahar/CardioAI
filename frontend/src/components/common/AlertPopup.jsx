import { useEffect, useState } from "react";
import { X, AlertTriangle, AlertCircle, Info, User } from "lucide-react";

export default function AlertPopup({ alert, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 400);
    }, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 400);
  };

  if (!alert) return null;

  const severity = alert.severity || "normal";
  const patientName = alert.patient?.name || alert.patientName || "Unknown Patient";
  const message = alert.message || "Alert triggered";
  const time = new Date(alert.createdAt).toLocaleTimeString();

  const severityConfig = {
    critical: {
      icon: AlertTriangle,
      bg: "bg-red-50",
      border: "border-red-500",
      headerBg: "bg-red-600",
      text: "text-red-800",
      iconColor: "text-red-600",
      pulse: "animate-pulse",
      glow: "shadow-red-500/50",
      title: "CRITICAL ALERT"
    },
    warning: {
      icon: AlertCircle,
      bg: "bg-amber-50",
      border: "border-amber-500",
      headerBg: "bg-amber-500",
      text: "text-amber-800",
      iconColor: "text-amber-600",
      pulse: "animate-pulse",
      glow: "shadow-amber-500/30",
      title: "WARNING ALERT"
    },
    normal: {
      icon: Info,
      bg: "bg-blue-50",
      border: "border-blue-500",
      headerBg: "bg-blue-500",
      text: "text-blue-800",
      iconColor: "text-blue-600",
      pulse: "",
      glow: "shadow-blue-500/30",
      title: "ALERT"
    }
  };

  const config = severityConfig[severity] || severityConfig.normal;
  const Icon = config.icon;

  if (severity !== "critical" && severity !== "warning") return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" />
      <div className={`fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-8 pointer-events-none`}>
        <div
          className={`
            w-full max-w-2xl
            ${config.pulse}
            transition-all duration-400 ease-out
            ${isVisible && !isExiting ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}
          `}
        >
          <div className={`bg-white rounded-2xl shadow-2xl border-4 ${config.border} ${config.glow} shadow-lg overflow-hidden pointer-events-auto`}>
            <div className={`${config.headerBg} px-6 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3 text-white font-bold">
                <div className="relative">
                  <AlertTriangle className="w-7 h-7" />
                  {severity === "critical" && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                  )}
                </div>
                <span className="text-xl tracking-wide">{config.title}</span>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:bg-white/20 rounded-full p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className={`${config.bg} p-6`}>
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-full ${config.bg} ${config.iconColor}`}>
                  <Icon className="w-10 h-10" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-slate-500" />
                    <p className="font-bold text-2xl text-slate-900">{patientName}</p>
                  </div>
                  <p className={`text-lg ${config.text} mt-3 font-semibold leading-relaxed`}>{message}</p>
                  
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200/50">
                    <span className={`px-4 py-2 rounded-lg text-base font-bold uppercase ${config.bg} ${config.text} border ${config.border}`}>
                      {severity}
                    </span>
                    <span className="text-base text-slate-500 font-medium">{time}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-2 flex justify-center">
              <button
                onClick={handleClose}
                className={`text-sm font-medium ${config.text} hover:underline`}
              >
                Click to dismiss or wait 8 seconds
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
