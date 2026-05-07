const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const PatientBrief = require('../models/PatientBrief');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const listPatients = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let userQuery = { role: 'patient', isActive: true };
  if (req.user.clinicId) userQuery.clinicId = req.user.clinicId;

  if (search) {
    userQuery.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName:  { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(userQuery).select('-passwordHash -refreshToken').lean();
  const userIds = users.map((u) => u._id);

  const patients = await Patient.find({ userId: { $in: userIds } })
    .skip(skip).limit(parseInt(limit)).lean();

  const result = patients.map((p) => {
    const user = users.find((u) => u._id.toString() === p.userId.toString());
    return {
      ...p,
      user,
      // Flatten for easy access in frontend dropdowns
      firstName: user?.firstName,
      lastName:  user?.lastName,
      email:     user?.email,
    };
  });

  const total = await Patient.countDocuments({ userId: { $in: userIds } });
  res.json(new ApiResponse(200, { patients: result, total, page: parseInt(page), limit: parseInt(limit) }));
});

const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate('userId', '-passwordHash -refreshToken')
    .lean();
  if (!patient) throw new ApiError(404, 'Patient not found');
  res.json(new ApiResponse(200, patient));
});

const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!patient) throw new ApiError(404, 'Patient not found');
  res.json(new ApiResponse(200, patient, 'Patient updated'));
});

const getPatientAppointments = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new ApiError(404, 'Patient not found');

  const appointments = await Appointment.find({ patientId: req.params.id })
    .populate('doctorId', 'firstName lastName')
    .populate('intakeSessionId', 'status urgencyLevel')
    .populate('patientBriefId', 'status urgencyLevel isRead')
    .sort({ appointmentDate: -1 })
    .lean();

  res.json(new ApiResponse(200, appointments));
});

const getPatientBriefs = asyncHandler(async (req, res) => {
  const briefs = await PatientBrief.find({ patientId: req.params.id })
    .populate('appointmentId')
    .sort({ createdAt: -1 })
    .lean();
  res.json(new ApiResponse(200, briefs));
});

module.exports = { listPatients, getPatient, updatePatient, getPatientAppointments, getPatientBriefs };
