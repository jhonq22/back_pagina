const db = require('../../config/db');

/**
 * Guarda o Actualiza las sugerencias de hemodinamia
 */
const saveSugerencias = async (req, res) => {
    const {
        solicitud_paciente_id,
        sugerencia_diagnostico_id,
        sugerencia_terapeuticas_id,
        complicaciones_procedimiento,
        complicaciones_abierto,
        estatus
    } = req.body;

    if (!solicitud_paciente_id) {
        return res.status(400).json({ message: "El solicitud_paciente_id es obligatorio" });
    }

    try {
        // 1. Verificar si ya existe un registro para esta solicitud
        const [exist] = await db.query(
            'SELECT id FROM sugerencias_hemodinamia WHERE solicitud_paciente_id = ?',
            [solicitud_paciente_id]
        );

        if (exist.length > 0) {
            // 2. Si existe, realizamos un UPDATE
            await db.query(
                `UPDATE sugerencias_hemodinamia SET 
                    sugerencia_diagnostico_id = ?, 
                    sugerencia_terapeuticas_id = ?, 
                    complicaciones_procedimiento = ?, 
                    complicaciones_abierto = ?, 
                    estatus = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE solicitud_paciente_id = ?`,
                [
                    sugerencia_diagnostico_id || null,
                    sugerencia_terapeuticas_id || null,
                    complicaciones_procedimiento || null,
                    complicaciones_abierto || null,
                    estatus || 1,
                    solicitud_paciente_id
                ]
            );
            return res.status(200).json({ message: 'Sugerencias actualizadas con éxito' });

        } else {
            // 3. Si no existe, realizamos un INSERT
            await db.query(
                `INSERT INTO sugerencias_hemodinamia 
                (
                    solicitud_paciente_id, 
                    sugerencia_diagnostico_id, 
                    sugerencia_terapeuticas_id, 
                    complicaciones_procedimiento, 
                    complicaciones_abierto, 
                    estatus
                ) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    solicitud_paciente_id,
                    sugerencia_diagnostico_id || null,
                    sugerencia_terapeuticas_id || null,
                    complicaciones_procedimiento || null,
                    complicaciones_abierto || null,
                    estatus || 1
                ]
            );
            return res.status(201).json({ message: 'Sugerencias guardadas con éxito' });
        }
    } catch (error) {
        console.error("Error en saveSugerencias:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obtiene las sugerencias por el ID de la solicitud
 */
const getSugerenciasBySolicitud = async (req, res) => {
    const { solicitudId } = req.params;

    try {
        const [rows] = await db.query(
            'SELECT * FROM sugerencias_hemodinamia WHERE solicitud_paciente_id = ? AND estatus = 1',
            [solicitudId]
        );

        res.json(rows[0] || null);
    } catch (error) {
        console.error("Error en getSugerenciasBySolicitud:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    saveSugerencias,
    getSugerenciasBySolicitud
};