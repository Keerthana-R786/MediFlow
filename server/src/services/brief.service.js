const IntakeSession = require('../models/IntakeSession');
const PatientBrief = require('../models/PatientBrief');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { generateBrief } = require('./gemini.service');
const mailService = require('./mail.service');

const buildPatientProfile = async (patientId) => {
  const patient = await Patient.findById(patientId).lean();
  const user = await User.findById(patient.userId).select('firstName lastName email phone').lean();
  return { ...patient, user };
};

const buildTranscript = (messages) => {
  return messages
    .map((m) => `${m.role === 'assistant' ? 'Medical Assistant' : 'Patient'}: ${m.content}`)
    .join('\n');
};

const generateAndSaveBrief = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId).populate('intakeSessionId');
  if (!appointment) throw new Error('Appointment not found');

  const session = appointment.intakeSessionId;
  if (!session) throw new Error('No intake session found');

  // Create or update brief record with generating status
  let brief = await PatientBrief.findOne({ appointmentId });
  if (!brief) {
    brief = await PatientBrief.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      status: 'generating',
    });
    await Appointment.findByIdAndUpdate(appointmentId, { patientBriefId: brief._id });
  } else {
    brief.status = 'generating';
    await brief.save();
  }

  try {
    const patientProfile = await buildPatientProfile(appointment.patientId);
    const transcript = buildTranscript(session.messages);
    const { parsed, raw } = await generateBrief(patientProfile, transcript);

    brief.set({
      status: 'ready',
      chiefComplaint: parsed.chiefComplaint,
      symptomSummary: parsed.symptomSummary,
      clinicalTimeline: parsed.clinicalTimeline,
      relevantHistory: parsed.relevantHistory,
      currentMedications: parsed.currentMedications || [],
      allergies: parsed.allergies || [],
      riskFlags: parsed.riskFlags || [],
      suggestedFocusAreas: parsed.suggestedFocusAreas || [],
      suggestedTests: parsed.suggestedTests || [],
      differentialClusters: parsed.differentialClusters || [],
      urgencyScore: parsed.urgencyScore,
      urgencyLevel: parsed.urgencyLevel,
      interviewQuality: parsed.interviewQuality,
      rawAIResponse: raw,
      generatedAt: new Date(),
    });
    await brief.save();

    // Notify doctor
    const doctor = await User.findById(appointment.doctorId).lean();
    const patientUser = await User.findById(patientProfile.userId).lean();
    if (doctor && doctor.email) {
      await mailService.sendBriefReadyAlert(doctor, patientUser, appointment, brief);
    }

    return brief;
  } catch (err) {
    brief.status = 'failed';
    await brief.save();
    throw err;
  }
};

module.exports = { generateAndSaveBrief };
