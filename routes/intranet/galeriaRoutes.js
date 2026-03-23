const express = require('express');
const router = express.Router();
const GaleriaController = require('../../controllers/intranet/GaleriaController');

// --- RUTAS DE ARCHIVOS ---
router.post('/upload', GaleriaController.uploadMiddleware.single('imagen'), GaleriaController.uploadImagen);
router.get('/ver/:nombre', GaleriaController.verArchivo);

// --- RUTAS DE GALERÍA PADRE ---
router.get('/padres', GaleriaController.getGaleriasPadre);
router.post('/padre/save', GaleriaController.saveGaleriaPadre);
router.delete('/padre/:id', GaleriaController.deleteGaleriaPadre);

// --- RUTAS DE GALERÍA HIJOS ---
router.get('/:id_padre', GaleriaController.getGaleriaCompleta);
router.post('/hijo/save', GaleriaController.saveGaleriaHijo);
router.delete('/hijo/:id', GaleriaController.deleteGaleriaHijo);

module.exports = router;