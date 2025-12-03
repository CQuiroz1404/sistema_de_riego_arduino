const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

// Crear carpeta de uploads si no existe
const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    logger.info('Carpeta de avatars creada: ' + uploadDir);
  }
} catch (error) {
  logger.error('Error al crear carpeta de uploads: %o', error);
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('MULTER: Setting destination for file:', file.originalname);
    console.log('MULTER: Destination directory:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único: user_id_timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `user_${req.user.id}_${uniqueSuffix}${ext}`;
    console.log('MULTER: Generated filename:', filename);
    cb(null, filename);
  }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
  console.log('MULTER: Filtering file:', file.originalname, 'MIME:', file.mimetype);
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log('MULTER: File accepted');
    return cb(null, true);
  } else {
    console.log('MULTER: File rejected - invalid type');
    cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;
