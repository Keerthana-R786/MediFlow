const VoiceNote = require('../models/VoiceNote');
const Appointment = require('../models/Appointment');
const ApiError = require('../utils/ApiError');
const { transcribeAudio, generateSOAPNotes } = require('../services/voiceTranscription.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/voice-notes');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'voice-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /webm|mp3|wav|m4a|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('audio/');
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only audio files are allowed'));
  }
}).single('audio');

/**
 * Upload and transcribe voice note
 */
exports.uploadVoiceNote = (req, res, next) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      const { appointmentId, duration, language = 'en' } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Audio file is required'
        });
      }

      const appointment = await Appointment.findById(appointmentId).populate('patientId');
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Create voice note record
      const voiceNote = await VoiceNote.create({
        appointmentId,
        doctorId: req.user._id,
        audioUrl: `/uploads/voice-notes/${req.file.filename}`,
        duration: parseInt(duration) || 0,
        status: 'transcribing',
        language,
      });

      // Start transcription in background
      transcribeAndProcess(voiceNote._id, req.file.path, appointment, language);

      res.json({
        success: true,
        data: voiceNote,
        message: 'Voice note uploaded. Transcription in progress...',
      });
    } catch (error) {
      next(error);
    }
  });
};

/**
 * Background transcription and SOAP generation
 */
async function transcribeAndProcess(voiceNoteId, audioPath, appointment, language) {
  try {
    // Transcribe audio
    const transcription = await transcribeAudio(audioPath, language);
    
    // Update with transcription
    const voiceNote = await VoiceNote.findById(voiceNoteId);
    voiceNote.transcription = transcription.text;
    voiceNote.status = 'completed';
    
    // Generate SOAP notes
    const patient = appointment.patientId;
    const patientContext = {
      name: `${patient.userId?.firstName || patient.firstName} ${patient.userId?.lastName || patient.lastName}`,
      age: patient.dateOfBirth ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / 31557600000) : 'Unknown',
      chiefComplaint: appointment.chiefComplaint || 'Not specified',
    };
    
    const soapNotes = await generateSOAPNotes(transcription.text, patientContext);
    voiceNote.structuredNotes = soapNotes;
    
    await voiceNote.save();
    
    console.log(`[Voice] Transcription completed for voice note ${voiceNoteId}`);
  } catch (error) {
    console.error(`[Voice] Transcription failed for voice note ${voiceNoteId}:`, error);
    await VoiceNote.findByIdAndUpdate(voiceNoteId, { status: 'failed' });
  }
}

/**
 * Get voice note by appointment
 */
exports.getVoiceNoteByAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  
  const voiceNote = await VoiceNote.findOne({ appointmentId })
    .populate('doctorId', 'firstName lastName');

  if (!voiceNote) {
    throw new ApiError(404, 'Voice note not found');
  }

  res.json({
    success: true,
    data: voiceNote,
  });
};

/**
 * Update voice note transcription (manual edit)
 */
exports.updateTranscription = async (req, res) => {
  const { id } = req.params;
  const { transcription, structuredNotes } = req.body;
  
  const voiceNote = await VoiceNote.findById(id);
  if (!voiceNote) {
    throw new ApiError(404, 'Voice note not found');
  }

  if (transcription) voiceNote.transcription = transcription;
  if (structuredNotes) voiceNote.structuredNotes = structuredNotes;
  voiceNote.isEdited = true;
  
  await voiceNote.save();

  res.json({
    success: true,
    data: voiceNote,
  });
};

/**
 * Delete voice note
 */
exports.deleteVoiceNote = async (req, res) => {
  const { id } = req.params;
  
  const voiceNote = await VoiceNote.findById(id);
  if (!voiceNote) {
    throw new ApiError(404, 'Voice note not found');
  }

  // Delete audio file
  if (voiceNote.audioUrl) {
    const filePath = path.join(__dirname, '../..', voiceNote.audioUrl);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error('Failed to delete audio file:', err);
    }
  }

  await voiceNote.deleteOne();

  res.json({
    success: true,
    message: 'Voice note deleted',
  });
};
