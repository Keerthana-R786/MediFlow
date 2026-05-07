const router = require('express').Router();
const { listPatients, getPatient, updatePatient, getPatientAppointments, getPatientBriefs } = require('../controllers/patient.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

// List all patients — staff only
router.get('/', authorize('doctor', 'receptionist', 'admin'), listPatients);

// Patient can access their own profile and appointments
// Staff can access any patient
router.get('/:id', getPatient);
router.put('/:id', updatePatient);
router.get('/:id/appointments', getPatientAppointments);
router.get('/:id/briefs', getPatientBriefs);

module.exports = router;
