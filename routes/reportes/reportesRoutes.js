const express = require('express');
const router = express.Router();
const ReportesController = require('../../controllers/reportes/ReportesController');

/**
 * ==========================================
 * REPORTES INDIVIDUALES (PDF / VISTA DETALLE)
 * ==========================================
 */

// Obtener la "Sábana" completa (Datos clínicos, examen físico, paraclínicos)
router.get('/sabana/:solicitud_id', ReportesController.getSabanaPaciente);

// Obtener reporte técnico del implante de Marcapasos
router.get('/marcapasos/:solicitud_id', ReportesController.getReporteMarcapasos);


/**
 * ==========================================
 * DASHBOARD / GRÁFICOS
 * ==========================================
 */

// Obtener datos formateados para ApexCharts/Chart.js
router.get('/dashboard/estadisticas', ReportesController.getEstadisticasDashboard);


/**
 * ==========================================
 * REPORTES GENERALES (MÓDULO V)
 * ==========================================
 */

// Obtener listados filtrados (por hospital, estado, fecha, tipo de estatus)
// Ejemplo de uso: /api/reportes/general?tipo_reporte=intervenidos&hospital_id=1
router.get('/general', ReportesController.getReporteGeneral);

module.exports = router;