const router = require('express').Router();
const { getDoctors, createAppointment, listAppointments, getAppointment, updateStatus, getTodayAppointments, getQueue } = require('../controllers/appointment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { optionalAuth } = require('../middleware/optionalAuth.middleware');

// Most routes require authentication
router.get('/doctors', authenticate, getDoctors);
router.post('/', authenticate, createAppointment);
router.get('/', authenticate, listAppointments);
router.get('/today', authenticate, getTodayAppointments);
router.get('/queue', authenticate, getQueue);
router.put('/:id/status', authenticate, updateStatus);

// Public route for intake flow (patients access via email link)
router.get('/:id', optionalAuth, getAppointment);

module.exports = router;
