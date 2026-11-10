const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', routeController.getRoutes);
router.get('/cities', routeController.getCities);
router.get('/:id', routeController.getRouteById);

router.post('/', authenticate, authorize('operator', 'admin'), routeController.createRoute);

module.exports = router;

