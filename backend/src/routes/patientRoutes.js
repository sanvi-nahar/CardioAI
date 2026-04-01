const express = require('express');
const router = express.Router();
const {
  createPatient, 
  getPatients, 
  getPatientById, 
  addVitals, 
  deletePatient,
  updatePatient,
  getPatientSummary,
} = require('../controllers/patientController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate, patientSchemas } = require('../middleware/validationMiddleware');

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Get all patients with pagination
 *     tags: [Patients]
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
 *         name: ward
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [normal, warning, critical]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of patients
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "John Doe"
 *             age: 45
 *             gender: "male"
 *             bed: "101"
 *             ward: "ICU"
 *             heartRate: 72
 *             spo2: 98
 *             bloodPressure: "120/80"
 *             temperature: 36.5
 *     responses:
 *       201:
 *         description: Patient created
 *       400:
 *         description: Validation error
 */
router.route('/')
  .get(protect, getPatients)
  .post(protect, validate(patientSchemas.create), createPatient);

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
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
 *         description: Patient details
 *       404:
 *         description: Patient not found
 *   put:
 *     summary: Update patient
 *     tags: [Patients]
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
 *         description: Patient updated
 *       404:
 *         description: Patient not found
 *   delete:
 *     summary: Delete patient (admin only)
 *     tags: [Patients]
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
 *         description: Patient deleted
 *       403:
 *         description: Forbidden
 */
router.route('/:id')
  .get(protect, getPatientById)
  .put(protect, validate(patientSchemas.update), updatePatient)
  .delete(protect, admin, deletePatient);

/**
 * @swagger
 * /api/patients/{id}/summary:
 *   get:
 *     summary: Get patient summary with vitals stats
 *     tags: [Patients]
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
 *         description: Patient summary
 */
router.route('/:id/summary')
  .get(protect, getPatientSummary);

/**
 * @swagger
 * /api/patients/{id}/vitals:
 *   post:
 *     summary: Add vitals for a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             heartRate: 75
 *             spo2: 97
 *             bp: "118/78"
 *             temp: 36.6
 *     responses:
 *       200:
 *         description: Vitals updated
 */
router.route('/:id/vitals')
  .post(protect, validate(patientSchemas.addVitals), addVitals);

module.exports = router;
