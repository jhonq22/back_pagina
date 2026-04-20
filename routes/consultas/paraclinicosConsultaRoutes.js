const express = require('express');
const router = express.Router();
const paraclinicoConsultaController = require('../../controllers/consultas/paraclinicoConsultaController');

// --- CATÁLOGOS ---
// ERROR CORREGIDO: Se agregó "paraclinicoConsultaController." antes del nombre de la función
router.get('/catalogo/:categoria', paraclinicoConsultaController.lista_catalogo_paraclinicos);

// --- ENDPOINTS ECG ---
router.post('/ecg', paraclinicoConsultaController.saveECG);
router.get('/ecg/:consultaId', paraclinicoConsultaController.getECG);

// --- ENDPOINTS ECO ---
router.post('/eco', paraclinicoConsultaController.saveECO);
router.get('/eco/:consultaId', paraclinicoConsultaController.getECO);

// --- ENDPOINTS RX ---
router.post('/rx', paraclinicoConsultaController.saveRX);
router.get('/rx/:consultaId', paraclinicoConsultaController.getRX);

module.exports = router;