const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String },
  referenceRange: { type: String },
  isAbnormal: { type: Boolean, default: false },
  flag: { type: String, enum: ['normal', 'low', 'high', 'critical'], default: 'normal' },
});

const labReportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportType: {
    type: String,
    required: true,
    enum: ['blood', 'urine', 'xray', 'ultrasound', 'ct', 'mri', 'ecg', 'other'],
  },
  reportDate: { type: Date, required: true },
  labName: { type: String },
  testResults: [testResultSchema],
  fileUrl: { type: String }, // S3 or local file path
  fileName: { type: String },
  fileSize: { type: Number },
  mimeType: { type: String },
  aiAnalysis: {
    summary: { type: String },
    abnormalFindings: [{ type: String }],
    recommendations: [{ type: String }],
    analyzedAt: { type: Date },
  },
  notes: { type: String },
  isReviewed: { type: Boolean, default: false },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: { type: Date },
}, { timestamps: true });

// Index for efficient queries
labReportSchema.index({ patientId: 1, reportDate: -1 });
labReportSchema.index({ appointmentId: 1 });

module.exports = mongoose.model('LabReport', labReportSchema);
