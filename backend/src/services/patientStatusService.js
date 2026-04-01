/**
 * Patient Status Service
 * 
 * Single Source of Truth for patient status calculation.
 * This service should be used by ALL controllers, simulators, and services
 * that need to evaluate patient status from vitals.
 * 
 * Provides:
 * - Status evaluation (normal/warning/critical) using NEWS2
 * - Health score calculation
 * - Custom threshold support via settings
 */

const { calculateNews2 } = require("./news2Service");

const DEFAULT_THRESHOLDS = {
  heartRateLow: 50,
  heartRateHigh: 120,
  spo2Low: 92,
  tempHigh: 38.5,
  bpSystolicHigh: 150,
  bpDiastolicHigh: 100
};

function parseBP(bp) {
  if (!bp || typeof bp !== 'string') {
    return { systolic: null, diastolic: null };
  }
  
  const parts = bp.split('/');
  if (parts.length !== 2) {
    return { systolic: null, diastolic: null };
  }
  
  return {
    systolic: Number(parts[0]),
    diastolic: Number(parts[1])
  };
}

function calculateHealthScore(vitals) {
  const { heartRate, spo2, bpSystolic, bpDiastolic, temp } = vitals;
  
  let score = 100;
  
  if (heartRate !== undefined && heartRate !== null) {
    if (heartRate > 100) {
      score -= Math.min(30, (heartRate - 100) * 0.5);
    } else if (heartRate < 60) {
      score -= Math.min(30, (60 - heartRate) * 0.5);
    }
  }
  
  if (spo2 !== undefined && spo2 !== null) {
    if (spo2 < 95) {
      score -= Math.min(40, (95 - spo2) * 5);
    }
  }
  
  if (bpSystolic !== undefined && bpSystolic !== null) {
    if (bpSystolic > 140) {
      score -= Math.min(20, (bpSystolic - 140) * 0.5);
    } else if (bpSystolic < 100) {
      score -= Math.min(20, (100 - bpSystolic) * 0.5);
    }
  }
  
  if (bpDiastolic !== undefined && bpDiastolic !== null) {
    if (bpDiastolic > 90) {
      score -= Math.min(10, (bpDiastolic - 90) * 0.5);
    } else if (bpDiastolic < 60) {
      score -= Math.min(10, (60 - bpDiastolic) * 0.5);
    }
  }
  
  if (temp !== undefined && temp !== null) {
    if (temp > 37.5) {
      score -= Math.min(15, (temp - 37.5) * 5);
    } else if (temp < 36.5) {
      score -= Math.min(15, (36.5 - temp) * 5);
    }
  }
  
  return Math.max(0, Math.round(score));
}

function evaluatePatientStatus(vitals, settings = {}) {
  if (!vitals) {
    return { status: 'normal', healthScore: 100, message: null, news2: null };
  }

  const news2Result = calculateNews2(vitals);
  const news2Status = news2Result.riskLevel;

  const thresholds = {
    ...DEFAULT_THRESHOLDS,
    heartRateLow: Number(settings.heartRateLow) || DEFAULT_THRESHOLDS.heartRateLow,
    heartRateHigh: Number(settings.heartRateHigh) || DEFAULT_THRESHOLDS.heartRateHigh,
    spo2Low: Number(settings.spo2Low) || DEFAULT_THRESHOLDS.spo2Low,
    tempHigh: Number(settings.tempHigh) || DEFAULT_THRESHOLDS.tempHigh,
    bpSystolicHigh: Number(settings.bpSystolicHigh) || DEFAULT_THRESHOLDS.bpSystolicHigh,
    bpDiastolicHigh: Number(settings.bpDiastolicHigh) || DEFAULT_THRESHOLDS.bpDiastolicHigh
  };

  const { heartRate, spo2, temp } = vitals;
  const { systolic: bpSystolic, diastolic: bpDiastolic } = parseBP(vitals.bp);

  let message = null;
  if (news2Status === "critical") {
    message = `NEWS2 score critical (score: ${news2Result.score})`;
  } else if (news2Status === "warning") {
    message = `NEWS2 score elevated (score: ${news2Result.score})`;
  }

  const healthScore = calculateHealthScore({
    heartRate,
    spo2,
    bpSystolic,
    bpDiastolic,
    temp
  });

  return {
    status: news2Status,
    healthScore,
    message,
    news2: news2Result
  };
}

function evaluateVitals(vitals, settings = {}) {
  return evaluatePatientStatus(vitals, settings);
}

module.exports = {
  evaluatePatientStatus,
  evaluateVitals,
  calculateHealthScore,
  DEFAULT_THRESHOLDS
};
