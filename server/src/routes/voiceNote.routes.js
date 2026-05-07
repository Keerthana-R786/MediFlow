const express = require('express');
const router = express.Router();
const voiceNoteController = require('../controllers/voiceNote.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const asyncHandler = require('../utils/asyncHandler');

// All routes require authentication and doctor role
router.use(authenticate);
router.use(authorize('doctor'));

// Upload and transcribe voice note
router.post('/upload', asyncHandler(voiceNoteController.uploadVoiceNote));

// Get voice note by appointment
router.get('/appointment/:appointmentId', asyncHandler(voiceNoteController.getVoiceNoteByAppointment));

// Update transcription (manual edit)
router.put('/:id', asyncHandler(voiceNoteController.updateTranscription));

// Delete voice note
router.delete('/:id', asyncHandler(voiceNoteController.deleteVoiceNote));

module.exports = router;
