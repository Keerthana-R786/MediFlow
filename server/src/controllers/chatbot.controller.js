const { generateText } = require('../config/ai');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const PatientBrief = require('../models/PatientBrief');

/**
 * Chat with AI assistant - provides accurate data-driven responses
 */
exports.chat = async (req, res) => {
  const { message } = req.body;
  const user = req.user;

  try {
    let systemPrompt = '';
    let detailedContext = '';

    switch (user.role) {
      case 'doctor':
        systemPrompt = `You are an AI assistant for doctors in MediFlow. You MUST provide accurate answers based ONLY on the real data provided in the context. Never make up or assume information.

IMPORTANT RULES:
1. Only answer based on the actual data provided in the context
2. If data is not available, say "I don't have that information in the system"
3. Be specific with numbers, names, and dates from the actual data
4. For medical knowledge questions not related to specific patients, provide general medical information
5. Always cite the actual data when answering about patients or appointments`;

        // Get TODAY's appointments with full details
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = await Appointment.find({ 
          doctorId: user._id,
          appointmentDate: { $gte: today, $lt: tomorrow }
        })
        .populate({
          path: 'patientId',
          populate: { path: 'userId' }
        })
        .sort({ 'slot.startTime': 1 });

        // Get all upcoming appointments
        const upcomingAppointments = await Appointment.find({
          doctorId: user._id,
          appointmentDate: { $gte: today }
        })
        .populate({
          path: 'patientId',
          populate: { path: 'userId' }
        })
        .sort({ appointmentDate: 1 })
        .limit(20);

        // Get recent prescriptions
        const recentPrescriptions = await Prescription.find({ doctorId: user._id })
          .populate('patientId')
          .sort({ issuedAt: -1 })
          .limit(10);

        // Build detailed context
        detailedContext = `REAL DATA FROM SYSTEM:

TODAY'S APPOINTMENTS (${todayAppointments.length} total):
${todayAppointments.map((apt, idx) => {
  const patient = apt.patientId;
  const patientUser = patient?.userId;
  return `${idx + 1}. Patient: ${patientUser?.firstName} ${patientUser?.lastName}
   Time: ${apt.slot?.startTime}
   Type: ${apt.type}
   Status: ${apt.status}
   Chief Complaint: ${apt.chiefComplaint || 'Not specified'}`;
}).join('\n\n')}

UPCOMING APPOINTMENTS (Next 20):
${upcomingAppointments.slice(0, 5).map((apt) => {
  const patient = apt.patientId;
  const patientUser = patient?.userId;
  return `- ${new Date(apt.appointmentDate).toLocaleDateString()}: ${patientUser?.firstName} ${patientUser?.lastName} at ${apt.slot?.startTime}`;
}).join('\n')}

RECENT PRESCRIPTIONS ISSUED:
${recentPrescriptions.slice(0, 5).map((rx) => {
  const patient = rx.patientId;
  return `- ${patient?.userId?.firstName || 'Patient'}: ${rx.diagnosis} (${new Date(rx.issuedAt).toLocaleDateString()})`;
}).join('\n')}

STATISTICS:
- Total appointments today: ${todayAppointments.length}
- Completed today: ${todayAppointments.filter(a => a.status === 'completed').length}
- In progress: ${todayAppointments.filter(a => a.status === 'in-progress').length}
- Waiting: ${todayAppointments.filter(a => a.status === 'checked-in').length}
- Total prescriptions issued: ${recentPrescriptions.length}`;
        break;

      case 'receptionist':
        systemPrompt = `You are an AI assistant for receptionists in MediFlow. You MUST provide accurate answers based ONLY on the real data provided. Never make up information.

IMPORTANT RULES:
1. Only answer based on actual queue and appointment data
2. Provide exact numbers and patient names from the data
3. If information is not available, clearly state that
4. Be specific about appointment times and statuses`;

        const todayQueue = await Appointment.find({
          appointmentDate: { 
            $gte: new Date().setHours(0, 0, 0, 0),
            $lt: new Date().setHours(23, 59, 59, 999)
          }
        })
        .populate({
          path: 'patientId',
          populate: { path: 'userId' }
        })
        .populate('doctorId')
        .sort({ 'slot.startTime': 1 });

        detailedContext = `REAL QUEUE DATA:

TODAY'S QUEUE (${todayQueue.length} total appointments):
${todayQueue.map((apt, idx) => {
  const patient = apt.patientId;
  const patientUser = patient?.userId;
  const doctor = apt.doctorId;
  return `${idx + 1}. ${patientUser?.firstName} ${patientUser?.lastName}
   Doctor: Dr. ${doctor?.firstName} ${doctor?.lastName}
   Time: ${apt.slot?.startTime}
   Status: ${apt.status}
   Type: ${apt.type}`;
}).join('\n\n')}

QUEUE STATISTICS:
- Total appointments: ${todayQueue.length}
- Scheduled: ${todayQueue.filter(a => a.status === 'scheduled').length}
- Checked-in (Waiting): ${todayQueue.filter(a => a.status === 'checked-in').length}
- In consultation: ${todayQueue.filter(a => a.status === 'in-progress').length}
- Completed: ${todayQueue.filter(a => a.status === 'completed').length}
- Cancelled: ${todayQueue.filter(a => a.status === 'cancelled').length}`;
        break;

      case 'patient':
        systemPrompt = `You are an AI assistant for patients in MediFlow. You MUST provide accurate answers based ONLY on the patient's real data. Never make up information.

IMPORTANT RULES:
1. Only answer based on this patient's actual appointments and prescriptions
2. Provide exact dates, times, and medication details from the data
3. If information is not available, clearly state that
4. For general health questions, provide helpful medical information`;

        const patientRecord = await Patient.findOne({ userId: user._id });
        
        if (patientRecord) {
          const myAppointments = await Appointment.find({ patientId: patientRecord._id })
            .populate('doctorId')
            .sort({ appointmentDate: -1 })
            .limit(10);

          const myPrescriptions = await Prescription.find({ 
            patientId: patientRecord._id, 
            status: 'issued' 
          })
          .populate('doctorId')
          .sort({ issuedAt: -1 })
          .limit(5);

          detailedContext = `YOUR REAL MEDICAL DATA:

YOUR APPOINTMENTS:
${myAppointments.map((apt, idx) => {
  const doctor = apt.doctorId;
  return `${idx + 1}. Date: ${new Date(apt.appointmentDate).toLocaleDateString()}
   Time: ${apt.slot?.startTime}
   Doctor: Dr. ${doctor?.firstName} ${doctor?.lastName}
   Status: ${apt.status}
   Type: ${apt.type}
   Chief Complaint: ${apt.chiefComplaint || 'Not specified'}`;
}).join('\n\n')}

YOUR PRESCRIPTIONS:
${myPrescriptions.map((rx, idx) => {
  const doctor = rx.doctorId;
  return `${idx + 1}. Issued: ${new Date(rx.issuedAt).toLocaleDateString()}
   Doctor: Dr. ${doctor?.firstName} ${doctor?.lastName}
   Diagnosis: ${rx.diagnosis}
   Medications: ${rx.medications.map(m => `${m.name} ${m.dosage}`).join(', ')}
   Valid until: ${new Date(rx.validUntil).toLocaleDateString()}`;
}).join('\n\n')}

SUMMARY:
- Total appointments: ${myAppointments.length}
- Upcoming appointments: ${myAppointments.filter(a => new Date(a.appointmentDate) > new Date()).length}
- Active prescriptions: ${myPrescriptions.length}`;
        } else {
          detailedContext = 'No patient record found for this user.';
        }
        break;

      case 'admin':
        systemPrompt = `You are an AI assistant for administrators in MediFlow. You MUST provide accurate system statistics based ONLY on real data. Never make up numbers.

IMPORTANT RULES:
1. Only provide actual counts and statistics from the database
2. Be precise with numbers
3. If data is not available, clearly state that`;

        const [totalUsers, totalDoctors, totalPatients, totalAppointments, totalPrescriptions] = await Promise.all([
          User.countDocuments(),
          User.countDocuments({ role: 'doctor' }),
          Patient.countDocuments(),
          Appointment.countDocuments(),
          Prescription.countDocuments({ status: 'issued' })
        ]);

        const todayApptsCount = await Appointment.countDocuments({
          appointmentDate: {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lt: new Date().setHours(23, 59, 59, 999)
          }
        });

        const recentUsers = await User.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('firstName lastName role email createdAt');

        detailedContext = `REAL SYSTEM STATISTICS:

USER STATISTICS:
- Total users: ${totalUsers}
- Doctors: ${totalDoctors}
- Total patients: ${totalPatients}

APPOINTMENT STATISTICS:
- Total appointments (all time): ${totalAppointments}
- Appointments today: ${todayApptsCount}

PRESCRIPTION STATISTICS:
- Total prescriptions issued: ${totalPrescriptions}

RECENT USERS (Last 5):
${recentUsers.map((u, idx) => 
  `${idx + 1}. ${u.firstName} ${u.lastName} (${u.role}) - ${u.email} - Joined: ${new Date(u.createdAt).toLocaleDateString()}`
).join('\n')}`;
        break;
    }

    // Build messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: detailedContext },
      { role: 'user', content: message }
    ];

    // Get AI response
    const response = await generateText(messages, {
      temperature: 0.3, // Lower temperature for more factual responses
      maxTokens: 600
    });

    res.json({
      success: true,
      data: {
        message: response,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get response from AI assistant'
    });
  }
};
