const Patient = require("./models/Patient");
const Alert = require("./models/Alert");
const { evaluatePatientStatus } = require("./services/patientStatusService");
const { processPatientState } = require("./services/alertService");

const VITAL_RANGES = {
  normal: {
    heartRate: { min: 60, max: 95, ideal: 78, variation: 3 },
    spo2: { min: 96, max: 100, ideal: 98, variation: 1 },
    bpSystolic: { min: 100, max: 130, ideal: 118, variation: 4 },
    bpDiastolic: { min: 60, max: 85, ideal: 75, variation: 3 },
    temp: { min: 36.0, max: 37.4, ideal: 36.7, variation: 0.15 }
  },
  warning: {
    heartRate: { min: 95, max: 120, ideal: 105, variation: 4 },
    spo2: { min: 92, max: 95, ideal: 93, variation: 1 },
    bpSystolic: { min: 130, max: 150, ideal: 140, variation: 5 },
    bpDiastolic: { min: 80, max: 95, ideal: 88, variation: 4 },
    temp: { min: 37.5, max: 38.5, ideal: 38.0, variation: 0.2 }
  },
  critical: {
    heartRate: { min: 120, max: 150, ideal: 135, variation: 5 },
    spo2: { min: 80, max: 90, ideal: 85, variation: 2 },
    bpSystolic: { min: 150, max: 180, ideal: 165, variation: 6 },
    bpDiastolic: { min: 90, max: 110, ideal: 100, variation: 4 },
    temp: { min: 38.5, max: 41.0, ideal: 39.5, variation: 0.25 }
  },
  recovering: {
    heartRate: { min: 55, max: 85, ideal: 70, variation: 3 },
    spo2: { min: 93, max: 98, ideal: 96, variation: 1 },
    bpSystolic: { min: 90, max: 120, ideal: 108, variation: 4 },
    bpDiastolic: { min: 55, max: 80, ideal: 68, variation: 3 },
    temp: { min: 36.0, max: 37.0, ideal: 36.5, variation: 0.15 }
  }
};

const PATIENT_STATE = {};

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function getOrCreatePatientState(patientId) {
  if (!PATIENT_STATE[patientId]) {
    PATIENT_STATE[patientId] = {
      driftDirection: {},
      trendStrength: Math.random() * 0.5 + 0.3,
      stabilityFactor: Math.random() * 0.3 + 0.7,
      profileChangeCooldown: 0
    };
  }
  return PATIENT_STATE[patientId];
}

function applyGradualFluctuation(currentValue, range, patientState) {
  const ideal = range.ideal;
  const distanceFromIdeal = currentValue - ideal;
  
  const baseVariation = (Math.random() - 0.5) * range.variation * patientState.stabilityFactor;
  
  const meanReversion = -distanceFromIdeal * 0.05 * patientState.stabilityFactor;
  
  let newValue = currentValue + baseVariation + meanReversion;
  
  newValue = Math.max(range.min * 0.95, Math.min(range.max * 1.05, newValue));
  
  return newValue;
}

function generateVitalsForProfile(patient, profile) {
  const profileRanges = VITAL_RANGES[profile] || VITAL_RANGES.normal;
  const patientState = getOrCreatePatientState(patient._id.toString());
  
  let currentHR = patient.heartRate || profileRanges.heartRate.ideal;
  let currentSpo2 = patient.spo2 || profileRanges.spo2.ideal;
  let currentTemp = parseFloat(patient.temp) || profileRanges.temp.ideal;
  let currentBpSys = 120;
  let currentBpDia = 80;

  if (patient.bp && patient.bp.includes("/")) {
    const parts = patient.bp.split("/");
    currentBpSys = parseInt(parts[0], 10) || 120;
    currentBpDia = parseInt(parts[1], 10) || 80;
  }

  const heartRate = Math.round(applyGradualFluctuation(currentHR, profileRanges.heartRate, patientState));
  const spo2 = Math.round(applyGradualFluctuation(currentSpo2, profileRanges.spo2, patientState));
  const temp = parseFloat(applyGradualFluctuation(currentTemp, profileRanges.temp, patientState).toFixed(1));
  const bpSystolic = Math.round(applyGradualFluctuation(currentBpSys, profileRanges.bpSystolic, patientState));
  const bpDiastolic = Math.round(applyGradualFluctuation(currentBpDia, profileRanges.bpDiastolic, patientState));

  const hrInfluence = (heartRate - profileRanges.heartRate.ideal) * 0.1;
  const adjustedBpSys = Math.max(70, Math.min(200, bpSystolic + hrInfluence));
  const adjustedBpDia = Math.max(40, Math.min(120, bpDiastolic + hrInfluence * 0.5));

  if (spo2 < 90) {
    const spo2Penalty = (90 - spo2) * 0.2;
    return {
      heartRate: Math.min(180, heartRate + spo2Penalty),
      spo2: spo2,
      temp: temp,
      bpSystolic: adjustedBpSys,
      bpDiastolic: adjustedBpDia
    };
  }

  return {
    heartRate: Math.max(40, Math.min(180, heartRate)),
    spo2: Math.max(75, Math.min(100, spo2)),
    temp: Math.max(35.0, Math.min(41.5, temp)),
    bpSystolic: adjustedBpSys,
    bpDiastolic: adjustedBpDia
  };
}

function determineNextProfile(currentProfile, patientId) {
  const patientState = getOrCreatePatientState(patientId);
  
  if (patientState.profileChangeCooldown > 0) {
    patientState.profileChangeCooldown--;
    return currentProfile;
  }
  
  const roll = Math.random();
  
  if (currentProfile === 'critical') {
    if (roll > 0.85) {
      patientState.profileChangeCooldown = 12;
      return 'warning';
    } else if (roll > 0.70) {
      patientState.profileChangeCooldown = 8;
      return 'recovering';
    }
    return 'critical';
  }
  
  if (currentProfile === 'warning') {
    if (roll > 0.88) {
      patientState.profileChangeCooldown = 10;
      return 'critical';
    } else if (roll < 0.12) {
      patientState.profileChangeCooldown = 6;
      return 'normal';
    } else if (roll < 0.25) {
      patientState.profileChangeCooldown = 8;
      return 'recovering';
    }
    return 'warning';
  }
  
  if (currentProfile === 'recovering') {
    if (roll > 0.85) {
      patientState.profileChangeCooldown = 8;
      return 'normal';
    } else if (roll < 0.15) {
      patientState.profileChangeCooldown = 6;
      return 'warning';
    }
    return 'recovering';
  }
  
  if (currentProfile === 'normal') {
    if (roll > 0.92) {
      patientState.profileChangeCooldown = 10;
      return 'warning';
    } else if (roll < 0.08) {
      patientState.profileChangeCooldown = 8;
      return 'recovering';
    }
    return 'normal';
  }
  
  return currentProfile;
}

async function simulateVitals(io) {
  console.log("🔁 Individual Patient Vital Simulator Started...");

  setInterval(async () => {
    try {
      // Fetch only the last 50 vitals to construct the socket payload efficiently
      const patients = await Patient.find().select({
        vitals: { $slice: -50 }
      });

      await Promise.all(patients.map(async (p) => {
        const currentProfile = p.simulationProfile || 'normal';
        
        const newProfile = determineNextProfile(currentProfile, p._id.toString());
        
        if (newProfile !== currentProfile) {
          p.simulationProfile = newProfile;
        }
        
        const vitals = generateVitalsForProfile(p, p.simulationProfile || 'normal');
        const bp = `${vitals.bpSystolic}/${vitals.bpDiastolic}`;

        p.heartRate = vitals.heartRate;
        p.spo2 = vitals.spo2;
        p.temp = vitals.temp;
        p.bp = bp;

        const vitalsSnapshot = {
          heartRate: vitals.heartRate,
          spo2: vitals.spo2,
          bpSystolic: vitals.bpSystolic,
          bpDiastolic: vitals.bpDiastolic,
          temp: vitals.temp
        };

        const newVitalEntry = {
          timestamp: new Date(),
          ...vitalsSnapshot
        };

        // Push locally for the socket payload
        p.vitals.push(newVitalEntry);

        const evaluation = evaluatePatientStatus(vitalsSnapshot);
        p.healthScore = evaluation.healthScore;
        p.status = evaluation.status;

        await processPatientState(p, evaluation, vitalsSnapshot, io);

        // Perform atomic direct update to avoid sending/saving the whole vitals array
        await Patient.updateOne(
          { _id: p._id },
          {
            $set: {
              heartRate: p.heartRate,
              spo2: p.spo2,
              temp: p.temp,
              bp: p.bp,
              healthScore: p.healthScore,
              status: p.status,
              statusStartTime: p.statusStartTime,
              simulationProfile: p.simulationProfile
            },
            $push: {
              vitals: {
                $each: [newVitalEntry],
                $slice: -1500
              }
            }
          }
        );

        io.emit("vitals-updated", {
          patientId: p._id,
          patient: {
            _id: p._id,
            name: p.name,
            bed: p.bed,
            ward: p.ward,
            status: p.status,
            healthScore: p.healthScore,
            heartRate: p.heartRate,
            spo2: p.spo2,
            bp: p.bp,
            temp: p.temp,
            vitals: p.vitals.slice(-50)
          }
        });
      }));
    } catch (err) {
      console.error("Simulator error:", err.message);
    }

  }, 8000);
}

module.exports = simulateVitals;
