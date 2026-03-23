const express = require('express');
const router = express.Router();
const NoticiasController = require('../../controllers/intranet/NoticiasController');

// --- Archivos y Subidas ---
router.post('/upload', NoticiasController.uploadMiddleware.single('imagen'), NoticiasController.uploadImagen);
router.get('/ver/:nombre', NoticiasController.verArchivo);

// --- Consultas (GET) ---
router.get('/list', NoticiasController.getNoticias);
router.get('/destacadas', NoticiasController.getNoticiasDestacadas); // NUEVA
router.get('/:id', NoticiasController.getNoticiaById); // NUEVA (Debe ir después de las rutas estáticas)

// --- Inserción y Actualización (POST / PUT) ---
router.post('/save', NoticiasController.saveNoticia);
router.put('/update/:id', NoticiasController.updateNoticia); // NUEVA (Opcional, si no usas saveNoticia para actualizar)

// --- Eliminación (DELETE) ---
router.delete('/delete/:id', NoticiasController.deleteNoticia);

module.exports = router;