const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescription.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const asyncHandler = require('../utils/asyncHandler');

// All routes require authentication
router.use(authenticate);

// Create/update prescription (doctors only)
router.post('/', authorize('doctor'), asyncHandler(prescriptionController.createPrescription));

// Issue prescription (finalize)
router.put('/:id/issue', authorize('doctor'), asyncHandler(prescriptionController.issuePrescription));

// Get prescription by appointment
router.get('/appointment/:appointmentId', asyncHandler(prescriptionController.getPrescriptionByAppointment));

// Get patient prescriptions
router.get('/patient/:patientId', asyncHandler(prescriptionController.getPatientPrescriptions));

// Get common medications for autocomplete
router.get('/medications/common', authorize('doctor'), asyncHandler(prescriptionController.getCommonMedications));

module.exports = router;
