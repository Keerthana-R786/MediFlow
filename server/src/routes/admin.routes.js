const router = require('express').Router();
const { getStats, listUsers, createUser, updateUser, deactivateUser, getClinic, updateClinic } = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deactivateUser);
router.get('/clinic', getClinic);
router.put('/clinic', updateClinic);

module.exports = router;
