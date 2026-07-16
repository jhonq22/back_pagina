// routes/archivoRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const archivoController = require('../controllers/archivoController');
const fs = require('fs');
const path = require('path');

// Crear carpeta si no existe
const dir = './archivos';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Formato: timestamp-nombreoriginal.ext
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Filtro de archivos (Opcional, pero recomendado)
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|pdf|doc|docx|mp3|mp4/;
    const mimetype = filetypes.test(file.mimetype) || /audio\/mpeg|audio\/mp3|video\/mp4/.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error("Error: El servidor solo soporta los siguientes formatos: jpeg, jpg, png, webp, pdf, doc, docx, mp3, mp4"));
};

// Configuración de Multer con LÍMITES
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 8 * 1024 * 1024 // Límite de 8MB (8 * 1024 * 1024 bytes)
    },
    fileFilter: fileFilter
});

// Rutas
// Importante: El middleware de error debe atrapar si el archivo es muy grande
router.post('/upload', (req, res, next) => {
    upload.single('archivo')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Errores específicos de Multer (como archivo demasiado grande)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'El archivo es demasiado grande. Máximo 8MB.' });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            // Otros errores (como formato no permitido)
            return res.status(400).json({ message: err.message });
        }
        // Si todo está bien, pasar al controlador
        next();
    });
}, archivoController.uploadArchivo);

router.get('/ver/:id', archivoController.getArchivoBase64);

module.exports = router;