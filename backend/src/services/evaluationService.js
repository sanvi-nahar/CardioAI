function evaluateVitals({ heartRate, spo2, bpSystolic, bpDiastolic, temp }) {
  let status = "normal";
  let message = null;

  // Critical conditions
  if (spo2 < 92) {
    status = "critical";
    message = "Critical oxygen saturation detected";
  }
  else if (heartRate > 130 || heartRate < 45) {
    status = "critical";
    message = "Severe heart rate abnormality detected";
  }
  else if (bpSystolic > 160 || bpDiastolic > 100) {
    status = "critical";
    message = "Critical blood pressure detected";
  }

  // Warning conditions (only if not already critical)
  else if (spo2 < 95) {
    status = "warning";
    message = "Slight oxygen level drop detected";
  }
  else if (heartRate > 100 || heartRate < 55) {
    status = "warning";
    message = "Elevated heart rate detected";
  }
  else if (temp > 37.8) {
    status = "warning";
    message = "Elevated body temperature detected";
  }

  // Health Score Calculation (0-100)
  let score = 100;

  if (heartRate > 100) score -= Math.min(30, (heartRate - 100) * 0.5);
  else if (heartRate < 60) score -= Math.min(30, (60 - heartRate) * 0.5);

  if (spo2 < 95) score -= Math.min(40, (95 - spo2) * 5);

  if (bpSystolic > 140) score -= Math.min(20, (bpSystolic - 140) * 0.5);
  else if (bpSystolic < 100) score -= Math.min(20, (100 - bpSystolic) * 0.5);

  if (bpDiastolic > 90) score -= Math.min(10, (bpDiastolic - 90) * 0.5);
  else if (bpDiastolic < 60) score -= Math.min(10, (60 - bpDiastolic) * 0.5);

  if (temp > 37.5) score -= Math.min(15, (temp - 37.5) * 5);
  else if (temp < 36.5) score -= Math.min(15, (36.5 - temp) * 5);

  score = Math.max(0, Math.round(score));

  return { status, message, healthScore: score };
}

module.exports = evaluateVitals;