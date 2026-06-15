const express = require('express');
const router = express.Router();
const PublicacionesController = require('../../controllers/intranet/PublicacionesController');

// 1. ARCHIVOS Y SUBIDAS
router.post('/upload', PublicacionesController.uploadMiddleware.single('imagen'), PublicacionesController.uploadArchivo);
router.get('/ver/:folder/:nombre', PublicacionesController.verArchivo);

// 2. CONSULTAS
router.get('/list', PublicacionesController.getPublicaciones);
router.get('/:id', PublicacionesController.getPublicacionById); 

// 3. OPERACIONES DE ESCRITURA
router.post('/save', PublicacionesController.savePublicacion);
router.put('/update/:id', PublicacionesController.updatePublicacion);
router.delete('/:id', PublicacionesController.deletePublicacion);

module.exports = router;
