import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getPatientsWithPagination, getAlertsWithPagination } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingDown,
  Building2,
  HeartPulse
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from "recharts";

const COLORS = {
  critical: '#ef4444',
  warning: '#f59e0b',
  normal: '#22c55e',
  resolved: '#10b981',
  pending: '#3b82f6'
};

export default function Reports() {
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useAuth();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const [patientsRes, alertsRes] = await Promise.all([
        getPatientsWithPagination(1, 100, {}),
        getAlertsWithPagination(1, 100, {})
      ]);
      setPatients(patientsRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!socket) return;

    socket.off("new-alert");
    socket.on("new-alert", (alert) => {
      setAlerts(prev => [alert, ...prev]);
      loadData();
    });

    socket.off("vitals-updated");
    socket.on("vitals-updated", (data) => {
      if (data.patient) {
        setPatients(prev => prev.map(p => 
          p._id === data.patientId ? data.patient : p
        ));
      }
    });

    return () => {
      socket.off("new-alert");
      socket.off("vitals-updated");
    };
  }, [socket, loadData]);

  const criticalCount = patients.filter(p => p.status?.toLowerCase() === "critical").length;
  const warningCount = patients.filter(p => p.status?.toLowerCase() === "warning").length;
  const normalCount = patients.filter(p => p.status?.toLowerCase() === "normal").length;

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);
  const criticalAlerts = alerts.filter(a => a.severity === "critical" && !a.resolved);
  const warningAlerts = alerts.filter(a => a.severity === "warning" && !a.resolved);

  const wardStats = patients.reduce((acc, p) => {
    const ward = p.ward || 'Unknown';
    acc[ward] = (acc[ward] || 0) + 1;
    return acc;
  }, {});

  const wardData = Object.entries(wardStats).map(([name, value]) => ({
    name,
    value,
    fill: name.toLowerCase().includes('icu') ? '#8b5cf6' : 
          name.toLowerCase().includes('emergency') ? '#f97316' :
          name.toLowerCase().includes('cardio') ? '#ec4899' : '#3b82f6'
  }));

  const statusData = [
    { name: 'Critical', value: criticalCount, color: COLORS.critical },
    { name: 'Warning', value: warningCount, color: COLORS.warning },
    { name: 'Normal', value: normalCount, color: COLORS.normal }
  ].filter(d => d.value > 0);

  const getAlertTrendData = () => {
    const now = new Date();
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setHours(date.getHours() - i);
      const hourKey = date.getHours();
      
      const count = alerts.filter(a => {
        const alertDate = new Date(a.createdAt);
        return alertDate.getHours() === hourKey && 
               alertDate.getDate() === date.getDate();
      }).length;
      
      trends.push({
        hour: `${hourKey}:00`,
        alerts: count
      });
    }
    return trends;
  };

  const alertTrendData = getAlertTrendData();

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
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
            <BarChart3 className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
            <p className="text-slate-400">Healthcare insights and monitoring overview</p>
          </div>
        </div>
      </div>

      {/* Key Metrics - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Patients</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{patients.length}</p>
              <p className="text-xs text-slate-400 mt-1">Currently monitored</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Critical Patients</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{criticalCount}</p>
              <p className="text-xs text-slate-400 mt-1">Require immediate attention</p>
            </div>
            <div className="bg-red-100 p-3 rounded-xl">
              <HeartPulse className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Alerts</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{unresolvedAlerts.length}</p>
              <p className="text-xs text-slate-400 mt-1">Pending resolution</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Resolved Alerts</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{resolvedAlerts.length}</p>
              <p className="text-xs text-slate-400 mt-1">Successfully handled</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Status Distribution - Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="text-slate-500" size={20} />
            Patient Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-slate-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Trend - Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingDown className="text-slate-500" size={20} />
            Alert Trend (Last 7 Hours)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={alertTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="alerts" 
                  name="Alerts"
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward Distribution - Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="text-slate-500" size={20} />
            Patient Distribution by Ward
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" name="Patients" radius={[0, 4, 4, 0]}>
                  {wardData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Statistics */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle className="text-slate-500" size={20} />
            Alert Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => navigate('/alerts?severity=critical')}
              className="bg-red-50 p-4 rounded-xl border border-red-200 cursor-pointer hover:scale-[1.02] hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-600">Critical Alerts</span>
              </div>
              <p className="text-3xl font-bold text-red-700">{criticalAlerts.length}</p>
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                Click to view alerts →
              </p>
            </div>
            
            <div 
              onClick={() => navigate('/alerts?severity=warning')}
              className="bg-amber-50 p-4 rounded-xl border border-amber-200 cursor-pointer hover:scale-[1.02] hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-600">Warning Alerts</span>
              </div>
              <p className="text-3xl font-bold text-amber-700">{warningAlerts.length}</p>
              <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                Click to view alerts →
              </p>
            </div>
            
            <div 
              onClick={() => navigate('/alerts?status=pending')}
              className="bg-blue-50 p-4 rounded-xl border border-blue-200 cursor-pointer hover:scale-[1.02] hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Pending Alerts</span>
              </div>
              <p className="text-3xl font-bold text-blue-700">{unresolvedAlerts.length}</p>
              <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                Click to view alerts →
              </p>
            </div>
            
            <div 
              onClick={() => navigate('/alerts?status=resolved')}
              className="bg-green-50 p-4 rounded-xl border border-green-200 cursor-pointer hover:scale-[1.02] hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Resolved Alerts</span>
              </div>
              <p className="text-3xl font-bold text-green-700">{resolvedAlerts.length}</p>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                Click to view alerts →
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
