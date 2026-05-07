const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const IntakeSession = require('../models/IntakeSession');
const PatientBrief = require('../models/PatientBrief');
const Clinic = require('../models/Clinic');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getStats = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const today = new Date();
  const start = new Date(today); start.setHours(0, 0, 0, 0);
  const end = new Date(today); end.setHours(23, 59, 59, 999);

  const [totalPatients, appointmentsToday, completedIntakes, totalIntakes, briefs] = await Promise.all([
    User.countDocuments({ role: 'patient', clinicId }),
    Appointment.countDocuments({ clinicId, appointmentDate: { $gte: start, $lte: end } }),
    IntakeSession.countDocuments({ status: 'completed' }),
    IntakeSession.countDocuments({}),
    PatientBrief.find({ status: 'ready' }).select('generatedAt createdAt').lean(),
  ]);

  const avgGenTime = briefs.length
    ? briefs.reduce((acc, b) => acc + (new Date(b.generatedAt) - new Date(b.createdAt)), 0) / briefs.length / 1000
    : 0;

  // Last 30 days appointments
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const appointmentsByDay = await Appointment.aggregate([
    { $match: { clinicId, appointmentDate: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const urgencyDist = await PatientBrief.aggregate([
    { $match: { status: 'ready' } },
    { $group: { _id: '$urgencyLevel', count: { $sum: 1 } } },
  ]);

  res.json(new ApiResponse(200, {
    totalPatients,
    appointmentsToday,
    intakeCompletionRate: totalIntakes ? Math.round((completedIntakes / totalIntakes) * 100) : 0,
    avgBriefGenTime: Math.round(avgGenTime),
    appointmentsByDay,
    urgencyDist,
  }));
});

const listUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  const query = { clinicId: req.user.clinicId };
  if (role) query.role = role;

  const [users, total] = await Promise.all([
    User.find(query).select('-passwordHash -refreshToken').skip(skip).limit(parseInt(limit)).lean(),
    User.countDocuments(query),
  ]);

  res.json(new ApiResponse(200, { users, total }));
});

const createUser = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    email, passwordHash, firstName, lastName, phone,
    role, clinicId: req.user.clinicId, isEmailVerified: true,
  });

  res.status(201).json(new ApiResponse(201,
    { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    'User created'
  ));
});

const updateUser = asyncHandler(async (req, res) => {
  const { password, ...updates } = req.body;
  if (password) updates.passwordHash = await bcrypt.hash(password, 12);

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
    .select('-passwordHash -refreshToken');
  if (!user) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, user, 'User updated'));
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, null, 'User deactivated'));
});

const getClinic = asyncHandler(async (req, res) => {
  const clinic = await Clinic.findById(req.user.clinicId);
  if (!clinic) throw new ApiError(404, 'Clinic not found');
  res.json(new ApiResponse(200, clinic));
});

const updateClinic = asyncHandler(async (req, res) => {
  const clinic = await Clinic.findByIdAndUpdate(req.user.clinicId, req.body, { new: true, runValidators: true });
  if (!clinic) throw new ApiError(404, 'Clinic not found');
  res.json(new ApiResponse(200, clinic, 'Clinic updated'));
});

module.exports = { getStats, listUsers, createUser, updateUser, deactivateUser, getClinic, updateClinic };
