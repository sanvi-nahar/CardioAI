const asyncHandler = require("express-async-handler");
const Patient = require("../models/Patient");
const Settings = require("../models/Settings");
const Alert = require("../models/Alert");
const { evaluatePatientStatus } = require("../services/patientStatusService");
const { generateClinicalSummary } = require("../services/patientSummaryService");

/* -------------------------
   CREATE PATIENT
------------------------- */
const createPatient = asyncHandler(async (req, res) => {
  const {
    name,
    age,
    gender,
    phone,
    address,
    bed,
    ward,
    heartRate,
    spo2,
    bloodPressure,
    temperature,
    medicalHistory,
  } = req.body;

  const contact = phone;
  const bp = bloodPressure || "";
  const temp = temperature;

  // Parse BP safely
  let bpSystolic = null,
    bpDiastolic = null;

  if (bp && typeof bp === "string" && bp.includes("/")) {
    const parts = bp.split("/");
    bpSystolic = Number(parts[0]);
    bpDiastolic = Number(parts[1]);
  }

  // Fetch settings (safe even if null)
  const settings = (await Settings.findOne()) || {};

  // SAFE STATUS EVALUATION using single source of truth
  let status = "normal";
  let healthScore = 100;
  try {
    const result = evaluatePatientStatus(
      { heartRate, spo2, bp, temp },
      settings
    );
    status = result.status;
    healthScore = result.healthScore;
  } catch (err) {
    console.warn("Error in evaluatePatientStatus:", err);
  }

  const patient = await Patient.create({
    name,
    age,
    gender,
    contact,
    address,
    bed,
    ward,
    status,
    healthScore,
    heartRate,
    spo2,
    bp,
    temp,
    medicalHistory,
    vitals: [
      {
        timestamp: new Date(),
        heartRate,
        spo2,
        bpSystolic,
        bpDiastolic,
        temp,
      },
    ],
  });

  res.status(201).json(patient);
});

/* -------------------------
   LIST PATIENTS (with pagination)
------------------------- */
const getPatients = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.ward) query.ward = req.query.ward;
  if (req.query.status) query.status = req.query.status;

  if (req.query.search) {
    const s = req.query.search;
    query.$or = [
      { name: new RegExp(s, "i") },
      { bed: new RegExp(s, "i") },
      { deviceId: new RegExp(s, "i") },
    ];
  }

  const [patients, totalRecords] = await Promise.all([
    Patient.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Patient.countDocuments(query)
  ]);

  res.json({
    data: patients,
    page,
    totalPages: Math.ceil(totalRecords / limit),
    totalRecords
  });
});

/* -------------------------
   ADD VITALS (LIVE UPDATE)
------------------------- */
const addVitals = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const vitals = req.body;

  // Push to history
  patient.vitals.push(vitals);

  // Update latest vitals
  patient.heartRate = vitals.heartRate ?? patient.heartRate;
  patient.spo2 = vitals.spo2 ?? patient.spo2;
  patient.temp = vitals.temp ?? patient.temp;
  if (vitals.bp) patient.bp = vitals.bp;

  const settings = (await Settings.findOne()) || {};

  // SAFE status evaluation using single source of truth
  let newStatus = patient.status;
  let healthScore = patient.healthScore || 100;
  try {
    const result = evaluatePatientStatus(
      {
        heartRate: patient.heartRate,
        spo2: patient.spo2,
        bp: patient.bp,
        temp: patient.temp,
      },
      settings
    );
    newStatus = result.status;
    healthScore = result.healthScore;
  } catch (err) {
    console.warn("evaluatePatientStatus error:", err);
  }

  const previousStatus = patient.status;
  patient.status = newStatus;
  patient.healthScore = healthScore;

  // Emit socket event for vitals update with full patient data
  // Patient will be saved after alert creation
  const io = req.app.get("io");
  io.emit("vitals-updated", {
    patientId: patient._id,
    patient: {
      _id: patient._id,
      name: patient.name,
      bed: patient.bed,
      ward: patient.ward,
      status: newStatus,
      healthScore: patient.healthScore,
      heartRate: patient.heartRate,
      spo2: patient.spo2,
      bp: patient.bp,
      temp: patient.temp,
      vitals: patient.vitals.slice(-50)
    }
  });

  // Emit status change event
  if (previousStatus !== newStatus) {
    io.emit("patient-status-changed", {
      patientId: patient._id,
      previousStatus,
      newStatus,
      patientName: patient.name,
      healthScore: patient.healthScore,
    });
  }

  // Create alert if status not normal
  let createdAlert = null;
  if (newStatus !== "normal") {
    try {
      createdAlert = await Alert.create({
        patient: patient._id,
        patientName: patient.name,
        severity: newStatus,
        message:
          newStatus === "critical"
            ? "Critical condition detected"
            : "Warning: Abnormal vitals",
        vitalsSnapshot: {
          heartRate: patient.heartRate,
          spo2: patient.spo2,
          bp: patient.bp,
          temp: patient.temp,
        },
        createdAt: new Date(),
      });

      createdAlert = await createdAlert.populate(
        "patient",
        "name bed ward age gender status heartRate spo2 bp temp"
      );

      io.emit("new-alert", createdAlert);
    } catch (alertErr) {
      console.warn("Alert creation failed:", alertErr);
    }
  }

  await patient.save();

  res.json({
    message: "Vitals updated",
    status: newStatus,
    alert: createdAlert,
  });
});

/* -------------------------
   GET PATIENT
------------------------- */
const getPatientById = asyncHandler(async (req, res) => {
  const p = await Patient.findById(req.params.id);
  if (!p) {
    res.status(404);
    throw new Error("Patient not found");
  }
  res.json(p);
});

/* -------------------------
   UPDATE PATIENT MANUALLY
------------------------- */
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const updates = req.body;

  // Update basic fields safely
  Object.assign(patient, {
    name: updates.name ?? patient.name,
    age: updates.age ?? patient.age,
    gender: updates.gender ?? patient.gender,
    contact: updates.phone ?? patient.contact,
    address: updates.address ?? patient.address,
    bed: updates.bed ?? patient.bed,
    ward: updates.ward ?? patient.ward,
    medicalHistory: updates.medicalHistory ?? patient.medicalHistory,
    notes: updates.notes ?? patient.notes,
    doctorInstructions:
      updates.doctorInstructions ?? patient.doctorInstructions,
  });

  // Update vitals safely
  if (updates.heartRate) patient.heartRate = updates.heartRate;
  if (updates.spo2) patient.spo2 = updates.spo2;
  if (updates.bloodPressure) patient.bp = updates.bloodPressure;
  if (updates.temperature) patient.temp = updates.temperature;

  // Recalculate status safely using single source of truth
  const settings = (await Settings.findOne()) || {};
  try {
    const result = evaluatePatientStatus(
      {
        heartRate: patient.heartRate,
        spo2: patient.spo2,
        bp: patient.bp,
        temp: patient.temp,
      },
      settings
    );
    patient.status = result.status;
    patient.healthScore = result.healthScore;
  } catch (err) {
    console.warn("evaluatePatientStatus error:", err);
  }

  await patient.save();
  res.json(patient);
});

/* -------------------------
   DELETE PATIENT
------------------------- */
const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  await Patient.findByIdAndDelete(req.params.id);
  res.json({ message: "Patient removed" });
});


// Summary of patients 
const getPatientSummary = asyncHandler(async (req, res) => {
  const patientId = req.params.id;

  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  // last 3 days window
  const now = new Date();
  const since = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Filter vitals within time window
  const recentVitals = (patient.vitals || []).filter(
    (v) => v.timestamp && new Date(v.timestamp) >= since
  );

  // Helper to compute min/max/avg/latest
  const computeStats = (arr, key) => {
    if (!arr.length) return null;

    const values = arr
      .map((v) => Number(v[key]))
      .filter((n) => !Number.isNaN(n));

    if (!values.length) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: Number(avg.toFixed(1)),
      latest: values[values.length - 1],
    };
  };

  const hrStats = computeStats(recentVitals, "heartRate");
  const spo2Stats = computeStats(recentVitals, "spo2");
  const tempStats = computeStats(recentVitals, "temp");

  const alerts = await Alert.find({
    patient: patientId,
    createdAt: { $gte: since },
  }).sort({ createdAt: -1 });

  const totalAlerts = alerts.length;
  const bySeverity = alerts.reduce(
    (acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    },
    { critical: 0, warning: 0, normal: 0 }
  );

  const clinicalSummary = generateClinicalSummary({
    heartRate: patient.heartRate,
    spo2: patient.spo2,
    temp: patient.temp,
    bp: patient.bp,
    status: patient.status
  });

  res.json({
    timeWindow: {
      from: since,
      to: now,
    },
    currentStatus: patient.status,
    vitalsSummary: {
      heartRate: hrStats,
      spo2: spo2Stats,
      temperature: tempStats,
      latestBP: patient.bp || null,
    },
    alertsSummary: {
      total: totalAlerts,
      bySeverity,
      recentAlerts: alerts.slice(0, 5).map((a) => ({
        id: a._id,
        severity: a.severity,
        message: a.message,
        createdAt: a.createdAt,
      })),
    },
    clinicalSummary: clinicalSummary,
    doctorFeedback: {
      notes: patient.notes || "",
      instructions: patient.doctorInstructions || "",
      lastUpdated: patient.updatedAt,
    },
  });
});



/* -------------------------
   EXPORTS
------------------------- */
module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  addVitals,
  deletePatient,
  updatePatient,
  getPatientSummary,
};
