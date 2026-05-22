const express = require('express');
const router = express.Router();
const MedicoController = require('../../controllers/crud/MedicoController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Configuración de Multer para Firmas ---

const dirFirmas = './uploads/firmas';
// Asegurar que la carpeta exista
if (!fs.existsSync(dirFirmas)) {
    fs.mkdirSync(dirFirmas, { recursive: true });
}

const storageFirmas = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, dirFirmas);
    },
    filename: (req, file, cb) => {
        // Formato: medico_id-timestamp.ext (o nombre original)
        const ext = path.extname(file.originalname);
        cb(null, `firma-${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/; // Firmas usualmente son imágenes
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error("Error: Solo se permiten imágenes (jpeg, jpg, png) para las firmas"));
};

const uploadFirma = multer({
    storage: storageFirmas,
    limits: { fileSize: 2 * 1024 * 1024 }, // Límite de 2MB para firmas es suficiente
    fileFilter: fileFilter
});

// --- Middleware para manejar errores de Multer ---
const handleMulterError = (req, res, next) => {
    uploadFirma.single('firma')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'La firma es demasiado grande. Máximo 2MB.' });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

// ==========================================
// SECCIÓN: GESTIÓN DE MÉDICOS
// ==========================================

// Listar todos los médicos



router.get('/medicos', MedicoController.getMedicos);


router.get('/centro-salud/:centro_salud_id', MedicoController.getMedicosByCentroSalud);




router.get('/usuario', MedicoController.getMedicoUsuario);


// Guardar nuevo o actualizar existente (Datos generales)
router.post('/medicos', MedicoController.saveMedico);

// Desactivar médico por ID
router.patch('/medicos/:id', MedicoController.deleteMedico);

// ==========================================
// SECCIÓN: ESPECIALIDAD Y FIRMA
// ==========================================

/**
 * Registrar especialidad y subir firma
 * Se debe enviar por FormData: 'firma' (archivo), 'medico_id' y 'especialidad_id'
 */
router.post('/medicos/firma', handleMulterError, MedicoController.saveFirmaEspecialidad);

/**
 * Ver firma en Base64
 * :id corresponde al id de la tabla firmas_medicos
 */
router.get('/medicos/firma/:id', MedicoController.getFirmaBase64);

module.exports = router;