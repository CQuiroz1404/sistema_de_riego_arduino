const express = require('express');
const router = express.Router();
const InvernaderoController = require('../controllers/InvernaderoController');
const CalendarioController = require('../controllers/CalendarioController');
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
router.post('/:id', InvernaderoController.update); // Usando POST para update por simplicidad en forms HTML
router.delete('/:id', InvernaderoController.destroy);

// Rutas de Calendario para Invernadero
router.get('/:invernaderoId/calendario', CalendarioController.getByInvernadero);
router.get('/:invernaderoId/calendario/create', CalendarioController.create);
router.post('/:invernaderoId/calendario', CalendarioController.store);
router.post('/:invernaderoId/calendario/:id/delete', CalendarioController.delete); // Usando POST para delete desde form simple

// Rutas de Historial para Invernadero
router.get('/:invernaderoId/historial', HistorialController.getByInvernadero);

module.exports = router;
