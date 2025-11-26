const express = require('express');
const router = express.Router();
const PlantaController = require('../controllers/PlantaController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', PlantaController.index);
router.get('/create', PlantaController.create);
router.post('/', PlantaController.store);

module.exports = router;
