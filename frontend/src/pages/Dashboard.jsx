import { useEffect, useState, useCallback } from "react";
import { getPatientsWithPagination, getAlertsWithPagination } from "../api/api";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/common/StatCard.jsx";
import { Users, AlertTriangle, Bell, Activity } from "lucide-react";
import { getStatusStyle, formatDate } from "../utils/constants";

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useAuth();

  const loadDashboard = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([
        getPatientsWithPagination(1, 100, {}),
        getAlertsWithPagination(1, 50, {})
      ]);

      const safePatients = p.data || [];
      const safeAlerts = a.data || [];

      setPatients(safePatients);
      setAlerts(safeAlerts);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!socket) return;

    socket.off("new-alert");
    socket.on("new-alert", (alert) => {
      setAlerts(prev => {
        if (prev.some(a => a._id === alert._id)) return prev;
        return [alert, ...prev];
      });
    });

    socket.off("vitals-updated");
    socket.on("vitals-updated", (data) => {
      if (data.patient) {
        setPatients(prev => prev.map(p => 
          p._id === data.patientId ? data.patient : p
        ));
      } else {
        setPatients(prev => prev.map(p => 
          p._id === data.patientId ? { ...p, ...data.vitals, status: data.status } : p
        ));
      }
    });

    socket.off("patient-status-changed");
    socket.on("patient-status-changed", (data) => {
      setPatients(prev => prev.map(p => 
        p._id === data.patientId ? { ...p, status: data.newStatus, healthScore: data.healthScore } : p
      ));
      loadDashboard();
    });

    return () => {
      socket.off("new-alert");
      socket.off("vitals-updated");
      socket.off("patient-status-changed");
    };
  }, [socket, loadDashboard]);

  const criticalPatients = patients.filter(
    (p) => p.status?.toLowerCase() === "critical"
  );

  const warningPatients = patients.filter(
    (p) => p.status?.toLowerCase() === "warning"
  );

  const unresolvedAlerts = alerts.filter(a => !a.resolved);

  const latestAlerts = unresolvedAlerts.slice(0, 5);

  return (
    <div className="space-y-6">

      {/* Header Card */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Real-time monitoring of patients & critical alerts.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-sm text-emerald-400 font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin text-slate-900 text-4xl">⏳</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <StatCard
              label="Total Patients"
              value={patients.length}
              icon={<Users />}
              color="blue"
              trend="up"
              percentage={5}
              graphPoints={[10, 20, 15, 30, 22, 40]}
            />

            <StatCard
              label="Critical Patients"
              value={criticalPatients.length}
              icon={<AlertTriangle />}
              color="red"
              trend="up"
              percentage={8}
              graphPoints={[4, 9, 5, 12, 10, 14]}
            />

            <StatCard
              label="Warning Patients"
              value={warningPatients.length}
              icon={<Activity />}
              color="yellow"
              trend="up"
              percentage={3}
              graphPoints={[2, 5, 3, 7, 6, 8]}
            />

            <StatCard
              label="Active Alerts"
              value={unresolvedAlerts.length}
              icon={<Bell />}
              color="red"
              trend="down"
              percentage={3}
              graphPoints={[6, 10, 8, 15, 9, 5]}
            />

          </div>

          {/* RECENT ALERTS (LEFT) + AI SUMMARY (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 🔥 RECENT ALERTS (LEFT SIDE) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-amber-500">⚠️</span>
                Recent Alerts
              </h2>

              {latestAlerts.length === 0 ? (
                <p className="text-slate-500 text-sm">No active alerts</p>
              ) : (
                <div className="space-y-3">
                  {latestAlerts.map((alert) => {
                    const severity = alert.severity || "normal";
                    const style = getStatusStyle(severity);
                    const patientName = alert.patient?.name || alert.patientName || "Unknown";

                    return (
                      <div
                        key={alert._id}
                        className={`
                          flex items-start gap-4 p-4 border border-slate-200 
                          rounded-xl hover:shadow-md transition bg-white
                        `}
                      >
                        <div className={`w-1 h-full min-h-[60px] rounded-full ${style.bg}`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-slate-800 text-sm">
                              {patientName}
                            </p>
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${style.bg} ${style.text}`}
                            >
                              {severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mb-1">{alert.message}</p>
                          <p className="text-xs text-slate-400">
                            {formatDate(alert.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

              {/* 🧠 CLINICAL OVERVIEW (RIGHT SIDE) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-blue-500">📊</span>
                Clinical Overview (NEWS2)
              </h2>

              <ul className="text-slate-600 text-sm space-y-3">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {criticalPatients.length} patients with NEWS2 ≥7 (High Risk)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  {warningPatients.length} patients with NEWS2 5-6 (Medium Risk)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  {unresolvedAlerts.length} active alert{unresolvedAlerts.length !== 1 ? 's' : ''}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  {patients.length - criticalPatients.length - warningPatients.length} patients with NEWS2 0-4 (Low Risk)
                </li>
              </ul>
              
              <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  NEWS2 = National Early Warning Score 2<br/>
                  Higher scores indicate greater clinical risk
                </p>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
