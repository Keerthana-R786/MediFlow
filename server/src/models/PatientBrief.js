const mongoose = require('mongoose');

const patientBriefSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  generatedAt:   { type: Date, default: Date.now },
  status:        { type: String, enum: ['generating','ready','failed'], default: 'generating' },
  chiefComplaint:   { type: String },
  symptomSummary:   { type: String },
  clinicalTimeline: { type: String },
  relevantHistory:  { type: String },
  currentMedications: [String],
  allergies:          [String],
  riskFlags: [{
    flag:     String,
    severity: { type: String, enum: ['low','moderate','high'] },
    notes:    String,
  }],
  suggestedFocusAreas:   [String],
  suggestedTests:        [String],
  differentialClusters:  [String],
  urgencyScore: { type: Number, min: 1, max: 10 },
  urgencyLevel: { type: String, enum: ['low','moderate','high','critical'] },
  interviewQuality: { type: String, enum: ['complete','partial','minimal'] },
  doctorNotes:  { type: String },
  isRead:       { type: Boolean, default: false },
  readAt:       { type: Date },
  rawAIResponse: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('PatientBrief', patientBriefSchema);
