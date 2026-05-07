const router = require('express').Router();
const { getBrief, regenerateBrief, addDoctorNotes, markAsRead } = require('../controllers/brief.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/:appointmentId', getBrief);
router.post('/:appointmentId/generate', authorize('doctor', 'admin'), regenerateBrief);
router.put('/:briefId/notes', authorize('doctor'), addDoctorNotes);
router.put('/:briefId/read', authorize('doctor'), markAsRead);

module.exports = router;
