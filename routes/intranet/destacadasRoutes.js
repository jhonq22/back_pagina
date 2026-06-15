const express = require('express');
const router = express.Router();
const DestacadasController = require('../../controllers/intranet/DestacadasController');

// 1. ARCHIVOS Y SUBIDAS
router.post('/upload', DestacadasController.uploadMiddleware.single('imagen'), DestacadasController.uploadImagen);
router.get('/ver/:nombre', DestacadasController.verArchivo);

// 2. CONSULTAS
router.get('/list', DestacadasController.getDestacadas);
router.get('/:id', DestacadasController.getDestacadaById); 

// 3. OPERACIONES DE ESCRITURA
router.post('/save', DestacadasController.saveDestacada);
router.put('/update/:id', DestacadasController.updateDestacada);
router.delete('/:id', DestacadasController.deleteDestacada); // Consistent with route path used in Noticias frontend request.delete

module.exports = router;
