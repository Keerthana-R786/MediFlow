const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const ApiError = require('../utils/ApiError');
const { sendPrescription } = require('../services/mail.service');

/**
 * Create or update prescription
 */
exports.createPrescription = async (req, res) => {
  const { appointmentId, diagnosis, medications, labTests, advice, followUpDate, followUpInstructions } = req.body;
  
  const appointment = await Appointment.findById(appointmentId).populate('patientId');
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  // Check if prescription already exists
  let prescription = await Prescription.findOne({ appointmentId });
  
  if (prescription) {
    // Update existing
    prescription.diagnosis = diagnosis;
    prescription.medications = medications;
    prescription.labTests = labTests;
    prescription.advice = advice;
    prescription.followUpDate = followUpDate;
    prescription.followUpInstructions = followUpInstructions;
    await prescription.save();
  } else {
    // Create new
    prescription = await Prescription.create({
      appointmentId,
      patientId: appointment.patientId._id,
      doctorId: req.user._id,
      diagnosis,
      medications,
      labTests,
      advice,
      followUpDate,
      followUpInstructions,
      status: 'draft',
    });
  }

  res.json({
    success: true,
    data: prescription,
  });
};

/**
 * Issue prescription (finalize)
 */
exports.issuePrescription = async (req, res) => {
  const { id } = req.params;
  
  const prescription = await Prescription.findById(id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId' }
    })
    .populate('doctorId')
    .populate('appointmentId');
    
  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }

  prescription.status = 'issued';
  await prescription.save();

  // Send prescription email to patient
  try {
    const patient = prescription.patientId;
    const patientUser = patient?.userId;
    const doctor = prescription.doctorId;
    const appointment = prescription.appointmentId;

    if (patientUser && patientUser.email) {
      await sendPrescription(patientUser, doctor, prescription, appointment);
      console.log(`[Prescription] Email sent to ${patientUser.email}`);
    } else {
      console.log('[Prescription] No patient email found');
    }
  } catch (emailError) {
    console.error('[Prescription] Failed to send email:', emailError);
    // Don't fail the request if email fails
  }

  res.json({
    success: true,
    data: prescription,
    message: 'Prescription issued successfully',
  });
};

/**
 * Get prescription by appointment
 */
exports.getPrescriptionByAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  
  const prescription = await Prescription.findOne({ appointmentId })
    .populate('patientId')
    .populate('doctorId', 'firstName lastName specialization')
    .populate('appointmentId');

  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }

  res.json({
    success: true,
    data: prescription,
  });
};

/**
 * Get all prescriptions for a patient
 */
exports.getPatientPrescriptions = async (req, res) => {
  const { patientId } = req.params;
  
  const prescriptions = await Prescription.find({ patientId, status: 'issued' })
    .populate('doctorId', 'firstName lastName specialization')
    .populate('appointmentId', 'appointmentDate')
    .sort({ issuedAt: -1 });

  res.json({
    success: true,
    data: prescriptions,
  });
};

/**
 * Get common medications (for autocomplete)
 */
exports.getCommonMedications = async (req, res) => {
  const { search } = req.query;
  
  // Common medications database (in production, this would be a separate collection)
  const commonMeds = [
    { name: 'Paracetamol', dosages: ['500mg', '650mg', '1000mg'] },
    { name: 'Ibuprofen', dosages: ['200mg', '400mg', '600mg'] },
    { name: 'Amoxicillin', dosages: ['250mg', '500mg'] },
    { name: 'Azithromycin', dosages: ['250mg', '500mg'] },
    { name: 'Metformin', dosages: ['500mg', '850mg', '1000mg'] },
    { name: 'Amlodipine', dosages: ['2.5mg', '5mg', '10mg'] },
    { name: 'Atorvastatin', dosages: ['10mg', '20mg', '40mg'] },
    { name: 'Omeprazole', dosages: ['20mg', '40mg'] },
    { name: 'Cetirizine', dosages: ['5mg', '10mg'] },
    { name: 'Aspirin', dosages: ['75mg', '150mg', '300mg'] },
  ];

  let filtered = commonMeds;
  if (search) {
    filtered = commonMeds.filter(med => 
      med.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.json({
    success: true,
    data: filtered,
  });
};
