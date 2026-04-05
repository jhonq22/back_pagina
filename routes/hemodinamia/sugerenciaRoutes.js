const express = require('express');
const router = express.Router();
const sugerenciasController = require('../../controllers/hemodinamia/sugerenciasController');

// Rutas de Sugerencias
router.post('/', sugerenciasController.saveSugerencias);
router.get('/paciente/:solicitudId', sugerenciasController.getSugerenciasBySolicitud);

module.exports = router;