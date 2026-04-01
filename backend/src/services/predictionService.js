/**
 * AI Prediction Service
 * Analyzes historical vital readings to predict potential critical conditions
 * 
 * Algorithm:
 * 1. Analyzes last 20 vital readings
 * 2. Detects trends:
 *    - dropping SpO2
 *    - rising heart rate
 *    - increasing temperature
 *    - abnormal blood pressure patterns
 * 3. Outputs prediction: normal | warning | critical risk
 */

const WARNING_THRESHOLDS = {
  spo2DropRate: 2,           // SpO2 dropping more than 2% per reading
  heartRateIncreaseRate: 5,  // HR increasing more than 5 bpm per reading
  tempIncreaseRate: 0.3,     // Temp increasing more than 0.3°C per reading
  lowSpo2: 92,               // Warning SpO2 level
  highHeartRate: 100,        // Warning HR level
  highTemp: 38,              // Warning temperature
};

const CRITICAL_THRESHOLDS = {
  spo2Critical: 88,          // Critical SpO2 level
  heartRateCritical: 120,    // Critical HR level
  tempCritical: 39.5,       // Critical temperature
  rapidDeterioration: 3,    // Number of consecutive deteriorating readings
};

const calculateTrend = (values) => {
  if (!values || values.length < 2) return null;
  
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
};

const analyzeSpo2Trend = (vitals) => {
  const spo2Values = vitals.map(v => v.spo2).filter(v => v != null);
  if (spo2Values.length < 3) return { trend: 'stable', warning: false };
  
  const slope = calculateTrend(spo2Values);
  const latestSpo2 = spo2Values[spo2Values.length - 1];
  
  // Check for critical SpO2
  if (latestSpo2 <= CRITICAL_THRESHOLDS.spo2Critical) {
    return { trend: 'critical', warning: true, message: `Critical SpO2 level: ${latestSpo2}%` };
  }
  
  // Check for warning SpO2
  if (latestSpo2 <= WARNING_THRESHOLDS.lowSpo2) {
    return { trend: 'dropping', warning: true, message: `Low SpO2 level: ${latestSpo2}%` };
  }
  
  // Check for downward trend
  if (slope < -WARNING_THRESHOLDS.spo2DropRate) {
    return { trend: 'dropping', warning: true, message: 'SpO2 showing downward trend' };
  }
  
  return { trend: 'stable', warning: false };
};

const analyzeHeartRateTrend = (vitals) => {
  const hrValues = vitals.map(v => v.heartRate).filter(v => v != null);
  if (hrValues.length < 3) return { trend: 'stable', warning: false };
  
  const slope = calculateTrend(hrValues);
  const latestHR = hrValues[hrValues.length - 1];
  
  // Check for critical HR
  if (latestHR >= CRITICAL_THRESHOLDS.heartRateCritical) {
    return { trend: 'critical', warning: true, message: `Critical heart rate: ${latestHR} bpm` };
  }
  
  // Check for warning HR
  if (latestHR >= WARNING_THRESHOLDS.highHeartRate) {
    return { trend: 'rising', warning: true, message: `Elevated heart rate: ${latestHR} bpm` };
  }
  
  // Check for upward trend
  if (slope > WARNING_THRESHOLDS.heartRateIncreaseRate) {
    return { trend: 'rising', warning: true, message: 'Heart rate showing upward trend' };
  }
  
  return { trend: 'stable', warning: false };
};

const analyzeTemperatureTrend = (vitals) => {
  const tempValues = vitals.map(v => v.temp).filter(v => v != null);
  if (tempValues.length < 3) return { trend: 'stable', warning: false };
  
  const slope = calculateTrend(tempValues);
  const latestTemp = tempValues[tempValues.length - 1];
  
  // Check for critical temperature
  if (latestTemp >= CRITICAL_THRESHOLDS.tempCritical) {
    return { trend: 'critical', warning: true, message: `Critical temperature: ${latestTemp}°C` };
  }
  
  // Check for warning temperature
  if (latestTemp >= WARNING_THRESHOLDS.highTemp) {
    return { trend: 'rising', warning: true, message: `Elevated temperature: ${latestTemp}°C` };
  }
  
  // Check for upward trend
  if (slope > WARNING_THRESHOLDS.tempIncreaseRate) {
    return { trend: 'rising', warning: true, message: 'Temperature showing upward trend' };
  }
  
  return { trend: 'stable', warning: false };
};

const analyzeBloodPressureTrend = (vitals) => {
  const bpValues = vitals
    .map(v => v.bpSystolic)
    .filter(v => v != null && !isNaN(v));
  
  if (bpValues.length < 3) return { trend: 'stable', warning: false };
  
  const slope = calculateTrend(bpValues);
  const latestBP = bpValues[bpValues.length - 1];
  
  // Check for critical high BP
  if (latestBP >= 180) {
    return { trend: 'critical', warning: true, message: `Critical BP: ${latestBP} mmHg` };
  }
  
  // Check for warning high BP
  if (latestBP >= 140) {
    return { trend: 'rising', warning: true, message: `Elevated BP: ${latestBP} mmHg` };
  }
  
  // Check for rapid rise
  if (slope > 10) {
    return { trend: 'rising', warning: true, message: 'Blood pressure showing rapid rise' };
  }
  
  return { trend: 'stable', warning: false };
};

const countDeterioratingReadings = (vitals) => {
  let count = 0;
  const n = vitals.length;
  
  for (let i = Math.max(0, n - CRITICAL_THRESHOLDS.rapidDeterioration); i < n - 1; i++) {
    const current = vitals[i];
    const next = vitals[i + 1];
    
    // Check for deterioration indicators
    const hrWorsening = next.heartRate > current.heartRate + 10;
    const spo2Worsening = next.spo2 < current.spo2 - 3;
    const tempWorsening = next.temp > current.temp + 0.5;
    
    if (hrWorsening || spo2Worsening || tempWorsening) {
      count++;
    }
  }
  
  return count;
};

const predictPatientCondition = (vitals) => {
  if (!vitals || vitals.length < 5) {
    return {
      prediction: 'insufficient_data',
      confidence: 0,
      message: 'Not enough vital data for prediction',
      trends: {}
    };
  }

  // Get last 20 readings (or fewer if not available)
  const recentVitals = vitals.slice(-20);
  
  // Analyze each vital parameter
  const spo2Analysis = analyzeSpo2Trend(recentVitals);
  const hrAnalysis = analyzeHeartRateTrend(recentVitals);
  const tempAnalysis = analyzeTemperatureTrend(recentVitals);
  const bpAnalysis = analyzeBloodPressureTrend(recentVitals);
  
  // Count deteriorating readings
  const deterioratingCount = countDeterioratingReadings(recentVitals);
  
  // Calculate overall prediction
  let criticalScore = 0;
  let warningScore = 0;
  const warnings = [];
  
  if (spo2Analysis.warning) {
    if (spo2Analysis.trend === 'critical') {
      criticalScore += 3;
      warnings.push(spo2Analysis.message);
    } else {
      warningScore += 2;
      warnings.push(spo2Analysis.message);
    }
  }
  
  if (hrAnalysis.warning) {
    if (hrAnalysis.trend === 'critical') {
      criticalScore += 3;
      warnings.push(hrAnalysis.message);
    } else {
      warningScore += 2;
      warnings.push(hrAnalysis.message);
    }
  }
  
  if (tempAnalysis.warning) {
    if (tempAnalysis.trend === 'critical') {
      criticalScore += 3;
      warnings.push(tempAnalysis.message);
    } else {
      warningScore += 2;
      warnings.push(tempAnalysis.message);
    }
  }
  
  if (bpAnalysis.warning) {
    if (bpAnalysis.trend === 'critical') {
      criticalScore += 2;
      warnings.push(bpAnalysis.message);
    } else {
      warningScore += 1;
      warnings.push(bpAnalysis.message);
    }
  }
  
  // Add score for rapid deterioration
  if (deterioratingCount >= CRITICAL_THRESHOLDS.rapidDeterioration) {
    criticalScore += 2;
    warnings.push('Rapid deterioration detected in recent readings');
  } else if (deterioratingCount >= 2) {
    warningScore += 2;
    warnings.push('Multiple deteriorating readings detected');
  }
  
  // Determine final prediction
  let prediction;
  let confidence;
  let message;
  
  if (criticalScore >= 4) {
    prediction = 'critical risk';
    confidence = Math.min(95, 60 + criticalScore * 5);
    message = 'High probability of critical condition. Immediate attention recommended.';
  } else if (criticalScore >= 2 || warningScore >= 4) {
    prediction = 'warning';
    confidence = Math.min(85, 50 + warningScore * 5);
    message = 'Potential deterioration risk. Monitor closely.';
  } else if (warningScore >= 2) {
    prediction = 'warning';
    confidence = Math.min(70, 40 + warningScore * 5);
    message = 'Some concerning trends detected. Continue monitoring.';
  } else {
    prediction = 'normal';
    confidence = Math.min(90, 70 + (10 - warningScore - criticalScore) * 2);
    message = 'Vitals appear stable. Continue regular monitoring.';
  }
  
  return {
    prediction,
    confidence,
    message,
    warnings: warnings.slice(0, 5),
    trends: {
      spo2: spo2Analysis,
      heartRate: hrAnalysis,
      temperature: tempAnalysis,
      bloodPressure: bpAnalysis,
    },
    analyzedReadings: recentVitals.length,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  predictPatientCondition,
  WARNING_THRESHOLDS,
  CRITICAL_THRESHOLDS
};
