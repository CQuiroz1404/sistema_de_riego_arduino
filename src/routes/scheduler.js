const express = require('express');
const router = express.Router();
const schedulerService = require('../services/schedulerService');
const { verifyToken } = require('../middleware/auth');

/**
 * Obtiene estadísticas del scheduler
 * GET /api/scheduler/stats
 */
router.get('/stats', verifyToken, (req, res) => {
  try {
    const stats = schedulerService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del scheduler'
    });
  }
});

/**
 * Reinicia el scheduler manualmente (solo admin)
 * POST /api/scheduler/restart
 */
router.post('/restart', verifyToken, (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden reiniciar el scheduler'
      });
    }

    schedulerService.stop();
    schedulerService.start();

    res.json({
      success: true,
      message: 'Scheduler reiniciado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al reiniciar scheduler'
    });
  }
});

module.exports = router;
