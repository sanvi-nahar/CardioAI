const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  heartRate: Number,
  spo2: Number,
  bpSystolic: Number,
  bpDiastolic: Number,
  temp: Number,
  ecgSnippet: { type: Object }
}, { _id: false });

const patientSchema = new mongoose.Schema({
  // BASIC INFO
  name: { type: String, required: true },
  age: Number,
  gender: String,

  // CONTACT DETAILS
  contact: String,  // from phone
  address: { type: String, default: "" },

  // BED / WARD DETAILS
  bed: { type: String, default: "" },
  ward: { type: String, default: "" },

  // PATIENT STATUS
  status: {
    type: String,
    enum: ['normal', 'warning', 'critical'],
    default: 'normal'
  },
  statusStartTime: { type: Date }, // To track how long they've been in a certain status
  healthScore: { type: Number, default: 100, min: 0, max: 100 },

  // SIMULATION PROFILE (controls vital sign behavior)
  simulationProfile: {
    type: String,
    enum: ['normal', 'warning', 'critical', 'recovering'],
    default: 'normal'
  },

  // CURRENT VITALS (latest)
  heartRate: Number,
  spo2: Number,
  bp: String,   // from bloodPressure
  temp: Number, // from temperature

  // DEVICE ID
  deviceId: { type: String, index: true, sparse: true },

  // VITALS HISTORY
  vitals: [vitalsSchema],

  // EXTRA METADATA
  metadata: { type: Object },

  // HEALTH FIELDS
  medicalHistory: { type: String, default: "" },
  notes: { type: String, default: "" },
  doctorInstructions: { type: String, default: "" }

}, { timestamps: true });

// Performance indexes
patientSchema.index({ createdAt: -1 });
patientSchema.index({ updatedAt: -1 });
patientSchema.index({ ward: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ ward: 1, status: 1 });

// Pre-save hook to limit vitals history
patientSchema.pre('save', function (next) {
  // Option: Limit to last 1000 records (~1.3 hours if 5s intervals) 
  // or use a date-based filtering. For simplicity and DB size, we'll slice array.
  const MAX_VITALS_RECORDS = 1500;
  if (this.vitals.length > MAX_VITALS_RECORDS) {
    // Keep only the most recent MAX_VITALS_RECORDS
    this.vitals = this.vitals.slice(this.vitals.length - MAX_VITALS_RECORDS);
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
