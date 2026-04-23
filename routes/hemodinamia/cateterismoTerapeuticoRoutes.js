// routes/cateterismoTerapeuticoConsultaRoutes.js
const express = require('express');
const router = express.Router();
// Actualizado al nuevo nombre del controlador
const controller = require('../../controllers/hemodinamia/CateterismoTerapeuticoController');

// =========================================================
// RUTAS PARA ARTERIAS TERAPÉUTICAS (PANTALLA DE VASOS)
// =========================================================

// Guardar o Actualizar Arterias (Upsert)
router.post('/', controller.saveTerapeutico);

// Obtener datos de arterias guardadas
// CAMBIO: :solicitudId -> :solicitudId
router.get('/paciente/:solicitudId', controller.getTerapeuticoBySolicitud);


// =========================================================
// RUTAS PARA DATOS GENERALES (NUEVA PANTALLA TERAPÉUTICA)
// =========================================================

// Guardar o Actualizar Datos Generales (Upsert de Técnica, Complicaciones, etc.)
router.post('/general', controller.saveTerapeuticoGeneral);

// Obtener datos generales guardados
// CAMBIO: :solicitudId -> :solicitudId
router.get('/general/paciente/:solicitudId', controller.getTerapeuticoGeneralBySolicitud);

module.exports = router;