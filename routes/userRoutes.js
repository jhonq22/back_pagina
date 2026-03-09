const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Públicas
router.post('/login', userController.login);

// CRUD Usuarios
router.get('/', userController.getUsers);                // Listar
router.post('/register', userController.createUser);     // Crear
router.put('/:id', userController.updateUser);           // Editar Info
router.patch('/:id/password', userController.updatePassword); // Editar Password
router.delete('/:id', userController.deleteUser);        // Desactivar

// Auxiliares
router.get('/roles', userController.getRoles);


// Ruta para agregar o actualizar los multi-roles
router.post('/multi-roles', userController.agregarMultiRol);

module.exports = router;