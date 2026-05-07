const router = require('express').Router();
const { startIntake, sendMessage, completeIntake, getSession } = require('../controllers/intake.controller');
const { optionalAuth } = require('../middleware/optionalAuth.middleware');

// All intake routes are public (patients access via link without login)
// optionalAuth attaches req.user if a token is present, but never blocks
router.post('/start', optionalAuth, startIntake);
router.post('/:sessionId/message', optionalAuth, sendMessage);
router.post('/:sessionId/complete', optionalAuth, completeIntake);
router.get('/:sessionId', optionalAuth, getSession);

module.exports = router;
