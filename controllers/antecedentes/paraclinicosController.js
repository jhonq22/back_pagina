const db = require('../../config/db');

/**
 * Catálogo general para Paraclínicos
 */
const lista_catalogo_paraclinicos = async (req, res) => {
    // Ahora recibimos 'categoria' desde los parámetros de la URL
    const { categoria } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT nombre_opcion AS label, id AS value 
             FROM paraclinico_catalogos 
             WHERE categoria = ? AND estatus = 1 
             ORDER BY nombre_opcion ASC`,
            [categoria]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- BLOQUE ECG ---
const saveECG = async (req, res) => {
    const {
        solicitud_paciente_id, ritmo_id, frecuencia_cardiaca, intervalo_pr,
        duracion_qrs, intervalo_qt, eje_qrs, crecimiento_cavidades,
        segmento_st_id, q_patologica, derivacion_afectada_id, bloqueo_rama_id,
        bav_id, suc_bav_id, arritmias_id, f_qrs, f_p, descripcion_hallazgos,
        // NUEVOS 6 CAMPOS
        bav_dos_mobitz_uno, bav_dos_mobitz_dos, bav_conduccion_dos_uno,
        bav_conduccion_tres_uno, bav_conduccion_cuatro_uno, bav_conduccion_otros
    } = req.body;

    try {
        const [exist] = await db.query('SELECT id FROM paciente_paraclinico_ecg WHERE solicitud_paciente_id = ?', [solicitud_paciente_id]);
        const cavidadesJson = crecimiento_cavidades ? JSON.stringify(crecimiento_cavidades) : null;

        if (exist.length > 0) {
            await db.query(
                `UPDATE paciente_paraclinico_ecg SET 
                    ritmo_id=?, frecuencia_cardiaca=?, intervalo_pr=?, duracion_qrs=?, 
                    intervalo_qt=?, eje_qrs=?, crecimiento_cavidades=?, segmento_st_id=?, 
                    q_patologica=?, derivacion_afectada_id=?, bloqueo_rama_id=?, bav_id=?, 
                    suc_bav_id=?, arritmias_id=?, f_qrs=?, f_p=?, descripcion_hallazgos=?,
                    bav_dos_mobitz_uno=?, bav_dos_mobitz_dos=?, bav_conduccion_dos_uno=?,
                    bav_conduccion_tres_uno=?, bav_conduccion_cuatro_uno=?, bav_conduccion_otros=?
                WHERE solicitud_paciente_id=?`,
                [
                    ritmo_id, frecuencia_cardiaca, intervalo_pr, duracion_qrs,
                    intervalo_qt, eje_qrs, cavidadesJson, segmento_st_id,
                    q_patologica, derivacion_afectada_id, bloqueo_rama_id, bav_id,
                    suc_bav_id, arritmias_id, f_qrs, f_p, descripcion_hallazgos,
                    bav_dos_mobitz_uno, bav_dos_mobitz_dos, bav_conduccion_dos_uno,
                    bav_conduccion_tres_uno, bav_conduccion_cuatro_uno, bav_conduccion_otros,
                    solicitud_paciente_id
                ]
            );
            return res.json({ message: 'ECG actualizado' });
        }

        await db.query(
            `INSERT INTO paciente_paraclinico_ecg 
            (
                solicitud_paciente_id, ritmo_id, frecuencia_cardiaca, intervalo_pr, 
                duracion_qrs, intervalo_qt, eje_qrs, crecimiento_cavidades, 
                segmento_st_id, q_patologica, derivacion_afectada_id, bloqueo_rama_id, 
                bav_id, suc_bav_id, arritmias_id, f_qrs, f_p, descripcion_hallazgos,
                bav_dos_mobitz_uno, bav_dos_mobitz_dos, bav_conduccion_dos_uno,
                bav_conduccion_tres_uno, bav_conduccion_cuatro_uno, bav_conduccion_otros
            ) 
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                solicitud_paciente_id, ritmo_id, frecuencia_cardiaca, intervalo_pr,
                duracion_qrs, intervalo_qt, eje_qrs, cavidadesJson,
                segmento_st_id, q_patologica, derivacion_afectada_id, bloqueo_rama_id,
                bav_id, suc_bav_id, arritmias_id, f_qrs, f_p, descripcion_hallazgos,
                bav_dos_mobitz_uno, bav_dos_mobitz_dos, bav_conduccion_dos_uno,
                bav_conduccion_tres_uno, bav_conduccion_cuatro_uno, bav_conduccion_otros
            ]
        );
        res.status(201).json({ message: 'ECG registrado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getECG = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM paciente_paraclinico_ecg WHERE solicitud_paciente_id = ?', [req.params.solicitudId]);
        res.json(rows[0] || null);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- BLOQUE ECO ---
const saveECO = async (req, res) => {
    const {
        solicitud_paciente_id, fevi_simpson, fevi_z_score, ddvi,
        ddvi_z_score, ddvd, evaluacion_valvular_id, evaluacion_sub_valvular_id,
        vcsip, fop,
        valvula_vao_id, valvula_vm_id, valvula_vp_id, valvula_vt_id,
        // --- Nuevos campos extraídos del body ---
        induccion_isquemia_tipo_id, 
        frecuencia_cardiaca_maxima_estimada, 
        resultado_isquemia_id, 
        resultado_viabilidad_id
    } = req.body;

    try {
        const [exist] = await db.query('SELECT id FROM paciente_paraclinico_eco WHERE solicitud_paciente_id = ?', [solicitud_paciente_id]);

        // Convertimos el array a JSON (si existe), de lo contrario lo dejamos nulo
        const evaluacionValvularJson = evaluacion_valvular_id ? JSON.stringify(evaluacion_valvular_id) : null;

        if (exist.length > 0) {
            await db.query(
                `UPDATE paciente_paraclinico_eco SET 
                    fevi_simpson=?, fevi_z_score=?, ddvi=?, ddvi_z_score=?, ddvd=?, 
                    evaluacion_valvular_id=?, evaluacion_sub_valvular_id=?, vcsip=?, fop=?,
                    valvula_vao_id=?, valvula_vm_id=?, valvula_vp_id=?, valvula_vt_id=?,
                    induccion_isquemia_tipo_id=?, frecuencia_cardiaca_maxima_estimada=?,
                    resultado_isquemia_id=?, resultado_viabilidad_id=?
                WHERE solicitud_paciente_id=?`,
                [
                    fevi_simpson, fevi_z_score, ddvi, ddvi_z_score, ddvd,
                    evaluacionValvularJson, 
                    evaluacion_sub_valvular_id, vcsip, fop,
                    valvula_vao_id, valvula_vm_id, valvula_vp_id, valvula_vt_id,
                    induccion_isquemia_tipo_id || null, 
                    frecuencia_cardiaca_maxima_estimada || null, 
                    resultado_isquemia_id || null, 
                    resultado_viabilidad_id || null,
                    solicitud_paciente_id
                ]
            );
            return res.json({ message: 'ECO actualizado' });
        }

        await db.query(
            `INSERT INTO paciente_paraclinico_eco 
            (
                solicitud_paciente_id, fevi_simpson, fevi_z_score, ddvi, ddvi_z_score, ddvd, 
                evaluacion_valvular_id, evaluacion_sub_valvular_id, vcsip, fop,
                valvula_vao_id, valvula_vm_id, valvula_vp_id, valvula_vt_id,
                induccion_isquemia_tipo_id, frecuencia_cardiaca_maxima_estimada, 
                resultado_isquemia_id, resultado_viabilidad_id
            ) 
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, // 18 parámetros en total
            [
                solicitud_paciente_id, fevi_simpson, fevi_z_score, ddvi, ddvi_z_score, ddvd,
                evaluacionValvularJson, 
                evaluacion_sub_valvular_id, vcsip, fop,
                valvula_vao_id, valvula_vm_id, valvula_vp_id, valvula_vt_id,
                induccion_isquemia_tipo_id || null, 
                frecuencia_cardiaca_maxima_estimada || null, 
                resultado_isquemia_id || null, 
                resultado_viabilidad_id || null
            ]
        );
        res.status(201).json({ message: 'ECO registrado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getECO = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM paciente_paraclinico_eco WHERE solicitud_paciente_id = ?', [req.params.solicitudId]);
        res.json(rows[0] || null);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- BLOQUE RX ---
const saveRX = async (req, res) => {
    // 1. Extraemos solo lo necesario del body
    const { solicitud_paciente_id, ict, crecimiento_cavidades, flujo_pulmonar_id, otros_hallazgos } = req.body;

    try {
        // 2. Verificamos si ya existe el registro por el ID de la solicitud
        const [exist] = await db.query(
            'SELECT id FROM paciente_paraclinico_rx WHERE solicitud_paciente_id = ?',
            [solicitud_paciente_id]
        );

        // Formateamos los arrays a JSON para la base de datos
        const cavidadesJson = crecimiento_cavidades ? JSON.stringify(crecimiento_cavidades) : null;
        const hallazgosJson = otros_hallazgos ? JSON.stringify(otros_hallazgos) : null;

        if (exist.length > 0) {
            // 3. UPDATE: 4 campos a actualizar + 1 para el WHERE = 5 parámetros
            await db.query(
                `UPDATE paciente_paraclinico_rx 
                 SET ict=?, crecimiento_cavidades=?, flujo_pulmonar_id=?, otros_hallazgos=? 
                 WHERE solicitud_paciente_id=?`,
                [ict, cavidadesJson, flujo_pulmonar_id, hallazgosJson, solicitud_paciente_id]
            );
            return res.json({ message: 'RX actualizada' });
        } else {
            // 4. INSERT: 5 columnas = 5 parámetros
            await db.query(
                `INSERT INTO paciente_paraclinico_rx 
                (solicitud_paciente_id, ict, crecimiento_cavidades, flujo_pulmonar_id, otros_hallazgos) 
                VALUES (?, ?, ?, ?, ?)`,
                [solicitud_paciente_id, ict, cavidadesJson, flujo_pulmonar_id, hallazgosJson]
            );
            return res.status(201).json({ message: 'RX registrada' });
        }
    } catch (error) {
        console.error("Error en saveRX:", error);
        res.status(500).json({ error: error.message });
    }
};

const getRX = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM paciente_paraclinico_rx WHERE solicitud_paciente_id = ?', [req.params.solicitudId]);
        res.json(rows[0] || null);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = {
    lista_catalogo_paraclinicos,
    saveECG, getECG,
    saveECO, getECO,
    saveRX, getRX
};