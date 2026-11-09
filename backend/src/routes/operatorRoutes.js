const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', operatorController.getOperators);
router.get('/:id', operatorController.getOperatorById);
router.post('/', authenticate, authorize('admin'), operatorController.createOperator);

module.exports = router;

