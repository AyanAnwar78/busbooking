const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');

router.get('/', optionalAuth, busController.getBuses);
router.get('/:id', busController.getBusById);

router.post('/', authenticate, authorize('operator', 'admin'), busController.createBus);

module.exports = router;

