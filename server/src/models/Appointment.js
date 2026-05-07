const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clinicId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  appointmentDate: { type: Date, required: true },
  slot: {
    startTime: { type: String, required: true },
    endTime:   { type: String },
  },
  type: {
    type: String,
    enum: ['consultation','follow-up','emergency','routine-checkup'],
    default: 'consultation',
  },
  chiefComplaint: { type: String },
  status: {
    type: String,
    enum: ['scheduled','checked-in','in-progress','completed','cancelled','no-show'],
    default: 'scheduled',
  },
  intakeSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'IntakeSession' },
  patientBriefId:  { type: mongoose.Schema.Types.ObjectId, ref: 'PatientBrief' },
  notes:        { type: String },
  prescription: { type: String },
  followUpDate: { type: Date },
  tokenNumber:  { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
