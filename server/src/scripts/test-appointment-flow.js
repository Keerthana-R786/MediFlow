require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Clinic = require('../models/Clinic');
const mailService = require('../services/mail.service');

const testAppointmentFlow = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a clinic
    const clinic = await Clinic.findOne();
    if (!clinic) {
      console.log('❌ No clinic found');
      process.exit(1);
    }
    console.log('✅ Found clinic:', clinic.name);

    // Find a patient with email
    const patient = await Patient.findOne().populate('userId', 'firstName lastName email').lean();
    if (!patient || !patient.userId?.email) {
      console.log('❌ No patient with email found');
      console.log('Patient:', JSON.stringify(patient, null, 2));
      process.exit(1);
    }
    console.log('✅ Found patient:', patient.userId.email);
    console.log('   Patient ID:', patient._id);
    console.log('   User ID:', patient.userId._id);

    // Find a doctor
    const doctor = await User.findOne({ role: 'doctor' }).lean();
    if (!doctor) {
      console.log('❌ No doctor found');
      process.exit(1);
    }
    console.log('✅ Found doctor:', doctor.email);

    // Create appointment (mimicking the controller)
    console.log('\n📝 Creating appointment...');
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1); // Tomorrow
    appointmentDate.setHours(10, 0, 0, 0);

    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      clinicId: clinic._id,
      appointmentDate: appointmentDate,
      slot: { startTime: '10:00', endTime: '10:15' },
      type: 'consultation',
      chiefComplaint: 'Test appointment',
      tokenNumber: 999,
    });

    console.log('✅ Appointment created:', appointment._id);

    // Now test the email sending (mimicking the background task)
    console.log('\n📧 Testing email sending...');
    
    // Re-fetch patient with populated userId (like in the controller)
    const patientForEmail = await Patient.findById(patient._id)
      .populate('userId', 'firstName lastName email')
      .lean();
    
    console.log('Patient for email:', {
      _id: patientForEmail._id,
      userId: patientForEmail.userId,
    });

    if (!patientForEmail?.userId?.email) {
      console.log('❌ No email found after re-fetch');
      process.exit(1);
    }

    const intakeLink = `${process.env.CLIENT_URL}/intake/${appointment._id}`;
    console.log('Intake link:', intakeLink);

    await mailService.sendAppointmentConfirmation(
      patientForEmail.userId,
      doctor,
      appointment,
      intakeLink
    );

    console.log('\n✅ TEST PASSED - Email sent successfully!');
    console.log('Check inbox:', patientForEmail.userId.email);

    // Clean up test appointment
    await Appointment.findByIdAndDelete(appointment._id);
    console.log('✅ Test appointment cleaned up');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testAppointmentFlow();
