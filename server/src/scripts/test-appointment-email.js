require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const mailService = require('../services/mail.service');

const testAppointmentEmail = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a patient with email
    const patient = await Patient.findOne().populate('userId', 'firstName lastName email').lean();
    if (!patient || !patient.userId?.email) {
      console.log('❌ No patient with email found');
      process.exit(1);
    }

    console.log('✅ Found patient:', patient.userId.email);

    // Find a doctor
    const doctor = await User.findOne({ role: 'doctor' }).lean();
    if (!doctor) {
      console.log('❌ No doctor found');
      process.exit(1);
    }

    console.log('✅ Found doctor:', doctor.email);

    // Create a test appointment object
    const testAppointment = {
      _id: new mongoose.Types.ObjectId(),
      appointmentDate: new Date(),
      slot: { startTime: '10:00', endTime: '10:15' },
      type: 'consultation',
    };

    const intakeLink = `${process.env.CLIENT_URL}/intake/${testAppointment._id}`;
    console.log('📧 Sending test email to:', patient.userId.email);
    console.log('🔗 Intake link:', intakeLink);

    await mailService.sendAppointmentConfirmation(
      patient.userId,
      doctor,
      testAppointment,
      intakeLink
    );

    console.log('✅ Email sent successfully!');
    console.log('\nCheck the inbox for:', patient.userId.email);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testAppointmentEmail();
