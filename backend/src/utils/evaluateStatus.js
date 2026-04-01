module.exports = function evaluateStatus(vitals, settings = {}) {
  if (!vitals) return "normal";

  const { heartRate, spo2, bp, temp } = vitals;

  // Load safe default thresholds if settings missing
  const hrLow = Number(settings.heartRateLow) || 50;
  const hrHigh = Number(settings.heartRateHigh) || 120;
  const spo2Low = Number(settings.spo2Low) || 92;
  const tempHigh = Number(settings.tempHigh) || 38.5;
  const sysHigh = Number(settings.bpSystolicHigh) || 150;
  const diaHigh = Number(settings.bpDiastolicHigh) || 100;

  // --- Parse BP safely ---
  let systolic = null, diastolic = null;
  if (bp && typeof bp === "string" && bp.includes("/")) {
    const parts = bp.split("/");
    systolic = Number(parts[0]);
    diastolic = Number(parts[1]);
  }

  let critical = false;
  let warning = false;

  /* -------------------------
     CRITICAL CONDITIONS
  ------------------------- */
  if (heartRate >= hrHigh || heartRate <= hrLow) critical = true;
  if (spo2 <= spo2Low) critical = true;
  if (temp >= tempHigh) critical = true;
  if (systolic >= sysHigh || diastolic >= diaHigh) critical = true;

  /* -------------------------
     WARNING CONDITIONS
  ------------------------- */
  if (heartRate >= hrHigh - 10 || heartRate <= hrLow + 10) warning = true;
  if (spo2 <= spo2Low + 2) warning = true;
  if (temp >= tempHigh - 0.3) warning = true;

  if (critical) return "critical";
  if (warning) return "warning";

  return "normal";
};
