const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const mailService = require('../services/mail.service');

// Reusable deep-populate for appointments
const populateAppointment = (query) =>
  query
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'firstName lastName email phone' } })
    .populate('doctorId', 'firstName lastName email')
    .populate('intakeSessionId', 'status urgencyLevel urgencyScore')
    .populate('patientBriefId', 'status urgencyLevel isRead urgencyScore chiefComplaint');

// GET /appointments/doctors — list doctors in the same clinic (accessible to receptionist)
const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await User.find({
    role: 'doctor',
    clinicId: req.user.clinicId,
    isActive: true,
  }).select('firstName lastName email').lean();
  res.json(new ApiResponse(200, doctors));
});

const createAppointment = asyncHandler(async (req, res) => {
  const { patientId, doctorId, appointmentDate, slot, type, chiefComplaint } = req.body;
  const clinicId = req.user.clinicId;

  // Auto-assign token number for the day
  const dayStart = new Date(appointmentDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(appointmentDate);
  dayEnd.setHours(23, 59, 59, 999);

  const count = await Appointment.countDocuments({
    clinicId,
    appointmentDate: { $gte: dayStart, $lte: dayEnd },
  });

  const appointment = await Appointment.create({
    patientId, doctorId, clinicId,
    appointmentDate, slot, type: type || 'consultation',
    chiefComplaint, tokenNumber: count + 1,
  });

  // Send confirmation email async — don't block response
  try {
    const patient = await Patient.findById(patientId).populate('userId', 'firstName lastName email').lean();
    const doctor = await User.findById(doctorId).lean();
    const intakeLink = `${process.env.CLIENT_URL}/intake/${appointment._id}`;
    console.log('[EMAIL] Generated intake link:', intakeLink);
    console.log('[EMAIL] Appointment ID:', appointment._id);
    console.log('[EMAIL] Patient userId populated:', JSON.stringify(patient?.userId));
    console.log('[EMAIL] Sending to:', patient?.userId?.email);
    if (patient?.userId?.email) {
      await mailService.sendAppointmentConfirmation(patient.userId, doctor, appointment, intakeLink);
      console.log('[EMAIL] Confirmation sent to:', patient.userId.email);
    } else {
      console.log('[EMAIL] No email found on patient — skipping');
    }
  } catch (e) {
    console.error('[EMAIL] Send failed:', e.message, e.stack);
  }

  const populated = await populateAppointment(Appointment.findById(appointment._id)).lean();
  res.status(201).json(new ApiResponse(201, populated, 'Appointment created'));
});

const listAppointments = asyncHandler(async (req, res) => {
  const { date, doctorId, status, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const query = { clinicId: req.user.clinicId };
  if (req.user.role === 'doctor') query.doctorId = req.user._id;
  else if (doctorId) query.doctorId = doctorId;
  if (status) query.status = status;

  if (date) {
    const d = new Date(date);
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setHours(23, 59, 59, 999);
    query.appointmentDate = { $gte: start, $lte: end };
  }

  const [appointments, total] = await Promise.all([
    populateAppointment(Appointment.find(query))
      .sort({ appointmentDate: 1, 'slot.startTime': 1 })
      .skip(skip).limit(parseInt(limit)).lean(),
    Appointment.countDocuments(query),
  ]);

  res.json(new ApiResponse(200, { appointments, total, page: parseInt(page), limit: parseInt(limit) }));
});

const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await populateAppointment(Appointment.findById(req.params.id)).lean();
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  res.json(new ApiResponse(200, appointment));
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id, { status }, { new: true }
  );
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  res.json(new ApiResponse(200, appointment, 'Status updated'));
});

const getTodayAppointments = asyncHandler(async (req, res) => {
  const today = new Date();
  const start = new Date(today); start.setHours(0, 0, 0, 0);
  const end = new Date(today); end.setHours(23, 59, 59, 999);

  const query = {
    clinicId: req.user.clinicId,
    appointmentDate: { $gte: start, $lte: end },
  };
  if (req.user.role === 'doctor') query.doctorId = req.user._id;

  const appointments = await populateAppointment(Appointment.find(query))
    .sort({ 'slot.startTime': 1 })
    .lean();

  res.json(new ApiResponse(200, appointments));
});

const getQueue = asyncHandler(async (req, res) => {
  const today = new Date();
  const start = new Date(today); start.setHours(0, 0, 0, 0);
  const end = new Date(today); end.setHours(23, 59, 59, 999);

  const appointments = await populateAppointment(
    Appointment.find({
      clinicId: req.user.clinicId,
      appointmentDate: { $gte: start, $lte: end },
      status: { $in: ['scheduled', 'checked-in', 'in-progress'] },
    })
  )
    .sort({ 'slot.startTime': 1 })
    .lean();

  res.json(new ApiResponse(200, appointments));
});

module.exports = { getDoctors, createAppointment, listAppointments, getAppointment, updateStatus, getTodayAppointments, getQueue };
