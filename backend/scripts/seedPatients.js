const mongoose = require('mongoose');
const Patient = require('../src/models/Patient');

const WARDS = ['ICU', 'General', 'Emergency', 'Cardiology'];
const GENDERS = ['Male', 'Female'];

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin'
];

const MEDICAL_HISTORIES = [
  'Hypertension',
  'Type 2 Diabetes',
  'Asthma',
  'Heart Failure',
  'COPD',
  'Coronary Artery Disease',
  'None',
  'Arrhythmia',
  'Pneumonia',
  'Chronic Kidney Disease'
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateVitals(status) {
  const configs = {
    normal: {
      heartRate: { min: 60, max: 90 },
      spo2: { min: 96, max: 100 },
      bpSys: { min: 100, max: 130 },
      bpDia: { min: 60, max: 85 },
      temp: { min: 36.0, max: 37.2 }
    },
    warning: {
      heartRate: { min: 50, max: 55 },
      spo2: { min: 93, max: 95 },
      bpSys: { min: 140, max: 150 },
      bpDia: { min: 85, max: 95 },
      temp: { min: 37.5, max: 38.0 }
    },
    critical: {
      heartRate: { min: 130, max: 145 },
      spo2: { min: 85, max: 91 },
      bpSys: { min: 155, max: 175 },
      bpDia: { min: 95, max: 110 },
      temp: { min: 38.5, max: 39.5 }
    }
  };

  const config = configs[status];
  
  let baseHR = randomBetween(config.heartRate.min, config.heartRate.max);
  let baseSpo2 = randomBetween(config.spo2.min, config.spo2.max);
  let baseSys = randomBetween(config.bpSys.min, config.bpSys.max);
  let baseDia = randomBetween(config.bpDia.min, config.bpDia.max);
  let baseTemp = (Math.random() * (config.temp.max - config.temp.min) + config.temp.min).toFixed(1);

  return {
    heartRate: baseHR,
    spo2: baseSpo2,
    bpSystolic: baseSys,
    bpDiastolic: baseDia,
    temp: parseFloat(baseTemp)
  };
}

function generateVitalsHistory(count, status) {
  const vitals = [];
  const now = new Date();
  
  let currentStatus = status;
  let currentVitals = generateVitals(status);
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 5 * 1000);
    
    const vary = (value, min, max, maxChange) => {
      const change = (Math.random() * 2 - 1) * maxChange;
      let newValue = value + change;
      if (newValue < min) newValue = min + Math.random() * 2;
      if (newValue > max) newValue = max - Math.random() * 2;
      return Math.round(newValue * 10) / 10;
    };
    
    currentVitals = {
      heartRate: vary(currentVitals.heartRate, 40, 150, 3),
      spo2: vary(currentVitals.spo2, 80, 100, 2),
      bpSystolic: vary(currentVitals.bpSystolic, 80, 180, 5),
      bpDiastolic: vary(currentVitals.bpDiastolic, 50, 120, 4),
      temp: vary(currentVitals.temp, 35.0, 40.0, 0.15)
    };

    if (Math.random() < 0.1) {
      currentStatus = randomItem(['normal', 'warning', 'critical']);
    }

    vitals.push({
      timestamp,
      ...currentVitals
    });
  }

  return vitals;
}

function generatePatient(index) {
  const firstName = randomItem(FIRST_NAMES);
  const lastName = randomItem(LAST_NAMES);
  const name = `${firstName} ${lastName}`;
  const age = randomBetween(20, 85);
  const gender = randomItem(GENDERS);
  const ward = randomItem(WARDS);
  
  const bedPrefix = {
    'ICU': 'ICU',
    'General': 'GEN',
    'Emergency': 'ER',
    'Cardiology': 'CARD'
  };
  const bed = `${bedPrefix[ward]}-${String(randomBetween(1, 30)).padStart(2, '0')}`;
  
  // Simulation profile distribution: 40% normal, 35% warning, 25% critical
  const profileRoll = Math.random();
  let simulationProfile;
  if (profileRoll < 0.40) {
    simulationProfile = 'normal';
  } else if (profileRoll < 0.75) {
    simulationProfile = 'warning';
  } else {
    simulationProfile = 'critical';
  }
  
  const statusDistribution = ['normal', 'normal', 'normal', 'warning', 'warning', 'critical'];
  const status = randomItem(statusDistribution);
  
  const vitalsCount = randomBetween(50, 100);
  const vitals = generateVitalsHistory(vitalsCount, simulationProfile);
  
  const latestVitals = vitals[vitals.length - 1];
  
  const healthScoreMap = {
    'normal': randomBetween(85, 100),
    'warning': randomBetween(60, 84),
    'critical': randomBetween(20, 59)
  };
  
  return {
    name,
    age,
    gender,
    ward,
    bed,
    deviceId: `DEV-${String(randomBetween(1000, 9999))}`,
    status,
    healthScore: healthScoreMap[status],
    simulationProfile,
    heartRate: latestVitals.heartRate,
    spo2: latestVitals.spo2,
    bp: `${latestVitals.bpSystolic}/${latestVitals.bpDiastolic}`,
    temp: latestVitals.temp,
    contact: `+1${randomBetween(2000000000, 9999999999)}`,
    address: randomBetween(100, 9999) + ' ' + randomItem(['Oak', 'Maple', 'Pine', 'Cedar', 'Elm', 'Birch']) + ' ' + randomItem(['Street', 'Avenue', 'Road', 'Lane', 'Drive', 'Boulevard']),
    medicalHistory: randomItem(MEDICAL_HISTORIES),
    notes: '',
    doctorInstructions: '',
    vitals
  };
}

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI 
      ? process.env.MONGO_URI.includes('/') 
        ? process.env.MONGO_URI 
        : process.env.MONGO_URI + '/patient-monitor'
      : 'mongodb://localhost:27017/patient-monitor';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    const beforeCount = await Patient.countDocuments({});
    console.log('Patients before seeding:', beforeCount);

    await Patient.deleteMany({});
    console.log('Cleared existing patients');

    const patientCount = randomBetween(15, 20);
    console.log('Generating', patientCount, 'patients...');
    const patients = [];
    
    for (let i = 0; i < patientCount; i++) {
      patients.push(generatePatient(i));
    }

    const insertedPatients = await Patient.insertMany(patients);
    console.log(`\nSeeded ${insertedPatients.length} patients with 50-100 vitals each\n`);

    const statusCounts = { normal: 0, warning: 0, critical: 0 };
    const profileCounts = { normal: 0, warning: 0, critical: 0, recovering: 0 };
    const wardCounts = {};

    insertedPatients.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      profileCounts[p.simulationProfile] = (profileCounts[p.simulationProfile] || 0) + 1;
      wardCounts[p.ward] = (wardCounts[p.ward] || 0) + 1;
      console.log(`  - ${p.name} (${p.ward}, ${p.bed}) - ${p.status.toUpperCase()} - Profile: ${p.simulationProfile} - ${p.vitals.length} vitals`);
    });

    const afterCount = await Patient.countDocuments({});
    console.log('\n--- Summary ---');
    console.log('Patients in database:', afterCount);
    console.log('Status:', statusCounts);
    console.log('Simulation Profiles:', profileCounts);
    console.log('Wards:', wardCounts);
    console.log('\n✅ Database seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
