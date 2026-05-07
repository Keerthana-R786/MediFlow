require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const axios = require('axios');

const testIntakeRoutes = async () => {
  const baseURL = `http://localhost:${process.env.PORT || 5000}/api/v1`;
  
  console.log('Testing intake routes...\n');
  
  // Test 1: Get a real appointment ID from database
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Appointment = require('../models/Appointment');
  const appointment = await Appointment.findOne().sort({ createdAt: -1 });
  
  if (!appointment) {
    console.log('❌ No appointments found in database');
    process.exit(1);
  }
  
  console.log(`✓ Found appointment: ${appointment._id}`);
  console.log(`  Link would be: ${process.env.CLIENT_URL}/intake/${appointment._id}\n`);
  
  // Test 2: Try to get appointment details (should work with optionalAuth)
  try {
    const res = await axios.get(`${baseURL}/appointments/${appointment._id}`);
    console.log('✓ GET /appointments/:id works (status:', res.status, ')');
  } catch (err) {
    console.log('❌ GET /appointments/:id failed:', err.response?.status, err.response?.data?.message || err.message);
  }
  
  // Test 3: Try to start intake session
  try {
    const res = await axios.post(`${baseURL}/intake/start`, {
      appointmentId: appointment._id
    });
    console.log('✓ POST /intake/start works (status:', res.status, ')');
    console.log('  Session ID:', res.data.data.sessionId);
    
    const sessionId = res.data.data.sessionId;
    
    // Test 4: Try to send a message
    try {
      const msgRes = await axios.post(`${baseURL}/intake/${sessionId}/message`, {
        content: 'Test message'
      });
      console.log('✓ POST /intake/:sessionId/message works (status:', msgRes.status, ')');
    } catch (err) {
      console.log('❌ POST /intake/:sessionId/message failed:', err.response?.status, err.response?.data?.message || err.message);
    }
    
  } catch (err) {
    console.log('❌ POST /intake/start failed:', err.response?.status, err.response?.data?.message || err.message);
  }
  
  await mongoose.disconnect();
  console.log('\nTest complete!');
};

testIntakeRoutes().catch(console.error);
