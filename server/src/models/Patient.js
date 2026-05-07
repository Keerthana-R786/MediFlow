const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', ''] },
  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown',''] },
  address: {
    street: String, city: String, state: String, pincode: String,
  },
  emergencyContact: {
    name: String, phone: String, relation: String,
  },
  insuranceInfo: {
    provider: String, policyNumber: String,
  },
  medicalHistory: [{
    condition: String, diagnosedYear: String, notes: String,
  }],
  allergies: [{
    substance: String, reaction: String, severity: { type: String, enum: ['mild','moderate','severe'] },
  }],
  currentMedications: [{
    name: String, dosage: String, frequency: String, since: String,
  }],
  familyHistory: [{
    condition: String, relation: String,
  }],
  lifestyle: {
    smoking:  { type: String, enum: ['never','former','current',''] },
    alcohol:  { type: String, enum: ['never','occasional','regular',''] },
    exercise: { type: String, enum: ['none','light','moderate','heavy',''] },
    diet:     { type: String },
  },
  preferredLanguage: {
    type: String,
    enum: ['english','tamil','hindi','telugu','kannada','malayalam'],
    default: 'english',
  },
  whatsappNumber: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
