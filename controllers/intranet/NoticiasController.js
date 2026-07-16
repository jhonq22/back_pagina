const db = require('../../config/db_intranet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==========================================
// SECCIÓN: CONFIGURACIÓN DE MULTER
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Leemos si el front envió un parámetro ?folder=cintillos
        const dir = req.query.folder === 'cintillos' ? 'Cintillos/' : 'Noticias/';
        
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
    // Agregamos tipos MIME para videos comunes (mp4, webm, ogg) además de las imágenes y audios
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg',
        'audio/mpeg', 'audio/mp3'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes, videos o audios.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 8 } 
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
const NoticiasController = {

    uploadMiddleware: upload,

    // 1. Método para subir el archivo (Imagen o Video)
    uploadImagen: (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo' });
        }
        
        res.status(200).json({
            message: 'Archivo subido con éxito',
            ruta_imagen: '/api/noticias/ver/', // Mantenemos el nombre ruta_imagen por compatibilidad con tu BD
            nombre_archivo: req.file.filename,
            nombre_original: req.file.originalname,
            mimetype: req.file.mimetype // Retornamos el mimetype para que el frontend sepa si es video o imagen
        });
    },

    // 2. Nueva función para VER el archivo físicamente
verArchivo: (req, res) => {
        const { nombre } = req.params;
        
        const pathNoticia = path.join(__dirname, '../../Noticias', nombre);
        const pathCintillo = path.join(__dirname, '../../Cintillos', nombre);

        // Verificamos en qué carpeta existe la imagen y la devolvemos
        if (fs.existsSync(pathNoticia)) {
            return res.sendFile(pathNoticia);
        } else if (fs.existsSync(pathCintillo)) {
            return res.sendFile(pathCintillo);
        } else {
            return res.status(404).json({ error: 'El archivo no existe en el servidor' });
        }
    },

    // 3. Obtener todas las noticias (Ordenadas y priorizando las destacadas)
    getNoticias: async (req, res) => {
        try {
            // Ordenamos primero por destacadas y luego por fecha
            const query = `
                SELECT * FROM noticias 
                ORDER BY destacada DESC, created_at DESC
            `;
            const [rows] = await db.query(query);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 4. Guardar o Actualizar Noticia
    saveNoticia: async (req, res) => {
        const { 
            id, titulo, body, titulo_corto, estatus, 
            author_id, ruta_imagen, nombre_archivo, fecha_publicacion,
            categoria_id, destacada 
        } = req.body;

        if (!titulo || !body) {
            return res.status(400).json({ error: 'El título y el contenido son obligatorios' });
        }

        const slug = generarSlug(titulo);
        // Aseguramos que destacada sea un 1 o 0 para MySQL
        const isDestacada = destacada === true || destacada === 'true' || destacada === 1 ? 1 : 0;

        try {
            const [existe] = await db.query(
                'SELECT id FROM noticias WHERE slug = ? AND id != ?',
                [slug, id || 0]
            );

            if (existe.length > 0) {
                return res.status(400).json({ error: 'Ya existe una noticia con un título muy similar' });
            }

            if (id) {
                // UPDATE (Editar Noticia)
                const queryUpdate = `
                    UPDATE noticias 
                    SET titulo = ?, slug = ?, body = ?, titulo_corto = ?, 
                        estatus = ?, author_id = ?, ruta_imagen = ?, 
                        nombre_archivo = ?, fecha_publicacion = ?, 
                        categoria_id = ?, destacada = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?`;
                
                await db.query(queryUpdate, [
                    titulo, slug, body, titulo_corto, estatus, 
                    author_id, ruta_imagen, nombre_archivo, fecha_publicacion, 
                    categoria_id || null, isDestacada, id
                ]);

                return res.json({ message: 'Noticia actualizada con éxito' });
            } else {
                // INSERT (Crear Noticia)
                const queryInsert = `
                    INSERT INTO noticias 
                    (titulo, slug, body, titulo_corto, estatus, author_id, ruta_imagen, nombre_archivo, fecha_publicacion, categoria_id, destacada) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                const [result] = await db.query(queryInsert, [
                    titulo, slug, body, titulo_corto, estatus || 'draft', 
                    author_id, ruta_imagen, nombre_archivo, fecha_publicacion,
                    categoria_id || null, isDestacada
                ]);

                return res.status(201).json({ message: 'Noticia creada con éxito', id: result.insertId });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 5. Eliminado Físico (Borra archivo y registro)
    deleteNoticia: async (req, res) => {
        const { id } = req.params;
        try {
            // Buscamos el archivo para borrarlo del disco
            const [rows] = await db.query('SELECT nombre_archivo FROM noticias WHERE id = ?', [id]);
            
            if (rows.length > 0 && rows[0].nombre_archivo) {
                const filePath = path.join(__dirname, '../../Noticias', rows[0].nombre_archivo);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            // Borramos de la base de datos
            await db.query('DELETE FROM noticias WHERE id = ?', [id]);
            res.json({ message: 'Noticia y archivo eliminados correctamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getNoticiaById: async (req, res) => {
        const { id } = req.params;
        try {
            const [rows] = await db.query('SELECT * FROM noticias WHERE id = ?', [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Noticia no encontrada' });
            }
            
            res.json(rows[0]); 
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // API 2: Obtener solo las noticias destacadas
    getNoticiasDestacadas: async (req, res) => {
        try {
            // Buscamos donde destacada = 1 (true en MySQL) y que no estén eliminadas lógicamente
            const query = `
                SELECT * FROM noticias 
                WHERE destacada = 1 AND estatus != 'deleted' 
                ORDER BY created_at DESC
            `;
            const [rows] = await db.query(query);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // API 3: Actualizar una noticia (Alternativa explícita a saveNoticia)
    updateNoticia: async (req, res) => {
        const { id } = req.params;
        const { 
            titulo, body, titulo_corto, estatus, 
            author_id, ruta_imagen, nombre_archivo, fecha_publicacion,
            categoria_id, destacada 
        } = req.body;

        if (!titulo || !body) {
            return res.status(400).json({ error: 'El título y el contenido son obligatorios' });
        }

        const slug = generarSlug(titulo);
        const isDestacada = destacada === true || destacada === 'true' || destacada === 1 ? 1 : 0;

        try {
            const [existe] = await db.query('SELECT id FROM noticias WHERE slug = ? AND id != ?', [slug, id]);
            if (existe.length > 0) {
                return res.status(400).json({ error: 'Ya existe una noticia con un título similar' });
            }

            const queryUpdate = `
                UPDATE noticias 
                SET titulo = ?, slug = ?, body = ?, titulo_corto = ?, 
                    estatus = ?, author_id = ?, ruta_imagen = ?, 
                    nombre_archivo = ?, fecha_publicacion = ?, 
                    categoria_id = ?, destacada = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`;
            
            const [result] = await db.query(queryUpdate, [
                titulo, slug, body, titulo_corto, estatus, 
                author_id, ruta_imagen, nombre_archivo, fecha_publicacion, 
                categoria_id || null, isDestacada, id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Noticia no encontrada' });
            }

            res.json({ message: 'Noticia actualizada con éxito' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ==========================================
    // SECCIÓN: MÓDULO ESTRUCTURA (Misión / Visión / Cintillo)
    // ==========================================

    // 1. Obtener todas las estructuras
    getEstructuras: async (req, res) => {
        try {
            // Al usar SELECT *, automáticamente traerá ruta_imagen y nombre_archivo
            const query = 'SELECT * FROM estructura ORDER BY created_at DESC';
            const [rows] = await db.query(query);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. Obtener una estructura específica por su TIPO
    getEstructuraByTipo: async (req, res) => {
        const { tipo } = req.params;
        try {
            const [rows] = await db.query('SELECT * FROM estructura WHERE tipo = ? LIMIT 1', [tipo]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: `Estructura de tipo '${tipo}' no encontrada` });
            }
            
            res.json(rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 3. Crear o Actualizar Estructura (Dinámico - Ahora soporta imágenes)

    saveEstructura: async (req, res) => {
        // Agregamos ruta_imagen y nombre_archivo al destructuring
        const { id, titulo, body, tipo, estatus, ruta_imagen, nombre_archivo } = req.body;

        // Validación básica
        if (!titulo || !tipo) {
            return res.status(400).json({ error: 'El título y el tipo son obligatorios' });
        }

        const isActivo = estatus === false || estatus === 'false' || estatus === 0 ? 0 : 1;

        try {
            if (id) {
                // UPDATE en una sola línea limpia (sin saltos ni espacios raros)
                const queryUpdate = "UPDATE estructura SET titulo = ?, body = ?, tipo = ?, estatus = ?, ruta_imagen = ?, nombre_archivo = ? WHERE id = ?";
                
                const [result] = await db.query(queryUpdate, [
                    titulo, body || '', tipo, isActivo, ruta_imagen || null, nombre_archivo || null, id
                ]);
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Registro no encontrado para actualizar' });
                }
                return res.json({ message: 'Estructura actualizada con éxito' });
            } else {
                // INSERT en una sola línea limpia
                const queryInsert = "INSERT INTO estructura (titulo, body, tipo, estatus, ruta_imagen, nombre_archivo) VALUES (?, ?, ?, ?, ?, ?)";
                
                const [result] = await db.query(queryInsert, [
                    titulo, body || '', tipo, isActivo, ruta_imagen || null, nombre_archivo || null
                ]);
                return res.status(201).json({ message: 'Estructura creada con éxito', id: result.insertId });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 4. Eliminar Estructura (Ahora borra el archivo físico si existe)
   // 4. Eliminar Estructura
    deleteEstructura: async (req, res) => {
        const { id } = req.params;
        try {
            // Buscamos si la estructura tiene un archivo asociado
            const [rows] = await db.query('SELECT nombre_archivo FROM estructura WHERE id = ?', [id]);
            
            if (rows.length > 0 && rows[0].nombre_archivo) {
                // AHORA APUNTA A LA CARPETA CINTILLOS
                const filePath = path.join(__dirname, '../../Cintillos', rows[0].nombre_archivo);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            // Eliminamos el registro de la base de datos
            const [result] = await db.query('DELETE FROM estructura WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'La estructura no existe' });
            }
            res.json({ message: 'Estructura y archivo eliminados correctamente' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

  
};

module.exports = NoticiasController;