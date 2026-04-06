const express = require('express');
const router = express.Router();
const controller = require('../../controllers/hemodinamia/ExamenFisicoHemodinamia');

// Ruta para Guardado y Actualización (Upsert de Examen Físico y Laboratorios juntos)
router.post('/examen-fisico', controller.saveExamenFisico);

// Ruta para obtener la data guardada de la solicitud
router.get('/examen-fisico/:solicitudId', controller.getExamenFisicoBySolicitud);

module.exports = router;