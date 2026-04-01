const mongoose = require("mongoose");

const vitalsSnapshotSchema = new mongoose.Schema(
  {
    heartRate: { type: Number },
    spo2: { type: Number },
    bpSystolic: { type: Number },
    bpDiastolic: { type: Number },
    temp: { type: Number },
  },
  { _id: false }
);

const alertSchema = new mongoose.Schema(
  {
    // Link to patient
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // Store patient name also for faster UI load & historical display
    patientName: { type: String, required: true },

    // Alert info
    severity: {
      type: String,
      enum: ["normal", "warning", "critical"],
      required: true,
    },

    message: { type: String, required: true },

    // Snapshot of vitals at the time of alert
    vitalsSnapshot: vitalsSnapshotSchema,

    // Whether alert has been acknowledged by staff
    acknowledged: { type: Boolean, default: false },

    // When it was acknowledged
    acknowledgedAt: { type: Date },

    // Whether the alert condition has naturally recovered/resolved
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

// Performance indexes
alertSchema.index({ createdAt: -1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ acknowledged: 1 });
alertSchema.index({ resolved: 1 });
alertSchema.index({ patient: 1, createdAt: -1 });

// Optional: helper method to acknowledge alert
alertSchema.methods.markAcknowledged = function () {
  this.acknowledged = true;
  this.acknowledgedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Alert", alertSchema);
