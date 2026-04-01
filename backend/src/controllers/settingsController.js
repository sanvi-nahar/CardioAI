// src/controllers/settingsController.js
const Settings = require('../models/Settings');
const asyncHandler = require('express-async-handler');

/** GET current settings */
const getSettings = asyncHandler(async (req, res) => {
  let s = await Settings.findOne();
  if (!s) {
    // Create default settings if not found
    s = await Settings.create({
      thresholds: {
        heartRateHigh: 120,
        heartRateLow: 50,
        spo2Low: 92,
        tempHigh: 38
      }
    });
  }
  res.json(s);
});

/** UPDATE settings */
const updateSettings = asyncHandler(async (req, res) => {
  const { heartRateHigh, heartRateLow, spo2Low, tempHigh } = req.body;

  let s = await Settings.findOne();
  if (!s) {
    s = new Settings();
  }

  s.thresholds.heartRateHigh = heartRateHigh;
  s.thresholds.heartRateLow = heartRateLow;
  s.thresholds.spo2Low = spo2Low;
  s.thresholds.tempHigh = tempHigh;

  await s.save();

  res.json({ message: "Settings updated successfully", settings: s });
});

module.exports = { getSettings, updateSettings };
