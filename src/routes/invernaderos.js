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
router.get('/:id', InvernaderoController.show);
router.get('/:id/edit', InvernaderoController.edit);
router.post('/:id', InvernaderoController.update); // Using POST for update (HTML form simplicity)
router.delete('/:id', InvernaderoController.destroy);

// Schedule routes for greenhouse (migrated from CalendarioController)
router.get('/:greenhouseId/calendario', ScheduleController.getByGreenhouse);
router.get('/:greenhouseId/calendario/create', ScheduleController.create);
router.post('/:greenhouseId/calendario', ScheduleController.store);
router.post('/:greenhouseId/calendario/:id/delete', ScheduleController.delete); // Using POST for delete (HTML form)

// History routes for greenhouse
router.get('/:invernaderoId/historial', HistorialController.getByInvernadero);

module.exports = router;
