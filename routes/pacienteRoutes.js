const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');

// 1. Rutas específicas (Estáticas)
router.get('/ver/:id', pacienteController.verInformacionPacientePorID);

// 2. Rutas generales
router.get('/', pacienteController.getAllPacientes);
router.post('/', pacienteController.createPaciente);

// 3. Rutas con parámetros (Dinámicas) - SIEMPRE AL FINAL
router.get('/:id', pacienteController.getPacienteById);
router.put('/:id', pacienteController.updatePaciente);
router.delete('/:id', pacienteController.deletePaciente);

module.exports = router;