const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Perfil
router.get('/', ProfileController.index);
router.put('/update', ProfileController.update);
router.put('/change-password', ProfileController.changePassword);
router.post('/upload-avatar', upload.single('avatar'), ProfileController.uploadAvatar);
router.delete('/delete-avatar', ProfileController.deleteAvatar);

module.exports = router;
