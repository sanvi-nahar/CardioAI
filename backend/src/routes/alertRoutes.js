const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  getAlerts,
  acknowledgeAlert,
  deleteAlert,
  deleteAllAlerts
} = require("../controllers/alertController");

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get all alerts with pagination
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [normal, warning, critical]
 *       - in: query
 *         name: acknowledged
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: resolved
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated list of alerts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   delete:
 *     summary: Delete all alerts
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All alerts deleted
 */
router.get("/", protect, getAlerts);
router.delete("/", protect, deleteAllAlerts);

/**
 * @swagger
 * /api/alerts/{id}/ack:
 *   patch:
 *     summary: Acknowledge an alert
 *     tags: [Alerts]
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
 *         description: Alert acknowledged
 *       404:
 *         description: Alert not found
 */
router.patch("/:id/ack", protect, acknowledgeAlert);

/**
 * @swagger
 * /api/alerts/{id}:
 *   delete:
 *     summary: Delete an alert
 *     tags: [Alerts]
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
 *         description: Alert deleted
 *       404:
 *         description: Alert not found
 */
router.delete("/:id", protect, deleteAlert);

module.exports = router;
