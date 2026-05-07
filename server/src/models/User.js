const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['patient', 'doctor', 'receptionist', 'admin'], required: true },
  firstName:    { type: String, required: true, trim: true },
  lastName:     { type: String, required: true, trim: true },
  phone:        { type: String },
  profilePhoto: { type: String },
  clinicId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  isActive:          { type: Boolean, default: true },
  isEmailVerified:   { type: Boolean, default: false },
  refreshToken:      { type: String },
  passwordResetToken:  { type: String },
  passwordResetExpiry: { type: Date },
}, { timestamps: true });

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
