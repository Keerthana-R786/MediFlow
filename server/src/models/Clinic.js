const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  logo: { type: String },
  specializations: [String],
  workingHours: {
    monday:    { start: String, end: String, enabled: { type: Boolean, default: true } },
    tuesday:   { start: String, end: String, enabled: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, enabled: { type: Boolean, default: true } },
    thursday:  { start: String, end: String, enabled: { type: Boolean, default: true } },
    friday:    { start: String, end: String, enabled: { type: Boolean, default: true } },
    saturday:  { start: String, end: String, enabled: { type: Boolean, default: false } },
    sunday:    { start: String, end: String, enabled: { type: Boolean, default: false } },
  },
  slotDuration: { type: Number, default: 15 },
  subscription: {
    plan: { type: String, default: 'free' },
    expiresAt: Date,
  },
  settings: {
    whatsappEnabled:    { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    autoIntake:         { type: Boolean, default: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('Clinic', clinicSchema);
