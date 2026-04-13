const db = require('../config/db');

const indicacionesController = {
    // Crear o Actualizar registro (Upsert Dinámico)
    create: async (req, res) => {
        try {
            const data = req.body;
            const { solicitud_paciente_id } = data;

            if (!solicitud_paciente_id) {
                return res.status(400).json({ error: "solicitud_paciente_id es requerido" });
            }

            // 1. Verificar si ya existe el registro para esa solicitud
            const [existing] = await db.query(
                'SELECT id FROM indicaciones_implante_nuevos WHERE solicitud_paciente_id = ? AND estatus = 1',
                [solicitud_paciente_id]
            );

            // Función para convertir undefined a null para que COALESCE funcione correctamente
            const safeVal = (val) => val === undefined ? null : val;

            if (existing.length > 0) {
                // --- MODO UPDATE PARCIAL CON COALESCE ---
                const recordId = existing[0].id;
                
                const updateQuery = `
                    UPDATE indicaciones_implante_nuevos SET 
                        relacionado_frecuencia_cardiaca_id = COALESCE(?, relacionado_frecuencia_cardiaca_id), 
                        relacionado_trastornos_conduccion_id = COALESCE(?, relacionado_trastornos_conduccion_id), 
                        relacionado_trastornos_funcionales_id = COALESCE(?, relacionado_trastornos_funcionales_id), 
                        relacionado_trastornos_otros_id = COALESCE(?, relacionado_trastornos_otros_id), 
                        relacionado_cardiopatia_isquemica_id = COALESCE(?, relacionado_cardiopatia_isquemica_id),
                        hb = COALESCE(?, hb), 
                        gb = COALESCE(?, gb), 
                        plaquetas = COALESCE(?, plaquetas), 
                        creatinina = COALESCE(?, creatinina), 
                        urea = COALESCE(?, urea), 
                        diagnostico = COALESCE(?, diagnostico), 
                        pt = COALESCE(?, pt), 
                        ppt = COALESCE(?, ppt), 
                        glicemia = COALESCE(?, glicemia),
                        audit_usu_id = COALESCE(?, audit_usu_id), 
                        audit_ip = COALESCE(?, audit_ip), 
                        audit_dep_id = COALESCE(?, audit_dep_id)
                    WHERE id = ?`;

                const updateValues = [
                    safeVal(data.relacionado_frecuencia_cardiaca_id), 
                    safeVal(data.relacionado_trastornos_conduccion_id),
                    safeVal(data.relacionado_trastornos_funcionales_id), 
                    safeVal(data.relacionado_trastornos_otros_id),
                    safeVal(data.relacionado_cardiopatia_isquemica_id),
                    safeVal(data.hb), safeVal(data.gb), safeVal(data.plaquetas), 
                    safeVal(data.creatinina), safeVal(data.urea),
                    safeVal(data.diagnostico), safeVal(data.pt), safeVal(data.ppt), 
                    safeVal(data.glicemia), 
                    safeVal(data.audit_usu_id), safeVal(data.audit_ip), safeVal(data.audit_dep_id), 
                    recordId
                ];

                await db.query(updateQuery, updateValues);
                return res.status(200).json({ message: 'Registro actualizado parcialmente con éxito', id: recordId });

            } else {
                // --- MODO INSERT (Primer guardado) ---
                const insertQuery = `INSERT INTO indicaciones_implante_nuevos 
                    (solicitud_paciente_id, relacionado_frecuencia_cardiaca_id, relacionado_trastornos_conduccion_id, 
                    relacionado_trastornos_funcionales_id, relacionado_trastornos_otros_id, relacionado_cardiopatia_isquemica_id,
                    hb, gb, plaquetas, creatinina, urea, diagnostico, pt, ppt, glicemia, 
                    audit_usu_id, audit_ip, audit_dep_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                const insertValues = [
                    solicitud_paciente_id, 
                    safeVal(data.relacionado_frecuencia_cardiaca_id),
                    safeVal(data.relacionado_trastornos_conduccion_id), 
                    safeVal(data.relacionado_trastornos_funcionales_id),
                    safeVal(data.relacionado_trastornos_otros_id), 
                    safeVal(data.relacionado_cardiopatia_isquemica_id),
                    safeVal(data.hb), safeVal(data.gb), safeVal(data.plaquetas),
                    safeVal(data.creatinina), safeVal(data.urea), 
                    safeVal(data.diagnostico), safeVal(data.pt), safeVal(data.ppt), 
                    safeVal(data.glicemia),
                    safeVal(data.audit_usu_id), safeVal(data.audit_ip), safeVal(data.audit_dep_id)
                ];

                const [result] = await db.query(insertQuery, insertValues);
                return res.status(201).json({ message: 'Registro creado correctamente', id: result.insertId });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener todos
    getAll: async (req, res) => {
        try {
            const [rows] = await db.query('SELECT * FROM indicaciones_implante_nuevos WHERE estatus = 1');
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obtener por ID de solicitud
    getBySolicitud: async (req, res) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM indicaciones_implante_nuevos WHERE solicitud_paciente_id = ? AND estatus = 1',
                [req.params.id]
            );
            res.json(rows[0] || {});
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Actualizar por ID específico
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;
            
            const query = `
                UPDATE indicaciones_implante_nuevos SET 
                    relacionado_frecuencia_cardiaca_id = COALESCE(?, relacionado_frecuencia_cardiaca_id), 
                    relacionado_trastornos_conduccion_id = COALESCE(?, relacionado_trastornos_conduccion_id), 
                    relacionado_trastornos_funcionales_id = COALESCE(?, relacionado_trastornos_funcionales_id), 
                    relacionado_trastornos_otros_id = COALESCE(?, relacionado_trastornos_otros_id), 
                    relacionado_cardiopatia_isquemica_id = COALESCE(?, relacionado_cardiopatia_isquemica_id),
                    hb = COALESCE(?, hb), 
                    gb = COALESCE(?, gb), 
                    plaquetas = COALESCE(?, plaquetas), 
                    creatinina = COALESCE(?, creatinina), 
                    urea = COALESCE(?, urea), 
                    diagnostico = COALESCE(?, diagnostico), 
                    pt = COALESCE(?, pt), 
                    ppt = COALESCE(?, ppt), 
                    glicemia = COALESCE(?, glicemia),
                    audit_usu_id = COALESCE(?, audit_usu_id), 
                    audit_ip = COALESCE(?, audit_ip)
                WHERE id = ?`;

            const safeVal = (val) => val === undefined ? null : val;

            const values = [
                safeVal(data.relacionado_frecuencia_cardiaca_id), 
                safeVal(data.relacionado_trastornos_conduccion_id),
                safeVal(data.relacionado_trastornos_funcionales_id), 
                safeVal(data.relacionado_trastornos_otros_id),
                safeVal(data.relacionado_cardiopatia_isquemica_id),
                safeVal(data.hb), safeVal(data.gb), safeVal(data.plaquetas), 
                safeVal(data.creatinina), safeVal(data.urea),
                safeVal(data.diagnostico), safeVal(data.pt), safeVal(data.ppt), 
                safeVal(data.glicemia),
                safeVal(data.audit_usu_id), safeVal(data.audit_ip), id
            ];

            await db.query(query, values);
            res.json({ message: 'Registro actualizado' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Eliminación lógica
    delete: async (req, res) => {
        try {
            await db.query('UPDATE indicaciones_implante_nuevos SET estatus = 0 WHERE id = ?', [req.params.id]);
            res.json({ message: 'Registro eliminado' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = indicacionesController;