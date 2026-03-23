const db = require('../../config/db_intranet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer (Se mantiene igual)
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'Galerias/'); },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 } 
});

const GaleriaController = {
    uploadMiddleware: upload,

    uploadImagen: (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });
        res.status(200).json({
            message: 'Subida con éxito',
            ruta: '/api/galeria/ver/',
            nombre: req.file.filename,
            nombre_original: req.file.originalname 
        });
    },

    verArchivo: (req, res) => {
        const { nombre } = req.params;
        const pathImagen = path.join(__dirname, '../../Galerias', nombre);
        if (fs.existsSync(pathImagen)) return res.sendFile(pathImagen);
        res.status(404).json({ error: 'No existe' });
    },

    // --- GUARDAR / ACTUALIZAR ---
    saveGaleriaPadre: async (req, res) => {
        const { id, categoria_id, nombre, nombre_archivo, ruta_archivo } = req.body;
        try {
            if (id) {
                await db.query(
                    `UPDATE galeria_padre SET categoria_id = ?, nombre = ?, nombre_archivo = ?, ruta_archivo = ? WHERE id = ?`,
                    [categoria_id || null, nombre, nombre_archivo, ruta_archivo, id]
                );
                return res.json({ message: 'Galería actualizada' });
            }
            const [result] = await db.query(
                `INSERT INTO galeria_padre (categoria_id, nombre, nombre_archivo, ruta_archivo) VALUES (?, ?, ?, ?)`,
                [categoria_id || null, nombre, nombre_archivo, ruta_archivo]
            );
            res.status(201).json({ message: 'Galería creada', id: result.insertId });
        } catch (error) { res.status(500).json({ error: error.message }); }
    },

    saveGaleriaHijo: async (req, res) => {
        const { id, galeria_padre_id, categoria_id, nombre, nombre_archivo, ruta_archivo } = req.body;
        try {
            if (id) {
                await db.query(
                    `UPDATE galeria_hijos SET galeria_padre_id = ?, categoria_id = ?, nombre = ?, nombre_archivo = ?, ruta_archivo = ? WHERE id = ?`,
                    [galeria_padre_id, categoria_id || null, nombre, nombre_archivo, ruta_archivo, id]
                );
                return res.json({ message: 'Imagen actualizada' });
            }
            const [result] = await db.query(
                `INSERT INTO galeria_hijos (galeria_padre_id, categoria_id, nombre, nombre_archivo, ruta_archivo) VALUES (?, ?, ?, ?, ?)`,
                [galeria_padre_id, categoria_id || null, nombre, nombre_archivo, ruta_archivo]
            );
            res.status(201).json({ message: 'Imagen agregada', id: result.insertId });
        } catch (error) { res.status(500).json({ error: error.message }); }
    },

    // --- ELIMINAR ---
    deleteGaleriaPadre: async (req, res) => {
        const { id } = req.params;
        try {
            // 1. Obtener datos para borrar archivo físico
            const [rows] = await db.query('SELECT nombre_archivo FROM galeria_padre WHERE id = ?', [id]);
            if (rows.length > 0) {
                const filePath = path.join(__dirname, '../../Galerias', rows[0].nombre_archivo);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            // 2. Borrar de la DB (La DB debería borrar hijos por cascada si está configurada, sino hay que hacerlo manual)
            await db.query('DELETE FROM galeria_padre WHERE id = ?', [id]);
            res.json({ message: 'Galería y archivo eliminados correctamente' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    },

    deleteGaleriaHijo: async (req, res) => {
        const { id } = req.params;
        try {
            const [rows] = await db.query('SELECT nombre_archivo FROM galeria_hijos WHERE id = ?', [id]);
            if (rows.length > 0) {
                const filePath = path.join(__dirname, '../../Galerias', rows[0].nombre_archivo);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            await db.query('DELETE FROM galeria_hijos WHERE id = ?', [id]);
            res.json({ message: 'Imagen eliminada correctamente' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    },

    // --- CONSULTAS ---
    getGaleriasPadre: async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT p.*, COUNT(h.id) as total_fotos 
                FROM galeria_padre p 
                LEFT JOIN galeria_hijos h ON p.id = h.galeria_padre_id 
                GROUP BY p.id ORDER BY p.created_at DESC`);
            res.json(rows);
        } catch (error) { res.status(500).json({ error: error.message }); }
    },

    getGaleriaCompleta: async (req, res) => {
        const { id_padre } = req.params;
        try {
            const [padre] = await db.query('SELECT * FROM galeria_padre WHERE id = ?', [id_padre]);
            const [hijos] = await db.query('SELECT * FROM galeria_hijos WHERE galeria_padre_id = ?', [id_padre]);
            res.json({ padre: padre[0], hijos });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }
};

module.exports = GaleriaController;