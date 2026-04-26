const express = require('express');
const router = express.Router();
const CrudListaTipoController = require('../../controllers/crud/CrudListaTipoController');

// Listar todos los activos
router.get('/tipo-operaciones', CrudListaTipoController.getOperaciones);
// Guardar (id: null) o Actualizar (id: valor)
router.post('/tipo-operaciones', CrudListaTipoController.saveOperacion);
// Desactivar (cambiar estatus a 0)
router.delete('/tipo-operaciones/:id', CrudListaTipoController.deleteOperacion);

// Listar centroSalud
router.get('/centro-salud', CrudListaTipoController.getCentros);
// Guardar (id: null) o Actualizar (id: valor)
router.post('/centro-salud', CrudListaTipoController.saveCentro);
// Desactivar (cambiar estatus a 0)
router.delete('/centro-salud/:id', CrudListaTipoController.deleteCentro);


// ==========================================
// SECCIÓN: ESPECIALIDADES
// ==========================================

// Listar todas las especialidades
router.get('/especialidades', CrudListaTipoController.getEspecialidades);

// Guardar (id: null) o Actualizar (id: valor)
router.post('/especialidades', CrudListaTipoController.saveEspecialidad);

// Desactivar (cambiar estatus a 0)
router.delete('/especialidades/:id', CrudListaTipoController.deleteEspecialidad);







// ==========================================
// SECCIÓN: MARCAS DE MARCAPASOS
// ==========================================

// Listar todas las marcas
router.get('/marcas', CrudListaTipoController.getMarcas);
// Guardar o Actualizar
router.post('/marcas', CrudListaTipoController.saveMarca);
// Desactivar
router.delete('/marcas/:id', CrudListaTipoController.deleteMarca);

// ==========================================
// SECCIÓN: MODELOS DE MARCAPASOS
// ==========================================

// Listar todos los modelos
router.get('/modelos', CrudListaTipoController.getModelos);
// Guardar o Actualizar
router.post('/modelos', CrudListaTipoController.saveModelo);
// Desactivar
router.delete('/modelos/:id', CrudListaTipoController.deleteModelo);



module.exports = router;