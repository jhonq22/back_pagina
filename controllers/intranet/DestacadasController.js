const db = require('../../config/db_intranet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==========================================
// SECCIÓN: CONFIGURACIÓN DE MULTER
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'Destacadas/';
        
        // Si la carpeta no existe, la crea automáticamente
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes o videos.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 50 } 
});

// ==========================================
// SECCIÓN: FUNCIONES AUXILIARES
// ==========================================
const generarSlug = (texto) => {
    return texto.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
};

// ==========================================
// SECCIÓN: CONTROLADOR
// ==========================================
const DestacadasController = {

    uploadMiddleware: upload,

    // 1. Método para subir el archivo (Imagen o Video)
    uploadImagen: (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo' });
        }
        
        res.status(200).json({
            message: 'Archivo subido con éxito',
            ruta_imagen: '/api/destacadas/ver/', 
            nombre_archivo: req.file.filename,
            nombre_original: req.file.originalname,
            mimetype: req.file.mimetype
        });
    },

    // 2. Nueva función para VER el archivo físicamente
    verArchivo: (req, res) => {
        const { nombre } = req.params;
        const pathDestacada = path.join(__dirname, '../../Destacadas', nombre);

        if (fs.existsSync(pathDestacada)) {
            return res.sendFile(pathDestacada);
        } else {
            return res.status(404).json({ error: 'El archivo no existe en el servidor' });
        }
    },

    // 3. Obtener todas las destacadas
    getDestacadas: async (req, res) => {
        try {
            const query = `
                SELECT * FROM destacadas 
                ORDER BY created_at DESC
            `;
            const [rows] = await db.query(query);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 4. Guardar o Actualizar Destacada
    saveDestacada: async (req, res) => {
        const { 
            id, titulo, body, titulo_corto, estatus, 
            ruta_imagen, nombre_archivo, fecha_publicacion, etiqueta
        } = req.body;

        if (!titulo || !body) {
            return res.status(400).json({ error: 'El título y el contenido son obligatorios' });
        }

        const slug = generarSlug(titulo);

        try {
            const [existe] = await db.query(
                'SELECT id FROM destacadas WHERE slug = ? AND id != ?',
                [slug, id || 0]
            );

            if (existe.length > 0) {
                return res.status(400).json({ error: 'Ya existe una destacada con un título muy similar' });
            }

            if (id) {
                // UPDATE (Editar Destacada)
                const queryUpdate = `
                    UPDATE destacadas 
                    SET titulo = ?, slug = ?, body = ?, titulo_corto = ?, 
                        estatus = ?, ruta_imagen = ?, 
                        nombre_archivo = ?, fecha_publicacion = ?, 
                        etiqueta = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?`;
                
                await db.query(queryUpdate, [
                    titulo, slug, body, titulo_corto, estatus, 
                    ruta_imagen, nombre_archivo, fecha_publicacion || null, 
                    etiqueta || null, id
                ]);

                return res.json({ message: 'Destacada actualizada con éxito' });
            } else {
                // INSERT (Crear Destacada)
                const queryInsert = `
                    INSERT INTO destacadas 
                    (titulo, slug, body, titulo_corto, estatus, ruta_imagen, nombre_archivo, fecha_publicacion, etiqueta) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                const [result] = await db.query(queryInsert, [
                    titulo, slug, body, titulo_corto, estatus || 'draft', 
                    ruta_imagen, nombre_archivo, fecha_publicacion || null, etiqueta || null
                ]);

                return res.status(201).json({ message: 'Destacada creada con éxito', id: result.insertId });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 5. Eliminado Físico (Borra archivo y registro)
    deleteDestacada: async (req, res) => {
        const { id } = req.params;
        try {
            // Buscamos el archivo para borrarlo del disco
            const [rows] = await db.query('SELECT nombre_archivo FROM destacadas WHERE id = ?', [id]);
            
            if (rows.length > 0 && rows[0].nombre_archivo) {
                const filePath = path.join(__dirname, '../../Destacadas', rows[0].nombre_archivo);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            // Borramos de la base de datos
            await db.query('DELETE FROM destacadas WHERE id = ?', [id]);
            res.json({ message: 'Destacada y archivo eliminados correctamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getDestacadaById: async (req, res) => {
        const { id } = req.params;
        try {
            const [rows] = await db.query('SELECT * FROM destacadas WHERE id = ?', [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Destacada no encontrada' });
            }
            
            res.json(rows[0]); 
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Actualizar una destacada
    updateDestacada: async (req, res) => {
        const { id } = req.params;
        const { 
            titulo, body, titulo_corto, estatus, 
            ruta_imagen, nombre_archivo, fecha_publicacion, etiqueta
        } = req.body;

        if (!titulo || !body) {
            return res.status(400).json({ error: 'El título y el contenido son obligatorios' });
        }

        const slug = generarSlug(titulo);

        try {
            const [existe] = await db.query('SELECT id FROM destacadas WHERE slug = ? AND id != ?', [slug, id]);
            if (existe.length > 0) {
                return res.status(400).json({ error: 'Ya existe una destacada con un título similar' });
            }

            const queryUpdate = `
                UPDATE destacadas 
                SET titulo = ?, slug = ?, body = ?, titulo_corto = ?, 
                    estatus = ?, ruta_imagen = ?, 
                    nombre_archivo = ?, fecha_publicacion = ?, 
                    etiqueta = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`;
            
            const [result] = await db.query(queryUpdate, [
                titulo, slug, body, titulo_corto, estatus, 
                ruta_imagen, nombre_archivo, fecha_publicacion || null, 
                etiqueta || null, id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Destacada no encontrada' });
            }

            res.json({ message: 'Destacada actualizada con éxito' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = DestacadasController;
