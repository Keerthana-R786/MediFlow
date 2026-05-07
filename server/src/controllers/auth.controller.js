const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Clinic = require('../models/Clinic');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const mailService = require('../services/mail.service');

const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, role, clinicId, dateOfBirth, gender } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);

  // Determine clinic
  let resolvedClinicId = clinicId;
  if (!resolvedClinicId) {
    const defaultClinic = await Clinic.findOne();
    if (defaultClinic) resolvedClinicId = defaultClinic._id;
  }

  const user = await User.create({
    email, passwordHash, firstName, lastName, phone,
    role: role || 'patient',
    clinicId: resolvedClinicId,
    isEmailVerified: true,
  });

  // Create patient profile if role is patient
  if (user.role === 'patient') {
    await Patient.create({
      userId: user._id,
      dateOfBirth: dateOfBirth || null,
      gender: gender || '',
      preferredLanguage: 'english',
    });
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json(new ApiResponse(201, {
    accessToken,
    user: { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, clinicId: user.clinicId },
  }, 'Registration successful'));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');

  const valid = await user.comparePassword(password);
  if (!valid) throw new ApiError(401, 'Invalid credentials');

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json(new ApiResponse(200, {
    accessToken,
    user: { _id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, clinicId: user.clinicId, profilePhoto: user.profilePhoto },
  }, 'Login successful'));
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new ApiError(401, 'Refresh token required');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);
  if (!user || user.refreshToken !== token) throw new ApiError(401, 'Invalid refresh token');

  const accessToken = generateAccessToken(user._id, user.role);
  res.json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET).catch(() => null);
    if (decoded) {
      await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
    }
  }
  res.clearCookie('refreshToken');
  res.json(new ApiResponse(200, null, 'Logged out'));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    return res.json(new ApiResponse(200, null, 'If that email exists, a reset link has been sent'));
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = token;
  user.passwordResetExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  // In production, send email with reset link
  res.json(new ApiResponse(200, { resetToken: token }, 'Reset token generated'));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpiry: { $gt: Date.now() },
  });
  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();

  res.json(new ApiResponse(200, null, 'Password reset successful'));
});

const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  let patientProfile = null;
  if (user.role === 'patient') {
    patientProfile = await Patient.findOne({ userId: user._id }).lean();
  }
  res.json(new ApiResponse(200, { user, patientProfile }));
});

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, getMe };
