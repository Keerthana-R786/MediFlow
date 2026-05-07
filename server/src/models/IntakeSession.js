const mongoose = require('mongoose');

const intakeSessionSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  channel:  { type: String, enum: ['web','whatsapp'], default: 'web' },
  status:   { type: String, enum: ['pending','in-progress','completed','abandoned'], default: 'pending' },
  language: { type: String, enum: ['english','tamil','hindi','telugu','kannada','malayalam'], default: 'english' },
  messages: [{
    role:      { type: String, enum: ['assistant','patient'], required: true },
    content:   { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
  extractedData: {
    chiefComplaint:      String,
    symptomDuration:     String,
    symptomSeverity:     String,
    associatedSymptoms:  [String],
    painLocation:        String,
    onsetType:           String,
    aggravatingFactors:  String,
    relievingFactors:    String,
    recentMedications:   String,
    recentIllness:       String,
    recentTravel:        String,
    additionalConcerns:  String,
  },
  urgencyScore: { type: Number, min: 1, max: 10 },
  urgencyLevel: { type: String, enum: ['low','moderate','high','critical'] },
  completedAt:  { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('IntakeSession', intakeSessionSchema);
