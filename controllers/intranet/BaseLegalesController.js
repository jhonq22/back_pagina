const db = require('../../config/db_intranet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => { 
        const dir = 'BaseLegales/';
        // Crea la carpeta si no existe para evitar errores
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 } // Límite de 10MB (ajustable según el tamaño de tus documentos)
});

const BaseLegalesController = {
    uploadMiddleware: upload,

    uploadArchivo: (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'No se recibió el archivo' });
        res.status(200).json({
            message: 'Subida con éxito',
            ruta: '/api/base-legales/ver/',
            nombre: req.file.filename,
            nombre_original: req.file.originalname 
        });
    },

    verArchivo: (req, res) => {
        const { nombre } = req.params;
        const pathArchivo = path.join(__dirname, '../../BaseLegales', nombre);
        if (fs.existsSync(pathArchivo)) return res.sendFile(pathArchivo);
        res.status(404).json({ error: 'El archivo no existe' });
    },

    // --- GUARDAR / ACTUALIZAR ---
    saveBaseLegal: async (req, res) => {
        const { id, nombre, nombre_archivo, ruta_archivo } = req.body;
        try {
            if (id) {
                await db.query(
                    `UPDATE base_legales SET nombre = ?, nombre_archivo = ?, ruta_archivo = ? WHERE id = ?`,
                    [nombre, nombre_archivo, ruta_archivo, id]
                );
                return res.json({ message: 'Base legal actualizada correctamente' });
            }
            const [result] = await db.query(
                `INSERT INTO base_legales (nombre, nombre_archivo, ruta_archivo) VALUES (?, ?, ?)`,
                [nombre, nombre_archivo, ruta_archivo]
            );
            res.status(201).json({ message: 'Base legal creada', id: result.insertId });
        } catch (error) { 
            res.status(500).json({ error: error.message }); 
        }
    },

    // --- ELIMINAR ---
    deleteBaseLegal: async (req, res) => {
        const { id } = req.params;
        try {
            // 1. Obtener datos para borrar archivo físico
            const [rows] = await db.query('SELECT nombre_archivo FROM base_legales WHERE id = ?', [id]);
            if (rows.length > 0) {
                const filePath = path.join(__dirname, '../../BaseLegales', rows[0].nombre_archivo);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            // 2. Borrar de la DB
            await db.query('DELETE FROM base_legales WHERE id = ?', [id]);
            res.json({ message: 'Base legal y archivo eliminados correctamente' });
        } catch (error) { 
            res.status(500).json({ error: error.message }); 
        }
    },

    // --- CONSULTAS ---
    getBaseLegales: async (req, res) => {
        try {
            const [rows] = await db.query(`SELECT * FROM base_legales ORDER BY created_at DESC`);
            res.json(rows);
        } catch (error) { 
            res.status(500).json({ error: error.message }); 
        }
    }
};

module.exports = BaseLegalesController;