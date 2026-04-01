const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  heartRateLow: Number,
  heartRateHigh: Number,
  spo2Low: Number,
  tempHigh: Number,
  bpSystolicHigh: Number,
  bpDiastolicHigh: Number,
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
