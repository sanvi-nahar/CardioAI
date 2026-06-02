import { useEffect, useState, useCallback, useMemo } from "react";
import { getAlertsWithPagination, deleteAlert, deleteAllAlerts } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getStatusStyle, formatDate } from "../utils/constants";
import { Trash2, AlertTriangle, AlertCircle, X, Filter, XCircle, CheckCircle } from "lucide-react";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit, setLimit] = useState(20);
  const { socket } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const severityFilter = searchParams.get('severity');
  const statusFilter = searchParams.get('status');

  const loadAlerts = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const data = await getAlertsWithPagination(pageNum, limit);
      setAlerts(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.totalRecords || 0);
      setPage(data.page || pageNum);
    } catch (err) {
      console.error("Error loading alerts:", err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadAlerts(page);
  }, [page, loadAlerts]);

  const filteredAlerts = useMemo(() => {
    let result = [...alerts];
    
    if (severityFilter) {
      result = result.filter(a => a.severity?.toLowerCase() === severityFilter.toLowerCase());
    }
    
    if (statusFilter) {
      if (statusFilter === 'pending') {
        result = result.filter(a => !a.resolved);
      } else if (statusFilter === 'resolved') {
        result = result.filter(a => a.resolved);
      }
    }
    
    return result;
  }, [alerts, severityFilter, statusFilter]);

  const clearFilters = () => {
    setSearchParams({});
  };

  const getActiveFilterLabel = () => {
    if (severityFilter) return `Severity: ${severityFilter}`;
    if (statusFilter) return `Status: ${statusFilter}`;
    return null;
  };

  useEffect(() => {
    if (!socket) return;

    socket.off("new-alert");
    socket.on("new-alert", (alert) => {
      setAlerts((prev) => {
        if (prev.some(a => a._id === alert._id)) return prev;
        return [alert, ...prev];
      });
      setTotalRecords(prev => prev + 1);
    });

    socket.on("alerts-resolved", () => {
      loadAlerts(page);
    });

    return () => {
      socket.off("new-alert");
      socket.off("alerts-resolved");
    };
  }, [socket, loadAlerts, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this alert?")) return;

    try {
      await deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      setTotalRecords(prev => prev - 1);
    } catch {
      alert("Failed to delete alert");
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Delete ALL alerts?")) return;

    try {
      await deleteAllAlerts();
      setAlerts([]);
      setTotalRecords(0);
      setTotalPages(1);
    } catch {
      alert("Failed to delete all");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Quick filter buttons
  const QuickFilters = () => (
    <div className="flex flex-nowrap overflow-x-auto pb-2 md:pb-0 gap-2 max-w-full scrollbar-none w-full sm:w-auto">
      <button
        onClick={() => setSearchParams({})}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition shrink-0 cursor-pointer ${
          !severityFilter && !statusFilter 
            ? 'bg-slate-900 text-white' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        All
      </button>
      <button
        onClick={() => setSearchParams({ severity: 'critical' })}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 shrink-0 cursor-pointer ${
          severityFilter === 'critical' 
            ? 'bg-red-600 text-white' 
            : 'bg-red-50 text-red-600 hover:bg-red-100'
        }`}
      >
        <XCircle size={14} /> Critical
      </button>
      <button
        onClick={() => setSearchParams({ severity: 'warning' })}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 shrink-0 cursor-pointer ${
          severityFilter === 'warning' 
            ? 'bg-amber-500 text-white' 
            : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
        }`}
      >
        <AlertTriangle size={14} /> Warning
      </button>
      <button
        onClick={() => setSearchParams({ status: 'pending' })}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 shrink-0 cursor-pointer ${
          statusFilter === 'pending' 
            ? 'bg-blue-600 text-white' 
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
        }`}
      >
        <AlertCircle size={14} /> Pending
      </button>
      <button
        onClick={() => setSearchParams({ status: 'resolved' })}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 shrink-0 cursor-pointer ${
          statusFilter === 'resolved' 
            ? 'bg-green-600 text-white' 
            : 'bg-green-50 text-green-600 hover:bg-green-100'
        }`}
      >
        <CheckCircle size={14} /> Resolved
      </button>
    </div>
  );

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (b.severity === 'critical' && a.severity !== 'critical') return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Alert Center</h2>
          <p className="text-slate-600 mt-1">Live alerts and history from all monitored patients</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-sm text-slate-500">Showing {sortedAlerts.length} of {totalRecords} alerts</p>
            {getActiveFilterLabel() && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                <Filter size={14} />
                <span>{getActiveFilterLabel()}</span>
                <button 
                  onClick={clearFilters}
                  className="hover:bg-blue-100 rounded-full p-0.5 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <QuickFilters />
          <button
            onClick={handleDeleteAll}
            className="px-5 py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 border border-red-200 transition flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base w-full sm:w-auto"
          >
            <Trash2 size={18} />
            Clear History
          </button>
        </div>
      </div>

      {/* ALERT LIST */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin text-slate-900 text-4xl">⏳</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedAlerts.map((alert) => {
            const p = alert.patient || {};
            const style = getStatusStyle(alert.severity);

            return (
              <div
                key={alert._id}
                className={`
                  bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer 
                  ${alert.resolved ? 'opacity-60 bg-gray-50 border-gray-200' : style.border}
                `}
                onClick={() => navigate(`/patient/${p?._id || alert.patient}`)}
              >
                <div className="flex">
                  {/* Severity Bar */}
                  <div className={`w-2 ${alert.resolved ? 'bg-gray-300' : style.badge}`} />

                  <div className="flex-1 p-5 md:p-6">
                    {/* Top Row */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        {alert.severity === 'critical' ? (
                          <AlertTriangle className="text-red-500" size={22} />
                        ) : alert.severity === 'warning' ? (
                          <AlertCircle className="text-yellow-500" size={22} />
                        ) : null}
                        <div>
                          <h3 className={`text-lg md:text-xl font-bold ${alert.resolved ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                            {alert.message}
                          </h3>
                          {alert.resolved && <span className="ml-2 text-sm text-green-600 font-semibold uppercase">Resolved</span>}
                          <p className="text-sm text-slate-500 mt-1">
                            {formatDate(alert.createdAt)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${alert.resolved ? 'bg-gray-100 text-gray-500' : `${style.bg} ${style.text}`}`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    {/* Patient Info */}
                    <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
                      <div>
                        <p className="text-slate-500 text-xs uppercase font-semibold">Patient</p>
                        <p className="font-medium text-slate-800 mt-1">{p.name || alert.patientName || "--"}</p>
                      </div>

                      <div>
                        <p className="text-slate-500 text-xs uppercase font-semibold">Bed & Ward</p>
                        <p className="font-medium text-slate-800 mt-1">{p.bed || "--"} • {p.ward || "--"}</p>
                      </div>

                      <div className="md:col-span-2">
                        <p className="text-slate-500 text-xs uppercase font-semibold">Vitals Snapshot (At Alert Time)</p>
                        <p className="font-medium text-slate-800 mt-1 flex gap-4 flex-wrap">
                          <span>HR: {alert.vitalsSnapshot?.heartRate ?? "--"}</span>
                          <span>SpO₂: {alert.vitalsSnapshot?.spo2 ?? "--"}%</span>
                          <span>BP: {alert.vitalsSnapshot?.bpSystolic ?? "--"}/{alert.vitalsSnapshot?.bpDiastolic ?? "--"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(alert._id);
                        }}
                        className="text-red-500 font-medium hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <X size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {sortedAlerts.length === 0 && (
            <div className="text-center bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200">
              <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 text-lg">No alerts available here.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition ${
                    page === pageNum
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
          
          <span className="text-sm text-slate-500 ml-2">
            Page {page} of {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
