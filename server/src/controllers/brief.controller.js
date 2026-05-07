const PatientBrief = require('../models/PatientBrief');
const Appointment = require('../models/Appointment');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateAndSaveBrief } = require('../services/brief.service');

const getBrief = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  let brief = await PatientBrief.findOne({ appointmentId })
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'firstName lastName email phone' },
    })
    .populate('doctorId', 'firstName lastName')
    .lean();

  if (!brief) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) throw new ApiError(404, 'Appointment not found');
    if (!appointment.intakeSessionId) throw new ApiError(400, 'Intake not completed yet');

    generateAndSaveBrief(appointmentId).catch((e) =>
      console.error('Brief generation failed:', e.message)
    );
    return res.status(202).json(new ApiResponse(202, { status: 'generating' }, 'Brief generation started'));
  }

  if (brief.status === 'generating') {
    return res.status(202).json(new ApiResponse(202, { status: 'generating' }, 'Brief is being generated'));
  }

  // Audit log
  await AuditLog.create({
    userId: req.user._id,
    action: 'VIEW_BRIEF',
    resource: 'PatientBrief',
    resourceId: brief._id,
    ip: req.ip,
  });

  res.json(new ApiResponse(200, brief));
});

const regenerateBrief = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  // Reset status so polling works
  await PatientBrief.findOneAndUpdate({ appointmentId }, { status: 'generating' });
  generateAndSaveBrief(appointmentId).catch((e) =>
    console.error('Brief regeneration failed:', e.message)
  );
  res.json(new ApiResponse(202, { status: 'generating' }, 'Brief regeneration started'));
});

const addDoctorNotes = asyncHandler(async (req, res) => {
  const { briefId } = req.params;
  const { notes } = req.body;
  const brief = await PatientBrief.findByIdAndUpdate(briefId, { doctorNotes: notes }, { new: true });
  if (!brief) throw new ApiError(404, 'Brief not found');
  res.json(new ApiResponse(200, brief, 'Notes saved'));
});

const markAsRead = asyncHandler(async (req, res) => {
  const { briefId } = req.params;
  const brief = await PatientBrief.findByIdAndUpdate(
    briefId, { isRead: true, readAt: new Date() }, { new: true }
  );
  if (!brief) throw new ApiError(404, 'Brief not found');
  res.json(new ApiResponse(200, brief, 'Marked as read'));
});

module.exports = { getBrief, regenerateBrief, addDoctorNotes, markAsRead };
