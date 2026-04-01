const Patient = require('../models/Patient');
const Alert = require('../models/Alert');
const Settings = require('../models/Settings');

async function getCurrentSettings() {
  let s = await Settings.findOne();
  if (!s) {
    // create default settings if none exist
    s = await Settings.create({});
  }
  return s;
}

async function analyzeAndAlert(patientId, vitals) {
  const settings = await getCurrentSettings();

  let severity = 'normal';
  const reasons = [];

  // ---- threshold checks ----
  if (vitals.heartRate != null) {
    if (vitals.heartRate > settings.heartRateHigh) {
      reasons.push(`Heart rate high: ${vitals.heartRate} bpm`);
    } else if (vitals.heartRate < settings.heartRateLow) {
      reasons.push(`Heart rate low: ${vitals.heartRate} bpm`);
    }
  }

  if (vitals.spo2 != null && vitals.spo2 < settings.spo2Low) {
    reasons.push(`SpO₂ low: ${vitals.spo2}%`);
  }

  if (
    (vitals.bpSystolic != null && vitals.bpSystolic > settings.bpSystolicHigh) ||
    (vitals.bpDiastolic != null && vitals.bpDiastolic > settings.bpDiastolicHigh)
  ) {
    reasons.push(
      `BP high: ${vitals.bpSystolic || '?'} / ${vitals.bpDiastolic || '?'}`
    );
  }

  if (vitals.temp != null && vitals.temp > settings.tempHigh) {
    reasons.push(`Temp high: ${vitals.temp}°C`);
  }

  if (reasons.length > 0) {
    severity = 'warning';
  }

  // escalate to CRITICAL if multiple problems or SpO₂ very low
  if (reasons.length >= 2 || (vitals.spo2 != null && vitals.spo2 < settings.spo2Low - 5)) {
    severity = 'critical';
  }

  // ---- update patient ----
  const patient = await Patient.findById(patientId);
  if (!patient) return null;

  patient.heartRate = vitals.heartRate ?? patient.heartRate;
  patient.spo2 = vitals.spo2 ?? patient.spo2;
  if (vitals.bpSystolic != null && vitals.bpDiastolic != null) {
    patient.bp = `${vitals.bpSystolic}/${vitals.bpDiastolic}`;
  }
  patient.temp = vitals.temp ?? patient.temp;
  patient.status = severity;

  // keep history
  patient.vitals.push(vitals);
  await patient.save();

  // ---- no alert if normal ----
  if (severity === 'normal') return null;

  const alert = await Alert.create({
    patient: patient._id,
    patientName: patient.name,
    severity,
    message: reasons.join('; '),
    vitalsSnapshot: {
      heartRate: vitals.heartRate,
      spo2: vitals.spo2,
      bpSystolic: vitals.bpSystolic,
      bpDiastolic: vitals.bpDiastolic,
      temp: vitals.temp,
    },
  });

  return alert;
}

module.exports = { analyzeAndAlert };
