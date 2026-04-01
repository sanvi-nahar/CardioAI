import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import {
  getPatientById,
  postVitals,
  deletePatient,
  updatePatient,
  getPatientSummary,
} from "../api/api";
import { useAuth } from "../context/AuthContext";

import VitalsChart from "../Components/VitalsChart";
import EditPatientModal from "../components/modals/EditPatientModal";

// Reusable modal for text editing
const TextEditModal = ({ title, value, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl w-96 shadow-2xl space-y-4 border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>

        <textarea
          id="editTextField"
          defaultValue={value}
          className="w-full h-40 border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-slate-900 outline-none"
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-medium"
          >
            Cancel
          </button>

          <button
            onClick={() =>
              onSave(document.getElementById("editTextField").value)
            }
            className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const PatientDetail = () => {
  const { id } = useParams();
  const { socket } = useAuth();
  const [patient, setPatient] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [clinicalSummary, setClinicalSummary] = useState(null);
  const [clinicalSummaryLoading, setClinicalSummaryLoading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);

  const handleViewSummary = async () => {
    setShowSummaryModal(true);
    setClinicalSummaryLoading(true);
    try {
      const data = await getPatientSummary(id);
      setClinicalSummary(data.clinicalSummary);
    } catch (err) {
      console.error("Error loading clinical summary:", err);
    } finally {
      setClinicalSummaryLoading(false);
    }
  };

  const calculateHeartRateScore = (hr) => {
    if (hr === undefined || hr === null) return 0;
    if (hr <= 40) return 3;
    if (hr <= 50) return 1;
    if (hr <= 90) return 0;
    if (hr <= 110) return 1;
    if (hr <= 130) return 2;
    return 3;
  };

  const calculateSpo2Score = (spo2) => {
    if (spo2 === undefined || spo2 === null) return 0;
    if (spo2 >= 96) return 0;
    if (spo2 >= 94) return 1;
    if (spo2 >= 92) return 2;
    return 3;
  };

  const calculateTempScore = (temp) => {
    if (temp === undefined || temp === null) return 0;
    if (temp <= 35) return 3;
    if (temp <= 36) return 1;
    if (temp <= 38) return 0;
    if (temp <= 39) return 1;
    return 2;
  };

  const calculateBpScore = (bpSys) => {
    if (bpSys === undefined || bpSys === null) return 0;
    if (bpSys <= 90) return 3;
    if (bpSys <= 100) return 2;
    if (bpSys <= 110) return 1;
    if (bpSys <= 219) return 0;
    return 3;
  };

  const getRiskLevel = (score) => {
    if (score >= 7) return "critical";
    if (score >= 5) return "warning";
    return "normal";
  };

  const getClinicalMessage = (riskLevel) => {
    if (riskLevel === "critical") {
      return "Immediate clinical attention required. Consider urgent review and escalation to higher care level.";
    }
    if (riskLevel === "warning") {
      return "Increased observation frequency recommended. Junior doctor review within 1 hour.";
    }
    return "Continue routine monitoring. No immediate action required.";
  };

  const bpSystolic = patient?.bp ? parseInt(patient.bp.split('/')[0]) : null;
  const hrScore = calculateHeartRateScore(patient?.heartRate);
  const spo2Score = calculateSpo2Score(patient?.spo2);
  const tempScore = calculateTempScore(patient?.temp);
  const bpScore = calculateBpScore(bpSystolic);
  const news2Score = hrScore + spo2Score + tempScore + bpScore;
  const news2Risk = getRiskLevel(news2Score);
  const clinicalMessage = getClinicalMessage(news2Risk);

  const loadData = useCallback(async () => {
    try {
      const data = await getPatientById(id);
      setPatient(data);
    } catch (err) {
      console.error("Error loading patient:", err);
    }
  }, [id]);

  /* -------------------------------
     LOAD PATIENT + SUMMARY
  --------------------------------*/
  useEffect(() => {
    loadData();

    const loadSummaryData = async () => {
      try {
        const s = await getPatientSummary(id);
        setSummary(s);
      } catch (err) {
        console.error("Error loading summary:", err);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummaryData();
  }, [id, loadData]);

  /* Socket listeners for real-time updates - NO polling */
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!socket) return;

    socket.off("vitals-updated");
    socket.on("vitals-updated", (data) => {
      if (data.patientId === id && data.patient) {
        setPatient(data.patient);
      } else if (data.patientId === id && data.vitals) {
        setPatient(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            heartRate: data.vitals.heartRate,
            spo2: data.vitals.spo2,
            bp: data.vitals.bp,
            temp: data.vitals.temp,
            status: data.status,
            vitals: [...(prev.vitals || []), {
              timestamp: new Date(),
              heartRate: data.vitals.heartRate,
              spo2: data.vitals.spo2,
              bpSystolic: parseInt(data.vitals.bp?.split('/')[0]) || 0,
              bpDiastolic: parseInt(data.vitals.bp?.split('/')[1]) || 0,
              temp: data.vitals.temp
            }]
          };
        });
      }
    });

    socket.off("patient-status-changed");
    socket.on("patient-status-changed", (data) => {
      if (data.patientId === id) {
        setPatient(prev => {
          if (!prev) return prev;
          return { ...prev, status: data.newStatus, healthScore: data.healthScore };
        });
      }
    });

    return () => {
      socket.off("vitals-updated");
      socket.off("patient-status-changed");
    };
  }, [socket, id]);

  const handleEditSave = async (updatedFields) => {
    try {
      const updated = await updatePatient(patient._id, updatedFields);
      setPatient(updated);
      setEditing(false);
    } catch {
      alert("Update failed");
    }
  };

  const handleTextSave = async (text) => {
    try {
      const updated = await updatePatient(patient._id, {
        [editingField]: text,
      });
      setPatient(updated);
      setEditingField(null);
    } catch {
      alert("Failed to save");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this patient?")) return;
    try {
      await deletePatient(id);
      alert("Patient deleted");
      window.location.href = "/patients";
    } catch {
      alert("Delete failed");
    }
  };

  if (!patient) {
    return (
      <div className="bg-white p-10 rounded-xl shadow text-center">
        Loading patient details...
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-400";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-400";
      case "normal":
        return "bg-green-100 text-green-700 border-green-400";
      default:
        return "bg-gray-100 text-gray-700 border-gray-400";
    }
  };

  return (
    <div className="space-y-8">

      {/* Edit Modals */}
      {editing && (
        <EditPatientModal
          patient={patient}
          onClose={() => setEditing(false)}
          onSave={handleEditSave}
        />
      )}

      {editingField && (
        <TextEditModal
          title={
            editingField === "medicalHistory"
              ? "Edit Medical History"
              : editingField === "notes"
                ? "Edit Patient Notes"
                : "Edit Doctor Instructions"
          }
          value={patient[editingField]}
          onClose={() => setEditingField(null)}
          onSave={handleTextSave}
        />
      )}

      {/* ----------------------- HEADER ----------------------- */}
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-bold text-slate-800">{patient.name}</h2>
            <p className="mt-1 text-slate-500 text-lg">
              Bed <span className="font-semibold text-slate-700">{patient.bed}</span> •{" "}
              Age {patient.age} • {patient.gender} •{" "}
              <span className="font-semibold text-blue-600">{patient.ward}</span>
            </p>
          </div>

          <span
            className={`px-5 py-2 rounded-full font-semibold border text-lg ${getStatusColor(
              patient.status
            )}`}
          >
            {patient.status.toUpperCase()}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setEditing(true)}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-lg font-medium transition"
          >
            Edit Patient
          </button>

          <button
            onClick={handleDelete}
            className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-200 font-medium transition"
          >
            Delete
          </button>
          <button
            onClick={handleViewSummary}
            className="px-6 py-2.5 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 border border-purple-200 font-medium transition"
          >
            View Summary
          </button>

        </div>
      </div>

      {/* ----------------------- VITALS GRID ----------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Heart Rate", value: `${patient.heartRate}`, unit: "bpm", color: "text-red-600" },
          { label: "SpO₂", value: `${patient.spo2}%`, unit: "oxygen", color: "text-blue-600" },
          { label: "Blood Pressure", value: patient.bp, unit: "mmHg", color: "text-purple-600" },
          { label: "Temperature", value: `${patient.temp}°C`, unit: "body temp", color: "text-orange-600" },
        ].map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className={`text-4xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-slate-400">{item.unit}</p>
          </div>
        ))}
      </div>

      {/* ====================== CLINICAL RISK ASSESSMENT ====================== */}
      {!patient ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
          <p className="text-slate-500">Loading patient data...</p>
        </div>
      ) : patient && (
        <div className={`rounded-2xl shadow-sm p-8 border-2 ${
          news2Risk === 'critical' ? 'bg-red-50 border-red-400' :
          news2Risk === 'warning' ? 'bg-yellow-50 border-yellow-400' :
          'bg-green-50 border-green-400'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-800">📊 Clinical Risk Assessment</h3>
            <span className={`px-4 py-2 rounded-full font-bold text-lg ${
              news2Risk === 'critical' ? 'bg-red-600 text-white' :
              news2Risk === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-green-600 text-white'
            }`}>
              {news2Risk === 'critical' ? '🔴 HIGH RISK' :
               news2Risk === 'warning' ? '🟡 MEDIUM RISK' : '🟢 LOW RISK'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">NEWS2 Score</p>
              <p className={`text-3xl font-bold ${
                news2Risk === 'critical' ? 'text-red-600' :
                news2Risk === 'warning' ? 'text-yellow-600' : 'text-green-600'
              }`}>{news2Score}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Heart Rate</p>
              <p className="text-xl font-semibold text-slate-800">{patient.heartRate || '-'} <span className="text-sm">bpm</span></p>
              <p className="text-xs text-slate-400">Score: {hrScore}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">SpO₂</p>
              <p className="text-xl font-semibold text-slate-800">{patient.spo2 || '-'} <span className="text-sm">%</span></p>
              <p className="text-xs text-slate-400">Score: {spo2Score}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Temperature</p>
              <p className="text-xl font-semibold text-slate-800">{patient.temp || '-'} <span className="text-sm">°C</span></p>
              <p className="text-xs text-slate-400">Score: {tempScore}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">BP Systolic</p>
              <p className="text-xl font-semibold text-slate-800">{bpSystolic || '-'} <span className="text-sm">mmHg</span></p>
              <p className="text-xs text-slate-400">Score: {bpScore}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-sm font-semibold text-slate-600 mb-2">Clinical Recommendation:</p>
            <p className="text-lg text-slate-800">{clinicalMessage}</p>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Based on National Early Warning Score 2 (NEWS2) • Updated: {new Date().toLocaleString()}
          </p>
        </div>
      )}

      {/* ----------------------- CHART ----------------------- */}
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">
          Heart Rate & SpO₂ Trend
        </h3>
        <VitalsChart vitals={patient.vitals} />
      </div>

      {/* ==========================================================
                    ⭐ HEALTH SUMMARY (LAST 3 DAYS)
         ========================================================== */}
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200 space-y-6">
        <h3 className="text-2xl font-bold text-slate-800">
          Health Summary (Last 3 Days)
        </h3>

        {summaryLoading && (
          <p className="text-slate-500 text-sm">Loading summary...</p>
        )}

        {!summaryLoading && summary && (
          <>
            {/* TOP ROW: STATUS + ALERTS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-xs text-slate-500 uppercase">Current Status</p>
                <p className="text-2xl font-bold mt-1">{summary.currentStatus.toUpperCase()}</p>
              </div>

              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs text-slate-500 uppercase">Alerts (Last 3 Days)</p>
                <p className="text-2xl font-bold mt-1">{summary.alertsSummary.total}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Critical: {summary.alertsSummary.bySeverity.critical} • Warning:{" "}
                  {summary.alertsSummary.bySeverity.warning}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-xs text-slate-500 uppercase">Time Window</p>
                <p className="text-sm mt-1 text-slate-700">
                  {new Date(summary.timeWindow.from).toLocaleDateString()} →{" "}
                  {new Date(summary.timeWindow.to).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* VITALS SUMMARY GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* HR */}
              {summary.vitalsSummary.heartRate && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-xs text-slate-500 uppercase">Heart Rate (bpm)</p>
                  <p className="text-lg mt-1">Avg: <b>{summary.vitalsSummary.heartRate.avg}</b></p>
                  <p className="text-xs text-slate-500">
                    Min: {summary.vitalsSummary.heartRate.min} • Max:{" "}
                    {summary.vitalsSummary.heartRate.max}
                  </p>
                </div>
              )}

              {/* SpO2 */}
              {summary.vitalsSummary.spo2 && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-xs text-slate-500 uppercase">SpO₂ (%)</p>
                  <p className="text-lg mt-1">Avg: <b>{summary.vitalsSummary.spo2.avg}</b></p>
                  <p className="text-xs text-slate-500">
                    Min: {summary.vitalsSummary.spo2.min} • Max:{" "}
                    {summary.vitalsSummary.spo2.max}
                  </p>
                </div>
              )}

              {/* Temp */}
              {summary.vitalsSummary.temperature && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-xs text-slate-500 uppercase">Temperature (°C)</p>
                  <p className="text-lg mt-1">Avg: <b>{summary.vitalsSummary.temperature.avg}</b></p>
                  <p className="text-xs text-slate-500">
                    Min: {summary.vitalsSummary.temperature.min} • Max:{" "}
                    {summary.vitalsSummary.temperature.max}
                  </p>
                </div>
              )}
            </div>

            {/* DOCTOR NOTES SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                <h4 className="text-lg font-semibold text-slate-800">Doctor Feedback</h4>
                <p className="text-slate-700 mt-2 whitespace-pre-line">
                  {summary.doctorFeedback.instructions || "No doctor instructions yet."}
                </p>
                {summary.doctorFeedback.lastUpdated && (
                  <p className="text-xs text-slate-400 mt-2">
                    Last updated:{" "}
                    {new Date(summary.doctorFeedback.lastUpdated).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                <h4 className="text-lg font-semibold text-slate-800">Notes / Observations</h4>
                <p className="text-slate-700 mt-2 whitespace-pre-line">
                  {summary.doctorFeedback.notes || "No notes added yet."}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ----------------------- ADDITIONAL SECTIONS ----------------------- */}
      {[
        { key: "medicalHistory", title: "Medical History" },
        { key: "notes", title: "Patient Notes" },
        { key: "doctorInstructions", title: "Doctor Instructions" },
      ].map(({ key, title }) => (
        <div
          key={key}
          className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-semibold text-slate-800">{title}</h3>
            <button
              onClick={() => setEditingField(key)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow font-medium transition"
            >
              Edit
            </button>

          </div>
          <p className="text-slate-700 whitespace-pre-line text-lg">
            {patient[key] || "No information available."}
          </p>

        </div>
      ))}

      {/* ====================== CLINICAL SUMMARY MODAL ====================== */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Patient Clinical Summary</h2>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="text-slate-500 hover:text-slate-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              {clinicalSummaryLoading ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">Loading clinical summary...</p>
                </div>
              ) : clinicalSummary ? (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`rounded-xl p-4 ${
                    clinicalSummary.riskLevel === 'critical' ? 'bg-red-50 border-2 border-red-400' :
                    clinicalSummary.riskLevel === 'warning' ? 'bg-yellow-50 border-2 border-yellow-400' :
                    'bg-green-50 border-2 border-green-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Current Status</p>
                        <p className={`text-2xl font-bold ${
                          clinicalSummary.riskLevel === 'critical' ? 'text-red-700' :
                          clinicalSummary.riskLevel === 'warning' ? 'text-yellow-700' :
                          'text-green-700'
                        }`}>
                          {clinicalSummary.status?.toUpperCase() || 'NORMAL'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">NEWS2 Score</p>
                        <p className={`text-3xl font-bold ${
                          clinicalSummary.riskLevel === 'critical' ? 'text-red-700' :
                          clinicalSummary.riskLevel === 'warning' ? 'text-yellow-700' :
                          'text-green-700'
                        }`}>
                          {clinicalSummary.news2Score}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Vitals */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-700 mb-3">Current Vitals</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Heart Rate</p>
                        <p className="font-semibold">{clinicalSummary.vitals.heartRate || '-'} bpm</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">SpO₂</p>
                        <p className="font-semibold">{clinicalSummary.vitals.spo2 || '-'}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Temperature</p>
                        <p className="font-semibold">{clinicalSummary.vitals.temperature || '-'}°C</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Blood Pressure</p>
                        <p className="font-semibold">{clinicalSummary.vitals.bloodPressure || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Observations */}
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3">Key Observations</h3>
                    {clinicalSummary.observations && clinicalSummary.observations.length > 0 ? (
                      <ul className="space-y-2">
                        {clinicalSummary.observations.map((obs, idx) => (
                          <li key={idx} className={`flex items-start gap-2 ${
                            obs.type === 'critical' ? 'text-red-700' : 'text-yellow-700'
                          }`}>
                            <span className="mt-1">•</span>
                            <span>{obs.message}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500">No abnormal observations</p>
                    )}
                  </div>

                  {/* Recommendation */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Clinical Recommendation</h3>
                    <p className="text-blue-900">{clinicalSummary.recommendation}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">No clinical summary available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;
