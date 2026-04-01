/**
 * NEWS2 Service
 * 
 * National Early Warning Score 2 (NEWS2) implementation
 * 
 * NEWS2 is a standardized scoring system used in UK NHS for detecting
 * deteriorating patients based on physiological measurements.
 * 
 * Score ranges:
 * - 0-4: Low risk (normal)
 * - 5-6: Low-medium risk (warning)
 * - 7+: High risk (critical)
 */

function calculateHeartRateScore(heartRate) {
  if (heartRate === undefined || heartRate === null) return 0;
  if (heartRate <= 40) return 3;
  if (heartRate <= 50) return 1;
  if (heartRate <= 90) return 0;
  if (heartRate <= 110) return 1;
  if (heartRate <= 130) return 2;
  return 3;
}

function calculateSpo2Score(spo2) {
  if (spo2 === undefined || spo2 === null) return 0;
  if (spo2 >= 96) return 0;
  if (spo2 >= 94) return 1;
  if (spo2 >= 92) return 2;
  return 3;
}

function calculateTempScore(temp) {
  if (temp === undefined || temp === null) return 0;
  if (temp <= 35) return 3;
  if (temp <= 36) return 1;
  if (temp <= 38) return 0;
  if (temp <= 39) return 1;
  return 2;
}

function calculateBpScore(bpSystolic) {
  if (bpSystolic === undefined || bpSystolic === null) return 0;
  if (bpSystolic <= 90) return 3;
  if (bpSystolic <= 100) return 2;
  if (bpSystolic <= 110) return 1;
  if (bpSystolic <= 219) return 0;
  return 3;
}

function getRiskLevel(score) {
  if (score >= 7) return "critical";
  if (score >= 5) return "warning";
  return "normal";
}

function getClinicalMessage(score, riskLevel) {
  if (riskLevel === "critical") {
    return "Immediate clinical attention required. Consider urgent review and escalation.";
  }
  if (riskLevel === "warning") {
    return "Increased observation frequency recommended. Junior doctor review within 1 hour.";
  }
  return "Continue routine monitoring. No immediate action required.";
}

function calculateNews2(vitals) {
  const { heartRate, spo2, temp, bpSystolic } = vitals;

  const hrScore = calculateHeartRateScore(heartRate);
  const spo2Score = calculateSpo2Score(spo2);
  const tempScore = calculateTempScore(temp);
  const bpScore = calculateBpScore(bpSystolic);

  const totalScore = hrScore + spo2Score + tempScore + bpScore;
  const riskLevel = getRiskLevel(totalScore);
  const clinicalMessage = getClinicalMessage(totalScore, riskLevel);

  return {
    score: totalScore,
    riskLevel,
    clinicalMessage,
    breakdown: {
      heartRate: { value: heartRate, score: hrScore },
      spo2: { value: spo2, score: spo2Score },
      temperature: { value: temp, score: tempScore },
      bpSystolic: { value: bpSystolic, score: bpScore }
    }
  };
}

function getRiskLabel(riskLevel) {
  const labels = {
    normal: "LOW RISK",
    warning: "MEDIUM RISK",
    critical: "HIGH RISK"
  };
  return labels[riskLevel] || "UNKNOWN";
}

module.exports = {
  calculateNews2,
  calculateHeartRateScore,
  calculateSpo2Score,
  calculateTempScore,
  calculateBpScore,
  getRiskLevel,
  getClinicalMessage,
  getRiskLabel
};
