const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");
const { protect } = require("../middleware/authMiddleware");
const { validate, settingsSchemas } = require("../middleware/validationMiddleware");

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings
 *         content:
 *           application/json:
 *             example:
 *               heartRateLow: 60
 *               heartRateHigh: 100
 *               spo2Low: 95
 *               tempHigh: 37.5
 *               bpSystolicHigh: 140
 *               bpDiastolicHigh: 90
 *   put:
 *     summary: Update system settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             heartRateLow: 60
 *             heartRateHigh: 100
 *             spo2Low: 95
 *             tempHigh: 37.5
 *             bpSystolicHigh: 140
 *             bpDiastolicHigh: 90
 *     responses:
 *       200:
 *         description: Settings updated
 *       400:
 *         description: Validation error
 */
router.get("/", protect, async (req, res) => {
  const settings = await Settings.findOne();
  res.json(settings);
});

router.put("/", protect, validate(settingsSchemas.update), async (req, res) => {
  let settings = await Settings.findOne();

  if (!settings) settings = new Settings({});

  const allowedFields = [
    'heartRateLow', 'heartRateHigh', 'spo2Low', 
    'tempHigh', 'bpSystolicHigh', 'bpDiastolicHigh'
  ];
  
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      settings[field] = req.body[field];
    }
  }

  await settings.save();
  res.json(settings);
});

module.exports = router;
