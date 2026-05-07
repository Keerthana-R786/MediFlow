require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const mailService = require('../services/mail.service');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const targetEmail = 'k94276873@gmail.com';
  console.log('Sending test appointment email to:', targetEmail);
  try {
    await mailService.sendAppointmentConfirmation(
      { firstName: 'Keerthana', lastName: '', email: targetEmail },
      { firstName: 'Test', lastName: 'Doctor' },
      { appointmentDate: new Date(), slot: { startTime: '10:00' }, type: 'consultation' },
      'http://localhost:5173/intake/test123'
    );
    console.log('SUCCESS — email sent to', targetEmail);
  } catch (e) {
    console.log('FAILED:', e.message);
  }
  mongoose.disconnect();
}).catch(e => { console.error(e); process.exit(1); });
