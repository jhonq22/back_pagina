const db = require('../../config/db_intranet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==========================================
// SECCIÓN: CONFIGURACIÓN DE MULTER
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Leemos si el front envió un parámetro ?folder=portadas o ?folder=archivos
        const dir = req.query.folder === 'portadas' ? 'Publicaciones/Portadas/' : 'Publicaciones/Archivos/';
        
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
    // Permitir imágenes, videos, pdfs y formatos de oficina comunes
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg',
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|zip|jpg|jpeg|png|webp|mp4)$/i)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes, videos, PDFs, ZIPs o documentos de Word/Excel.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 100 } // Aumentado a 100MB por si suben documentos o videos pesados
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
const PublicacionesController = {

    uploadMiddleware: upload,

    // 1. Método para subir el archivo (Imagen o Documento)
    uploadArchivo: (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo' });
        }
        
        const folderParam = req.query.folder === 'portadas' ? 'portadas' : 'archivos';
        const endpointVer = `/api/publicaciones/ver/${folderParam}/`;
        
        res.status(200).json({
            message: 'Archivo subido con éxito',
            ruta_imagen: endpointVer, // Mapeado para que coincida con el campo de respuesta
            nombre_archivo: req.file.filename,
            nombre_original: req.file.originalname,
            mimetype: req.file.mimetype 
        });
    },

    // 2. Nueva función para VER el archivo físicamente
    verArchivo: (req, res) => {
        const { folder, nombre } = req.params;
        
        const subfolder = folder === 'portadas' ? 'Portadas' : 'Archivos';
        const filePath = path.join(__dirname, '../../Publicaciones', subfolder, nombre);

        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        } else {
            return res.status(404).json({ error: 'El archivo no existe en el servidor' });
        }
    },

    // 3. Obtener todas las publicaciones
    getPublicaciones: async (req, res) => {
        try {
            const query = `
                SELECT * FROM publicaciones_originales 
                ORDER BY created_at DESC
            `;
            const [rows] = await db.query(query);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 4. Guardar o Actualizar Publicación
    savePublicacion: async (req, res) => {
        const { 
            id, titulo, titulo_corto, estatus, 
            ruta_imagen, nombre_archivo, 
            ruta_url_archivo, nombre_ruta_url_archivo,
            fecha_publicacion, etiqueta 
        } = req.body;

        if (!titulo) {
            return res.status(400).json({ error: 'El título es obligatorio' });
        }

        const slug = generarSlug(titulo);

        try {
            const [existe] = await db.query(
                'SELECT id FROM publicaciones_originales WHERE slug = ? AND id != ?',
                [slug, id || 0]
            );

            if (existe.length > 0) {
                return res.status(400).json({ error: 'Ya existe una publicación con un título muy similar' });
            }

            if (id) {
                // UPDATE (Editar Publicación)
                const queryUpdate = `
                    UPDATE publicaciones_originales 
                    SET titulo = ?, slug = ?, titulo_corto = ?, 
                        estatus = ?, ruta_imagen = ?, nombre_archivo = ?, 
                        ruta_url_archivo = ?, nombre_ruta_url_archivo = ?,
                        fecha_publicacion = ?, etiqueta = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?`;
                
                await db.query(queryUpdate, [
                    titulo, slug, titulo_corto, estatus, 
                    ruta_imagen, nombre_archivo, 
                    ruta_url_archivo, nombre_ruta_url_archivo,
                    fecha_publicacion || null, etiqueta || null, id
                ]);

                return res.json({ message: 'Publicación actualizada con éxito' });
            } else {
                // INSERT (Crear Publicación)
                const queryInsert = `
                    INSERT INTO publicaciones_originales 
                    (titulo, slug, titulo_corto, estatus, ruta_imagen, nombre_archivo, ruta_url_archivo, nombre_ruta_url_archivo, fecha_publicacion, etiqueta) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                const [result] = await db.query(queryInsert, [
                    titulo, slug, titulo_corto, estatus || 'draft', 
                    ruta_imagen, nombre_archivo, 
                    ruta_url_archivo, nombre_ruta_url_archivo,
                    fecha_publicacion || null, etiqueta || null
                ]);

                return res.status(201).json({ message: 'Publicación creada con éxito', id: result.insertId });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 5. Eliminado Físico (Borra archivos y registro)
    deletePublicacion: async (req, res) => {
        const { id } = req.params;
        try {
            // Buscamos los archivos para borrarlos del disco
            const [rows] = await db.query('SELECT nombre_archivo, nombre_ruta_url_archivo FROM publicaciones_originales WHERE id = ?', [id]);
            
            if (rows.length > 0) {
                const row = rows[0];
                if (row.nombre_archivo) {
                    const filePath = path.join(__dirname, '../../Publicaciones/Portadas', row.nombre_archivo);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                if (row.nombre_ruta_url_archivo) {
                    const filePath = path.join(__dirname, '../../Publicaciones/Archivos', row.nombre_ruta_url_archivo);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            }

            // Borramos de la base de datos
            await db.query('DELETE FROM publicaciones_originales WHERE id = ?', [id]);
            res.json({ message: 'Publicación y archivos eliminados correctamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getPublicacionById: async (req, res) => {
        const { id } = req.params;
        try {
            const [rows] = await db.query('SELECT * FROM publicaciones_originales WHERE id = ?', [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Publicación no encontrada' });
            }
            
            res.json(rows[0]); 
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updatePublicacion: async (req, res) => {
        const { id } = req.params;
        const { 
            titulo, titulo_corto, estatus, 
            ruta_imagen, nombre_archivo, 
            ruta_url_archivo, nombre_ruta_url_archivo,
            fecha_publicacion, etiqueta 
        } = req.body;

        if (!titulo) {
            return res.status(400).json({ error: 'El título es obligatorio' });
        }

        const slug = generarSlug(titulo);

        try {
            const [existe] = await db.query('SELECT id FROM publicaciones_originales WHERE slug = ? AND id != ?', [slug, id]);
            if (existe.length > 0) {
                return res.status(400).json({ error: 'Ya existe una publicación con un título similar' });
            }

            const queryUpdate = `
                UPDATE publicaciones_originales 
                SET titulo = ?, slug = ?, titulo_corto = ?, 
                    estatus = ?, ruta_imagen = ?, nombre_archivo = ?, 
                    ruta_url_archivo = ?, nombre_ruta_url_archivo = ?,
                    fecha_publicacion = ?, etiqueta = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`;
            
            const [result] = await db.query(queryUpdate, [
                titulo, slug, titulo_corto, estatus, 
                ruta_imagen, nombre_archivo, 
                ruta_url_archivo, nombre_ruta_url_archivo,
                fecha_publicacion || null, etiqueta || null, id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Publicación no encontrada' });
            }

            res.json({ message: 'Publicación actualizada con éxito' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = PublicacionesController;
