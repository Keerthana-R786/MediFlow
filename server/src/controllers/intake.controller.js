const IntakeSession = require('../models/IntakeSession');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { conductInterview } = require('../services/gemini.service');
const { generateAndSaveBrief } = require('../services/brief.service');

const startIntake = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;
  const appointment = await Appointment.findById(appointmentId)
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'firstName lastName' } })
    .populate('doctorId', 'firstName lastName');
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  let session = await IntakeSession.findOne({ appointmentId });
  if (session && session.status === 'completed') {
    return res.json(new ApiResponse(200, { sessionId: session._id, message: null, completed: true, session }, 'Intake already completed'));
  }

  if (!session) {
    const patient = await Patient.findById(appointment.patientId).lean();
    session = await IntakeSession.create({
      appointmentId,
      patientId: appointment.patientId,
      channel: 'web',
      status: 'in-progress',
      language: (patient && patient.preferredLanguage) ? patient.preferredLanguage : 'english',
    });
    await Appointment.findByIdAndUpdate(appointmentId, { intakeSessionId: session._id });
  }

  const patientData = appointment.patientId || {};
  const patientUser = patientData.userId || {};
  const patientContext = {
    name: ((patientUser.firstName || 'Patient') + ' ' + (patientUser.lastName || '')).trim(),
    chiefComplaint: appointment.chiefComplaint || 'Not specified',
    appointmentType: appointment.type,
    doctor: ('Dr. ' + ((appointment.doctorId ? appointment.doctorId.firstName + ' ' + appointment.doctorId.lastName : ''))).trim(),
    language: session.language,
  };

  if (session.messages && session.messages.length > 0) {
    const msgs = session.messages.slice().reverse();
    const last = msgs.find(function(m) { return m.role === 'assistant'; });
    return res.json(new ApiResponse(200, { sessionId: session._id, message: last ? last.content : '', emergencyFlag: null, session }, 'Intake resumed'));
  }

  const result = await conductInterview([], patientContext);
  session.messages.push({ role: 'assistant', content: result.text });
  session.status = 'in-progress';
  await session.save();
  res.json(new ApiResponse(200, { sessionId: session._id, message: result.text, emergencyFlag: result.emergencyFlag, session }, 'Intake started'));
});

const sendMessage = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { content } = req.body;
  if (!content || !content.trim()) throw new ApiError(400, 'Message content required');

  const session = await IntakeSession.findById(sessionId);
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.status === 'completed') throw new ApiError(400, 'Intake already completed');

  session.messages.push({ role: 'patient', content: content.trim() });

  const appointment = await Appointment.findById(session.appointmentId)
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'firstName lastName' } })
    .populate('doctorId', 'firstName lastName');

  const patientData = (appointment && appointment.patientId) ? appointment.patientId : {};
  const patientUser = patientData.userId || {};
  const patientContext = {
    name: ((patientUser.firstName || 'Patient') + ' ' + (patientUser.lastName || '')).trim(),
    chiefComplaint: (appointment && appointment.chiefComplaint) ? appointment.chiefComplaint : 'Not specified',
    appointmentType: appointment ? appointment.type : 'consultation',
    doctor: ('Dr. ' + (appointment && appointment.doctorId ? appointment.doctorId.firstName + ' ' + appointment.doctorId.lastName : '')).trim(),
    language: session.language,
  };

  const result = await conductInterview(
    session.messages.map(function(m) { return { role: m.role, content: m.content }; }),
    patientContext
  );

  session.messages.push({ role: 'assistant', content: result.text });

  if (result.interviewComplete) {
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();
    generateAndSaveBrief(session.appointmentId).catch(function(e) { console.error('Brief gen failed:', e.message); });
  } else {
    await session.save();
  }

  res.json(new ApiResponse(200, { message: result.text, emergencyFlag: result.emergencyFlag, interviewComplete: !!result.interviewComplete, messageCount: session.messages.length }));
});

const completeIntake = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await IntakeSession.findById(sessionId);
  if (!session) throw new ApiError(404, 'Session not found');
  session.status = 'completed';
  session.completedAt = new Date();
  await session.save();
  generateAndSaveBrief(session.appointmentId).catch(function(e) { console.error('Brief gen failed:', e.message); });
  res.json(new ApiResponse(200, session, 'Intake completed'));
});

const getSession = asyncHandler(async (req, res) => {
  const session = await IntakeSession.findById(req.params.sessionId);
  if (!session) throw new ApiError(404, 'Session not found');
  res.json(new ApiResponse(200, session));
});

module.exports = { startIntake, sendMessage, completeIntake, getSession };
