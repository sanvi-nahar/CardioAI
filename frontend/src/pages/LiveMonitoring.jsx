import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getPatientsWithPagination } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Activity } from "lucide-react";
import PatientMonitor from "../components/PatientMonitor";

export default function LiveMonitoring() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useAuth();
  const navigate = useNavigate();

  const loadPatients = useCallback(async () => {
    try {
      const res = await getPatientsWithPagination(1, 100, {});
      setPatients(res.data || []);
    } catch (err) {
      console.error("Error loading patients:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (!socket) return;

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
    });

    return () => {
      socket.off("vitals-updated");
      socket.off("patient-status-changed");
    };
  }, [socket]);

  const criticalPatients = patients.filter(p => p.status?.toLowerCase() === "critical");
  const warningPatients = patients.filter(p => p.status?.toLowerCase() === "warning");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-slate-900 text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
            <Activity className="h-6 w-6 text-rose-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">ICU Live Monitoring</h2>
            <p className="text-slate-400">Real-time patient vitals and waveform</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
          <span className="text-sm text-emerald-400 font-medium">Live</span>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
          <p className="text-sm text-slate-400">Total Patients</p>
          <p className="text-2xl font-bold text-white">{patients.length}</p>
        </div>
        <div className="bg-red-900/30 p-4 rounded-xl border border-red-800">
          <p className="text-sm text-red-400">Critical</p>
          <p className="text-2xl font-bold text-red-400">{criticalPatients.length}</p>
        </div>
        <div className="bg-yellow-900/30 p-4 rounded-xl border border-yellow-800">
          <p className="text-sm text-yellow-400">Warning</p>
          <p className="text-2xl font-bold text-yellow-400">{warningPatients.length}</p>
        </div>
        <div className="bg-emerald-900/30 p-4 rounded-xl border border-emerald-800">
          <p className="text-sm text-emerald-400">Normal</p>
          <p className="text-2xl font-bold text-emerald-400">{patients.length - criticalPatients.length - warningPatients.length}</p>
        </div>
      </div>

      {/* Patient Monitor Grid - ICU Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patients.map((patient) => (
          <PatientMonitor
            key={patient._id}
            patient={patient}
            onClick={() => navigate(`/patient/${patient._id}`)}
          />
        ))}
      </div>

      {patients.length === 0 && (
        <div className="text-center bg-slate-900 p-12 rounded-2xl border border-slate-700">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500">No patients to monitor</p>
        </div>
      )}
    </div>
  );
}
