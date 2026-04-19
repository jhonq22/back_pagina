const express = require('express');
const router = express.Router();

// Asegúrate de que la ruta al archivo del controlador sea la correcta en tu proyecto
const consultasController = require('../../controllers/consultas/consultasController');

// =====================================================================
// RUTAS: CONSULTAS MÉDICAS (MAESTRO)
// =====================================================================
// Buscar paciente por cédula y su última solicitud


router.get('/listado-general', consultasController.getConsultasConEtapas);

router.get('/buscar-cedula/:cedula', consultasController.buscarCedulaConsultas);
// Guardar o Actualizar Consulta Médica
router.post('/', consultasController.saveConsultaMedica);

// Obtener Consulta Médica por su ID principal
router.get('/:id', consultasController.getConsultaMedicaById);


// =====================================================================
// RUTAS: TEST SEATLE - PRIMERA ETAPA
// =====================================================================

// Guardar o Actualizar Primera Etapa
router.post('/etapa-uno', consultasController.savePrimeraEtapa);

// Obtener Primera Etapa usando el ID de la consulta médica (consultas_medica_id)
router.get('/etapa-uno/consulta/:consultaId', consultasController.getPrimeraEtapaByConsultaId);


// =====================================================================
// RUTAS: TEST SEATLE - SEGUNDA ETAPA
// =====================================================================

// Guardar o Actualizar Segunda Etapa
router.post('/etapa-dos', consultasController.saveSegundaEtapa);

// Obtener Segunda Etapa usando el ID de la consulta médica (consultas_medica_id)
router.get('/etapa-dos/consulta/:consultaId', consultasController.getSegundaEtapaByConsultaId);

// Ruta para obtener por tipo (ej: /api/consulta/tipo/INDUCCION_ISQUEMA)
router.get('/tipo/:tipo', consultasController.lista_por_tipo);

module.exports = router;