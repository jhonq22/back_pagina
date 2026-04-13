const express = require('express');
const router = express.Router();
const NoticiasController = require('../../controllers/intranet/NoticiasController');

// 1. ARCHIVOS Y SUBIDAS
router.post('/upload', NoticiasController.uploadMiddleware.single('imagen'), NoticiasController.uploadImagen);
router.get('/ver/:nombre', NoticiasController.verArchivo);

// 2. RUTAS DE ESTRUCTURA (Deben ir ARRIBA porque son rutas específicas)
router.get('/estructura', NoticiasController.getEstructuras);
router.get('/estructura/tipo/:tipo', NoticiasController.getEstructuraByTipo); 
router.post('/estructura', NoticiasController.saveEstructura); 
router.delete('/estructura/:id', NoticiasController.deleteEstructura);

// 3. CONSULTAS DE NOTICIAS (Rutas estáticas primero)
router.get('/list', NoticiasController.getNoticias);
router.get('/destacadas', NoticiasController.getNoticiasDestacadas);

// 4. RUTAS CON PARÁMETROS DINÁMICOS (Siempre al final)
// Si esta ruta estuviera arriba, se "comería" a /list, /destacadas y /estructura
router.get('/:id', NoticiasController.getNoticiaById); 

// 5. OPERACIONES DE ESCRITURA
router.post('/save', NoticiasController.saveNoticia);
router.put('/update/:id', NoticiasController.updateNoticia);
router.delete('/delete/:id', NoticiasController.deleteNoticia);

module.exports = router;