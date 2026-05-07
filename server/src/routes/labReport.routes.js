const express = require('express');
const router = express.Router();
const labReportController = require('../controllers/labReport.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const asyncHandler = require('../utils/asyncHandler');

// All routes require authentication
router.use(authenticate);

// Upload lab report (don't use asyncHandler - multer handles its own callbacks)
router.post('/upload', authorize('doctor', 'receptionist'), labReportController.uploadLabReport);

// Add manual test results
router.put('/:id/results', authorize('doctor'), asyncHandler(labReportController.addTestResults));

// AI analyze lab report
router.post('/:id/analyze', authorize('doctor'), asyncHandler(labReportController.analyzeLabReport));

// Get patient lab reports
router.get('/patient/:patientId', asyncHandler(labReportController.getPatientLabReports));

// Get single lab report
router.get('/:id', asyncHandler(labReportController.getLabReport));

// Mark as reviewed
router.put('/:id/review', authorize('doctor'), asyncHandler(labReportController.markAsReviewed));

module.exports = router;
