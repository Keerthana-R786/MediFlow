require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Clinic       = require('../models/Clinic');
const User         = require('../models/User');
const Patient      = require('../models/Patient');
const Appointment  = require('../models/Appointment');
const IntakeSession = require('../models/IntakeSession');
const PatientBrief = require('../models/PatientBrief');
const AuditLog     = require('../models/AuditLog');

const reset = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    Clinic.deleteMany({}),
    User.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({}),
    IntakeSession.deleteMany({}),
    PatientBrief.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('All data cleared');

  // Create one clinic
  const clinic = await Clinic.create({
    name: 'My Clinic',
    slotDuration: 15,
    settings: { whatsappEnabled: false, emailNotifications: true, autoIntake: true },
  });

  // Create one admin account
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  await User.create({
    email: 'admin@mediflow.health',
    passwordHash,
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    clinicId: clinic._id,
    isEmailVerified: true,
  });

  console.log('\n========== RESET COMPLETE ==========');
  console.log('Admin login: admin@mediflow.health / Admin@123');
  console.log('All other data is empty — create your own from the app.');
  console.log('=====================================\n');

  await mongoose.disconnect();
  process.exit(0);
};

reset().catch((e) => { console.error(e); process.exit(1); });
