import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getPatientsWithPagination, deletePatient, updatePatient } from "../api/api";
import EditPatientModal from "../components/modals/EditPatientModal";
import { useAuth } from "../context/AuthContext";
import { getStatusStyle } from "../utils/constants";

const Patients = () => {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);

  const [selectedWard, setSelectedWard] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [editingPatient, setEditingPatient] = useState(null);

  const navigate = useNavigate();
  const { socket } = useAuth();

  const wards = ["ICU", "General", "Emergency", "Cardiology"];
  const statuses = ["critical", "warning", "normal"];

  const [highlightedId, setHighlightedId] = useState(null);
  const [highlightSeverity, setHighlightSeverity] = useState(null);

  const loadPatients = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const filters = {};
      if (selectedWard !== "all") filters.ward = selectedWard;
      if (selectedStatus !== "all") filters.status = selectedStatus;
      if (search) filters.search = search;

      const res = await getPatientsWithPagination(pageNum, limit, filters);
      setList(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.totalRecords || 0);
      setPage(res.page || pageNum);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedWard, selectedStatus, search, limit]);

  useEffect(() => {
    loadPatients(page);
  }, [page, loadPatients]);

  useEffect(() => {
    setPage(1);
  }, [selectedWard, selectedStatus, search]);

  useEffect(() => {
    if (!socket) return;

    socket.off("new-alert");
    socket.on("new-alert", (alert) => {
      const pid = alert?.patient?._id;
      const sev = alert?.severity;

      setHighlightedId(pid);
      setHighlightSeverity(sev);

      setTimeout(() => setHighlightedId(null), 3000);

      const element = document.getElementById(`patient-${pid}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    socket.off("vitals-updated");
    socket.on("vitals-updated", (data) => {
      if (data.patient) {
        setList(prev => prev.map(p => 
          p._id === data.patientId ? data.patient : p
        ));
      } else {
        setList(prev => prev.map(p => 
          p._id === data.patientId ? { ...p, ...data.vitals, status: data.status } : p
        ));
      }
    });

    socket.off("patient-status-changed");
    socket.on("patient-status-changed", (data) => {
      setList(prev => prev.map(p => 
        p._id === data.patientId ? { ...p, status: data.newStatus, healthScore: data.healthScore } : p
      ));
    });

    return () => {
      socket.off("new-alert");
      socket.off("vitals-updated");
      socket.off("patient-status-changed");
    };
  }, [socket]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this patient?")) return;

    try {
      await deletePatient(id);
      setList((prev) => prev.filter((p) => p._id !== id));
      setTotalRecords(prev => prev - 1);
    } catch {
      alert("Delete failed");
    }
  };

  const handleEditSave = async (data) => {
    try {
      const updated = await updatePatient(editingPatient._id, data);
      setList((prev) =>
        prev.map((p) =>
          p._id === updated.updatedPatient._id ? updated.updatedPatient : p
        )
      );
      setEditingPatient(null);
    } catch {
      alert("Update failed");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getHighlightClass = (id) => {
    if (highlightedId !== id) return "";

    if (highlightSeverity === "critical")
      return "animate-pulse ring-4 ring-red-400";

    if (highlightSeverity === "warning")
      return "animate-pulse ring-4 ring-yellow-400";

    return "animate-pulse ring-4 ring-blue-300";
  };

  return (
    <div className="space-y-6">
      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Patient Registry</h2>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">Search, filter, and manage all patients</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Showing {list.length} of {totalRecords} patients</p>
        </div>

        <button
          onClick={() => navigate("/add-patient")}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-lg transition font-medium cursor-pointer self-start sm:self-auto"
        >
          + Add Patient
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or bed…"
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => {
            setSearch("");
            setSelectedWard("all");
            setSelectedStatus("all");
          }}
          className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ward Filter */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold mb-3 text-slate-700">Ward</p>
          <div className="flex gap-2 flex-wrap">
            {["all", ...wards].map((ward) => (
              <button
                key={ward}
                className={`px-4 py-1.5 rounded-full border shadow-sm transition cursor-pointer ${selectedWard === ward ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                onClick={() => setSelectedWard(ward)}
              >
                {ward === "all" ? "All" : ward}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold mb-3 text-slate-700">Status</p>
          <div className="flex gap-2 flex-wrap">
            {["all", ...statuses].map((s) => (
              <button
                key={s}
                className={`px-4 py-1.5 rounded-full border shadow-sm transition cursor-pointer ${selectedStatus === s ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                onClick={() => setSelectedStatus(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PATIENT CARDS */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin text-blue-500 text-4xl">⏳</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {list.map((patient) => {
              const style = getStatusStyle(patient.status);
              return (
                <div
                  id={`patient-${patient._id}`}
                  key={patient._id}
                  onClick={() => navigate(`/patient/${patient._id}`)}
                  className={`bg-white rounded-2xl shadow-md p-6 border-l-4 transition-all cursor-pointer hover:shadow-lg
                  ${style.border} ${getHighlightClass(patient._id)}
                `}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{patient.name}</h3>
                      <p className="text-sm text-gray-500">
                        Bed {patient.bed} • Age {patient.age}
                      </p>
                      <p className="text-sm text-blue-700 font-medium">{patient.ward}</p>
                    </div>

                    <div className="flex flex-col items-end">
                      {/* STATUS BADGE */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
                      >
                        {patient.status}
                      </span>

                      {/* HEALTH SCORE */}
                      {patient.healthScore !== undefined && (
                        <span className={`mt-2 font-bold text-sm ${patient.healthScore < 70 ? 'text-red-500' : patient.healthScore < 85 ? 'text-yellow-500' : 'text-green-500'}`}>
                          Health: {Math.round(patient.healthScore)}/100
                        </span>
                      )}

                      {/* NEW ALERT BADGE */}
                      {highlightedId === patient._id && (
                        <span className="mt-2 px-3 py-1 text-xs font-bold bg-red-600 text-white rounded-full shadow animate-bounce">
                          NEW ALERT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* VITALS */}
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-slate-700">
                    <p>HR: {patient.heartRate} bpm</p>
                    <p>SpO₂: {patient.spo2}%</p>
                    <p>BP: {patient.bp}</p>
                    <p>Temp: {patient.temp} °C</p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPatient(patient);
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium text-sm cursor-pointer"
                    >
                      Edit
                    </button>

                    <button
                      onClick={(e) => handleDelete(e, patient._id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EMPTY STATE */}
          {list.length === 0 && (
            <p className="text-center text-slate-500 py-20">
              No matching patients.
            </p>
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
                          ? 'bg-blue-600 text-white'
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
        </>
      )}
    </div>
  );
};

export default Patients;
