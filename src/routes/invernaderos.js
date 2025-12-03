const express = require('express');
const router = express.Router();
const InvernaderoController = require('../controllers/InvernaderoController');
const ScheduleController = require('../controllers/ScheduleController');
const HistorialController = require('../controllers/HistorialController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', InvernaderoController.index);
router.get('/create', InvernaderoController.create);
router.post('/', InvernaderoController.store);
router.get('/:id/virtual', InvernaderoController.virtualView);
router.get('/:id/environment', InvernaderoController.getEnvironment);
router.get('/:id/actuators', InvernaderoController.getActuators);
router.get('/:id', InvernaderoController.show);
router.get('/:id/edit', InvernaderoController.edit);
router.post('/:id/riego', InvernaderoController.toggleRiego);
router.post('/:id', InvernaderoController.update); // Using POST for update (HTML form simplicity)
router.delete('/:id', InvernaderoController.destroy);

// Schedule routes for greenhouse
router.get('/:greenhouseId/schedule', ScheduleController.getByGreenhouse);
router.get('/:greenhouseId/schedule/create', ScheduleController.create);
router.post('/:greenhouseId/schedule', ScheduleController.store);
router.post('/:greenhouseId/schedule/:id/delete', ScheduleController.delete); // Using POST for delete (HTML form)

// History routes for greenhouse
router.get('/:invernaderoId/historial', HistorialController.getByInvernadero);

module.exports = router;
