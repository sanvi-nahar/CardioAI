/**
 * Patient Clinical Summary Service
 * 
 * Analyzes patient vitals and generates clinical observations
 * and recommendations based on NEWS2 scoring system.
 */

const { calculateNews2, getRiskLevel, getClinicalMessage } = require("./news2Service");

function analyzeHeartRate(heartRate) {
  if (heartRate === undefined || heartRate === null) return null;
  
  const observations = [];
  
  if (heartRate < 40) {
    observations.push({
      type: 'critical',
      message: `Severe bradycardia (${heartRate} bpm)`
    });
  } else if (heartRate <= 50) {
    observations.push({
      type: 'warning',
      message: `Low heart rate (${heartRate} bpm)`
    });
  } else if (heartRate > 130) {
    observations.push({
      type: 'critical',
      message: `Severe tachycardia (${heartRate} bpm)`
    });
  } else if (heartRate > 110) {
    observations.push({
      type: 'warning',
      message: `Elevated heart rate (${heartRate} bpm)`
    });
  }
  
  return observations;
}

function analyzeSpO2(spo2) {
  if (spo2 === undefined || spo2 === null) return null;
  
  const observations = [];
  
  if (spo2 <= 85) {
    observations.push({
      type: 'critical',
      message: `Critical hypoxemia (SpO₂ ${spo2}%)`
    });
  } else if (spo2 <= 91) {
    observations.push({
      type: 'critical',
      message: `Low oxygen saturation (SpO₂ ${spo2}%)`
    });
  } else if (spo2 <= 95) {
    observations.push({
      type: 'warning',
      message: `Slightly low oxygen saturation (SpO₂ ${spo2}%)`
    });
  }
  
  return observations;
}

function analyzeTemperature(temp) {
  if (temp === undefined || temp === null) return null;
  
  const observations = [];
  
  if (temp < 35) {
    observations.push({
      type: 'critical',
      message: `Hypothermia (${temp}°C)`
    });
  } else if (temp >= 39.1) {
    observations.push({
      type: 'critical',
      message: `High fever (${temp}°C)`
    });
  } else if (temp >= 38.1) {
    observations.push({
      type: 'warning',
      message: `Elevated temperature (${temp}°C)`
    });
  } else if (temp < 36) {
    observations.push({
      type: 'warning',
      message: `Slightly low temperature (${temp}°C)`
    });
  }
  
  return observations;
}

function analyzeBloodPressure(bpString) {
  if (!bpString || typeof bpString !== 'string') return null;
  
  const observations = [];
  const parts = bpString.split('/');
  
  if (parts.length !== 2) return null;
  
  const systolic = parseInt(parts[0], 10);
  const diastolic = parseInt(parts[1], 10);
  
  if (isNaN(systolic) || isNaN(diastolic)) return null;
  
  if (systolic <= 90) {
    observations.push({
      type: 'critical',
      message: `Severe hypotension (${bpString} mmHg)`
    });
  } else if (systolic <= 100) {
    observations.push({
      type: 'warning',
      message: `Low blood pressure (${bpString} mmHg)`
    });
  } else if (systolic >= 180) {
    observations.push({
      type: 'critical',
      message: `Severe hypertension (${bpString} mmHg)`
    });
  } else if (systolic >= 150) {
    observations.push({
      type: 'warning',
      message: `High blood pressure (${bpString} mmHg)`
    });
  }
  
  if (diastolic >= 110) {
    observations.push({
      type: 'critical',
      message: `Severe diastolic hypertension (${diastolic} mmHg)`
    });
  } else if (diastolic >= 95) {
    observations.push({
      type: 'warning',
      message: `Elevated diastolic pressure (${diastolic} mmHg)`
    });
  }
  
  return observations;
}

function generateRecommendation(status, news2Score, observations) {
  const criticalCount = observations.filter(o => o.type === 'critical').length;
  const warningCount = observations.filter(o => o.type === 'warning').length;
  
  if (status === 'critical' || news2Score >= 7) {
    return "Immediate medical attention required. Consider urgent review, oxygen supplementation, and continuous monitoring. Escalate to senior clinician immediately.";
  }
  
  if (status === 'warning' || news2Score >= 5) {
    return "Increased observation frequency recommended. Junior doctor review within 1 hour. Consider additional investigations and prepare for potential escalation.";
  }
  
  if (warningCount > 0) {
    return "Continue routine monitoring. Monitor vitals every 4-6 hours. Notify nursing staff of any changes in condition.";
  }
  
  return "Patient is stable. Continue routine monitoring. No immediate action required.";
}

function generateClinicalSummary(patient) {
  const { heartRate, spo2, temp, bp, status: patientStatus } = patient;
  
  const allObservations = [];
  
  const hrObservations = analyzeHeartRate(heartRate);
  if (hrObservations) allObservations.push(...hrObservations);
  
  const spo2Observations = analyzeSpO2(spo2);
  if (spo2Observations) allObservations.push(...spo2Observations);
  
  const tempObservations = analyzeTemperature(temp);
  if (tempObservations) allObservations.push(...tempObservations);
  
  const bpObservations = analyzeBloodPressure(bp);
  if (bpObservations) allObservations.push(...bpObservations);
  
  let systolic = null;
  if (bp && bp.includes('/')) {
    systolic = parseInt(bp.split('/')[0], 10);
  }
  
  const vitalsForNews2 = {
    heartRate,
    spo2,
    temp,
    bpSystolic: systolic
  };
  
  const news2Result = calculateNews2(vitalsForNews2);
  
  const status = patientStatus || news2Result.riskLevel;
  
  const recommendation = generateRecommendation(
    status,
    news2Result.score,
    allObservations
  );
  
  return {
    status,
    news2Score: news2Result.score,
    riskLevel: news2Result.riskLevel,
    observations: allObservations,
    recommendation,
    vitals: {
      heartRate,
      spo2,
      temperature: temp,
      bloodPressure: bp
    }
  };
}

module.exports = {
  generateClinicalSummary,
  analyzeHeartRate,
  analyzeSpO2,
  analyzeTemperature,
  analyzeBloodPressure,
  generateRecommendation
};
