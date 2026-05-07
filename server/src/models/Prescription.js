const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true }, // e.g., "500mg"
  frequency: { type: String, required: true }, // e.g., "Twice daily", "1-0-1"
  duration: { type: String, required: true }, // e.g., "7 days", "2 weeks"
  instructions: { type: String }, // e.g., "Take after meals"
  timing: { type: String }, // e.g., "Morning-Evening", "Before bed"
});

const prescriptionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  diagnosis: { type: String, required: true },
  medications: [medicationSchema],
  labTests: [{ type: String }], // Recommended lab tests
  advice: { type: String }, // General advice and instructions
  followUpDate: { type: Date },
  followUpInstructions: { type: String },
  status: {
    type: String,
    enum: ['draft', 'issued', 'dispensed'],
    default: 'draft',
  },
  issuedAt: { type: Date },
  validUntil: { type: Date },
}, { timestamps: true });

// Auto-set issuedAt and validUntil when status changes to 'issued'
prescriptionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'issued' && !this.issuedAt) {
    this.issuedAt = new Date();
    // Prescriptions valid for 30 days by default
    this.validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
