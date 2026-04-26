const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');


const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const { subirExcelTemporal, obtenerPacientesTemporales, obtenerEstadoHospital } = require('../controllers/migrar_citas/MigrarCitasController');
const { confirmarCitas, eliminarTemporales, eliminarTemporalPorId } = require('../controllers/migrar_citas/confirmacionController');

router.get('/pacientes-con-solicitudes', solicitudController.PacientesConSolicitudes);
router.get('/pacientes-con-solicitudes-actualizados', solicitudController.PacientesConSolicitudesActualizados);
router.get('/pacientes-con-solicitudes-no-actualizados', solicitudController.PacientesConSolicitudesNoActualizados);
router.get('/ver-temporales/:centro_salud_id', obtenerPacientesTemporales);


// Rutas exclusivas para el campo marcapaso
router.get('/marcapaso/:id', solicitudController.getMarcapasoById);
router.put('/update-marcapaso/:id', solicitudController.updateMarcapaso);

// Rutas de Listado
router.get('/', solicitudController.getSolicitudes);
router.get('/dinamico/:id/:centro_salud_id', solicitudController.getSolicitudesEstatusDinamico);
router.get('/pendientes/:centro_salud_id', solicitudController.getSolicitudesPendientesAreaMedica);
router.get('/pendientes-operados/:centro_salud_id', solicitudController.getSolicitudesPendientesAreaMedicaOperados);
router.get('/pendientes-administrativas', solicitudController.getSolicitudesPendientesAreaAdministrativa);
router.get('/pendientes-centro/:centro_salud_id', solicitudController.getSolicitudesPendientesPorCentro);
router.get('/pendientes-medicas', solicitudController.getSolicitudesPendientesAreaMedica);
router.get('/administrativas/:id', solicitudController.getSolicitudesAdministrativas); // Estatus 1
router.get('/medicas', solicitudController.getSolicitudesMedicas);             // Estatus 2
router.get('/paciente/:paciente_id', solicitudController.getSolicitudByPacienteId);
router.get('/:id', solicitudController.getSolicitudById);

// Creación y Eliminación
router.post('/', solicitudController.createSolicitud);
router.delete('/:id', solicitudController.deleteSolicitud);

// Actualizaciones de proceso y documentos
router.patch('/update-fase/:id', solicitudController.updateEstatusFase);
router.put('/update-medico/:id', solicitudController.updateDatosMedicos);
router.put('/verificar-documento/:id', solicitudController.updateVerificacionDocumento);
router.put('/finalizar-verificacion/:id', solicitudController.finalizarVerificacion);
router.put('/asignar-hospital/:id', solicitudController.asignarHospital);

// Actualizaciones de tipo de operación y marcapaso
router.put('/update-tipo-operacion-y-marca-paso/:id', solicitudController.updateTipoOperacionYMarcaPaso);

// Rutas de Migración de Citas
router.post('/subir-excel-temporal', upload.single('archivo'), subirExcelTemporal);
router.post('/confirmar-citas', confirmarCitas);
router.post('/eliminar-temporales', eliminarTemporales);
// El ":id" permite que la URL sea algo como /eliminar-temporal/5
router.delete('/eliminar-temporal/:id', eliminarTemporalPorId);
router.get('/estado-hospital/:centro_salud_id', obtenerEstadoHospital);


module.exports = router;