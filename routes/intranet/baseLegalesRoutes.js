const express = require('express');
const router = express.Router();
const BaseLegalesController = require('../../controllers/intranet/BaseLegalesController');

// --- RUTAS DE ARCHIVOS ---
// Nota: El form-data desde el frontend debe enviar el key como "archivo"
router.post('/upload', BaseLegalesController.uploadMiddleware.single('archivo'), BaseLegalesController.uploadArchivo);
router.get('/ver/:nombre', BaseLegalesController.verArchivo);

// --- RUTAS CRUD BASE LEGALES ---
router.get('/', BaseLegalesController.getBaseLegales);
router.post('/save', BaseLegalesController.saveBaseLegal);
router.delete('/:id', BaseLegalesController.deleteBaseLegal);

module.exports = router;