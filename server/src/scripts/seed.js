require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Clinic = require('../models/Clinic');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const IntakeSession = require('../models/IntakeSession');
const PatientBrief = require('../models/PatientBrief');

const hash = (p) => bcrypt.hash(p, 12);

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    Clinic.deleteMany({}), User.deleteMany({}), Patient.deleteMany({}),
    Appointment.deleteMany({}), IntakeSession.deleteMany({}), PatientBrief.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Clinic
  const clinic = await Clinic.create({
    name: 'MediFlow Health Clinic',
    address: '42 Wellness Avenue, Chennai, Tamil Nadu 600001',
    phone: '+91 44 2345 6789',
    email: 'info@mediflow.health',
    specializations: ['General Medicine', 'Cardiology', 'Neurology'],
    workingHours: {
      monday:    { start: '09:00', end: '18:00', enabled: true },
      tuesday:   { start: '09:00', end: '18:00', enabled: true },
      wednesday: { start: '09:00', end: '18:00', enabled: true },
      thursday:  { start: '09:00', end: '18:00', enabled: true },
      friday:    { start: '09:00', end: '18:00', enabled: true },
      saturday:  { start: '09:00', end: '13:00', enabled: true },
      sunday:    { start: '09:00', end: '13:00', enabled: false },
    },
    slotDuration: 15,
    settings: { whatsappEnabled: false, emailNotifications: true, autoIntake: true },
  });

  // Admin
  const admin = await User.create({
    email: 'admin@mediflow.health',
    passwordHash: await hash('Admin@123'),
    role: 'admin',
    firstName: 'Arjun',
    lastName: 'Sharma',
    phone: '+91 98765 43210',
    clinicId: clinic._id,
    isEmailVerified: true,
  });

  // Doctors
  const doctor1 = await User.create({
    email: 'dr.priya@mediflow.health',
    passwordHash: await hash('Doctor@123'),
    role: 'doctor',
    firstName: 'Priya',
    lastName: 'Nair',
    phone: '+91 98765 11111',
    clinicId: clinic._id,
    isEmailVerified: true,
  });

  const doctor2 = await User.create({
    email: 'dr.rajan@mediflow.health',
    passwordHash: await hash('Doctor@123'),
    role: 'doctor',
    firstName: 'Rajan',
    lastName: 'Krishnamurthy',
    phone: '+91 98765 22222',
    clinicId: clinic._id,
    isEmailVerified: true,
  });

  // Receptionist
  const receptionist = await User.create({
    email: 'reception@mediflow.health',
    passwordHash: await hash('Recept@123'),
    role: 'receptionist',
    firstName: 'Meena',
    lastName: 'Sundaram',
    phone: '+91 98765 33333',
    clinicId: clinic._id,
    isEmailVerified: true,
  });

  // Patients
  const patientData = [
    { firstName: 'Kavitha', lastName: 'Ramesh', email: 'kavitha@example.com', dob: '1985-03-15', gender: 'female', blood: 'B+',
      conditions: [{ condition: 'Hypertension', diagnosedYear: '2018', notes: 'Controlled with medication' }],
      allergies: [{ substance: 'Penicillin', reaction: 'Rash', severity: 'moderate' }],
      meds: [{ name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', since: '2018' }] },
    { firstName: 'Suresh', lastName: 'Babu', email: 'suresh@example.com', dob: '1972-07-22', gender: 'male', blood: 'O+',
      conditions: [{ condition: 'Type 2 Diabetes', diagnosedYear: '2015', notes: 'Diet controlled' }],
      allergies: [],
      meds: [{ name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', since: '2015' }] },
    { firstName: 'Anitha', lastName: 'Venkatesh', email: 'anitha@example.com', dob: '1990-11-08', gender: 'female', blood: 'A+',
      conditions: [],
      allergies: [{ substance: 'Aspirin', reaction: 'Stomach upset', severity: 'mild' }],
      meds: [] },
    { firstName: 'Mohan', lastName: 'Das', email: 'mohan@example.com', dob: '1965-01-30', gender: 'male', blood: 'AB+',
      conditions: [
        { condition: 'Coronary Artery Disease', diagnosedYear: '2019', notes: 'Post-stent' },
        { condition: 'Hyperlipidemia', diagnosedYear: '2019', notes: '' },
      ],
      allergies: [],
      meds: [
        { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', since: '2019' },
        { name: 'Atorvastatin', dosage: '40mg', frequency: 'Once at night', since: '2019' },
      ] },
    { firstName: 'Lakshmi', lastName: 'Iyer', email: 'lakshmi@example.com', dob: '1998-05-20', gender: 'female', blood: 'O-',
      conditions: [{ condition: 'Asthma', diagnosedYear: '2005', notes: 'Mild intermittent' }],
      allergies: [{ substance: 'Dust', reaction: 'Wheezing', severity: 'moderate' }],
      meds: [{ name: 'Salbutamol inhaler', dosage: '100mcg', frequency: 'As needed', since: '2005' }] },
  ];

  const patientUsers = [];
  const patientProfiles = [];

  for (const pd of patientData) {
    const u = await User.create({
      email: pd.email,
      passwordHash: await hash('Patient@123'),
      role: 'patient',
      firstName: pd.firstName,
      lastName: pd.lastName,
      clinicId: clinic._id,
      isEmailVerified: true,
    });
    const p = await Patient.create({
      userId: u._id,
      dateOfBirth: new Date(pd.dob),
      gender: pd.gender,
      bloodGroup: pd.blood,
      medicalHistory: pd.conditions,
      allergies: pd.allergies,
      currentMedications: pd.meds,
      preferredLanguage: 'english',
    });
    patientUsers.push(u);
    patientProfiles.push(p);
  }

  // Appointments — today and next 3 days
  const today = new Date();
  const slots = ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15'];
  const types = ['consultation', 'follow-up', 'routine-checkup', 'consultation', 'consultation'];
  const complaints = [
    'Persistent headache for 3 days',
    'Follow-up for diabetes management',
    'Routine annual checkup',
    'Chest discomfort and shortness of breath',
    'Wheezing and difficulty breathing',
  ];

  const appointments = [];
  for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
    const apptDate = new Date(today);
    apptDate.setDate(today.getDate() + dayOffset);
    apptDate.setHours(9, 0, 0, 0);

    for (let i = 0; i < patientProfiles.length; i++) {
      const doctor = i % 2 === 0 ? doctor1 : doctor2;
      const appt = await Appointment.create({
        patientId: patientProfiles[i]._id,
        doctorId: doctor._id,
        clinicId: clinic._id,
        appointmentDate: apptDate,
        slot: { startTime: slots[i], endTime: slots[i + 1] || '11:15' },
        type: types[i],
        chiefComplaint: complaints[i],
        tokenNumber: i + 1,
        status: dayOffset === 0 && i < 2 ? 'checked-in' : 'scheduled',
      });
      appointments.push(appt);
    }
  }

  // 3 completed intake sessions with briefs for today's first 3 appointments
  const sampleMessages = [
    [
      { role: 'assistant', content: 'Hello! I\'m here to help prepare for your visit. Can you tell me what\'s been bothering you today?' },
      { role: 'patient', content: 'I\'ve been having a severe headache for the past 3 days. It started on the left side and now covers my whole head.' },
      { role: 'assistant', content: 'I\'m sorry to hear that. On a scale of 1 to 10, how would you rate the pain right now?' },
      { role: 'patient', content: 'About a 7. It\'s throbbing and gets worse when I move around.' },
      { role: 'assistant', content: 'Is the headache accompanied by any nausea, vomiting, or sensitivity to light or sound?' },
      { role: 'patient', content: 'Yes, I feel nauseous and bright lights make it much worse.' },
      { role: 'assistant', content: 'Have you taken any medications for this headache? If so, did they help?' },
      { role: 'patient', content: 'I took paracetamol but it only helped a little for about 2 hours.' },
      { role: 'assistant', content: 'Have you had headaches like this before, or is this a new pattern for you?' },
      { role: 'patient', content: 'I get occasional headaches but never this severe or this long.' },
      { role: 'assistant', content: 'Is there anything else you\'d like the doctor to know before your visit?' },
      { role: 'patient', content: 'I\'ve also been under a lot of stress at work lately.' },
    ],
  ];

  for (let i = 0; i < Math.min(3, appointments.length); i++) {
    const msgs = sampleMessages[0].map((m) => ({ ...m, timestamp: new Date() }));
    const session = await IntakeSession.create({
      appointmentId: appointments[i]._id,
      patientId: appointments[i].patientId,
      channel: 'web',
      status: 'completed',
      language: 'english',
      messages: msgs,
      urgencyScore: i === 3 ? 8 : 4,
      urgencyLevel: i === 3 ? 'high' : 'moderate',
      completedAt: new Date(),
    });

    await Appointment.findByIdAndUpdate(appointments[i]._id, { intakeSessionId: session._id });

    const brief = await PatientBrief.create({
      appointmentId: appointments[i]._id,
      patientId: appointments[i].patientId,
      doctorId: appointments[i].doctorId,
      status: 'ready',
      chiefComplaint: complaints[i % complaints.length],
      symptomSummary: 'Patient presents with a 3-day history of severe throbbing headache, initially left-sided, now generalised. Pain rated 7/10, worsened by movement and light. Associated nausea and photophobia noted.',
      clinicalTimeline: 'Day 1: Onset of left-sided headache. Day 2: Headache spread to whole head, nausea began. Day 3: Photophobia developed, paracetamol providing minimal relief.',
      relevantHistory: 'No prior history of migraines. Currently on Amlodipine 5mg for hypertension. Allergic to Penicillin (rash).',
      currentMedications: ['Amlodipine 5mg once daily'],
      allergies: ['Penicillin — rash (moderate)'],
      riskFlags: [
        { flag: 'New onset severe headache', severity: 'moderate', notes: 'Pattern change from usual headaches warrants investigation' },
        { flag: 'Photophobia with nausea', severity: 'moderate', notes: 'Meningeal irritation signs should be assessed' },
      ],
      suggestedFocusAreas: ['Neurological examination', 'Blood pressure assessment', 'Fundoscopy if available'],
      suggestedTests: ['CBC and ESR', 'CT head if neurological signs present'],
      differentialClusters: ['Migraine with aura', 'Tension-type headache', 'Secondary headache (hypertensive)'],
      urgencyScore: 5,
      urgencyLevel: 'moderate',
      interviewQuality: 'complete',
      generatedAt: new Date(),
    });

    await Appointment.findByIdAndUpdate(appointments[i]._id, { patientBriefId: brief._id });
  }

  console.log('\n========== SEED COMPLETE ==========');
  console.log('Clinic: MediFlow Health Clinic');
  console.log('\nCredentials:');
  console.log('  Admin:        admin@mediflow.health       / Admin@123');
  console.log('  Doctor 1:     dr.priya@mediflow.health    / Doctor@123');
  console.log('  Doctor 2:     dr.rajan@mediflow.health    / Doctor@123');
  console.log('  Receptionist: reception@mediflow.health   / Recept@123');
  console.log('  Patient 1:    kavitha@example.com         / Patient@123');
  console.log('  Patient 2:    suresh@example.com          / Patient@123');
  console.log('  Patient 3:    anitha@example.com          / Patient@123');
  console.log('  Patient 4:    mohan@example.com           / Patient@123');
  console.log('  Patient 5:    lakshmi@example.com         / Patient@123');
  console.log('====================================\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });
