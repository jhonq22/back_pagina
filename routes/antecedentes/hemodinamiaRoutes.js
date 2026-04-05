const express = require('express');
const router = express.Router();
const hemodinamiaController = require('../../controllers/antecedentes/hemodinamiaController');

// Ruta para obtener por tipo (ej: /api/hemodinamia/tipo/INDUCCION_ISQUEMA)
router.get('/tipo/:tipo', hemodinamiaController.lista_por_tipo);

// Ruta para obtener por padre (ej: /api/hemodinamia/padre/252)
router.get('/padre/:padre_id', hemodinamiaController.lista_por_padre);

module.exports = router;