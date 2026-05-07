require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const mailService = require('../services/mail.service');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Find all appointments
  const appointments = await Appointment.find()
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'firstName lastName email' } })
    .populate('doctorId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean();

  console.log(`Total appointments: ${appointments.length}`);
  appointments.forEach((a, i) => {
    const patientEmail = a.patientId?.userId?.email;
    console.log(`\n[${i + 1}] Appointment ID: ${a._id}`);
    console.log(`    Patient: ${a.patientId?.userId?.firstName} ${a.patientId?.userId?.lastName}`);
    console.log(`    Patient email: ${patientEmail || 'MISSING'}`);
    console.log(`    Doctor: Dr. ${a.doctorId?.firstName} ${a.doctorId?.lastName}`);
    console.log(`    Date: ${a.appointmentDate}`);
    console.log(`    Status: ${a.status}`);
  });

  if (appointments.length > 0) {
    const latest = appointments[0];
    const patientEmail = latest.patientId?.userId?.email;
    if (patientEmail) {
      console.log(`\nResending confirmation email for latest appointment to: ${patientEmail}`);
      const intakeLink = `${process.env.CLIENT_URL}/intake/${latest._id}`;
      try {
        await mailService.sendAppointmentConfirmation(
          latest.patientId.userId,
          latest.doctorId,
          latest,
          intakeLink
        );
        console.log('Email sent successfully!');
        console.log('Intake link:', intakeLink);
      } catch (e) {
        console.log('Email FAILED:', e.message);
      }
    } else {
      console.log('\nNo patient email found on latest appointment');
    }
  }

  mongoose.disconnect();
}).catch(e => { console.error(e); process.exit(1); });
