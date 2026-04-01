const express = require("express");
const router = express.Router();
const { getAISummary, getPatientPrediction, getAllPatientsPredictions } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/ai-summary:
 *   get:
 *     summary: Get AI summary for all patients
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI summary
 */
router.get("/", protect, getAISummary);

/**
 * @swagger
 * /api/ai-summary/predictions:
 *   get:
 *     summary: Get predictions for all patients
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Predictions for all patients
 */
router.get("/predictions", protect, getAllPatientsPredictions);

/**
 * @swagger
 * /api/ai-summary/predictions/{id}:
 *   get:
 *     summary: Get prediction for a specific patient
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient prediction
 *       404:
 *         description: Patient not found
 */
router.get("/predictions/:id", protect, getPatientPrediction);

module.exports = router;
