const mongoose = require('mongoose');

const voiceNoteSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  audioUrl: { type: String }, // Path to audio file
  duration: { type: Number }, // Duration in seconds
  transcription: { type: String },
  structuredNotes: {
    subjective: { type: String }, // Patient's complaints
    objective: { type: String }, // Examination findings
    assessment: { type: String }, // Diagnosis
    plan: { type: String }, // Treatment plan
  },
  status: {
    type: String,
    enum: ['recording', 'transcribing', 'completed', 'failed'],
    default: 'recording',
  },
  language: { type: String, default: 'en' },
  isEdited: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('VoiceNote', voiceNoteSchema);
