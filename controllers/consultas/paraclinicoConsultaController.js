const db = require('../../config/db');

/**
 * Catálogo general para Paraclínicos
 * (Se mantiene intacto según tus instrucciones)
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
        consulta_medica_id, ritmo_id, frecuencia_cardiaca, intervalo_pr,
        duracion_qrs, intervalo_qt, eje_qrs, crecimiento_cavidades,
        segmento_st_id, q_patologica, derivacion_afectada_id, bloqueo_rama_id,
        bav_id, suc_bav_id, arritmias_id, f_qrs, f_p, descripcion_hallazgos,
        bav_dos_mobitz_uno, bav_dos_mobitz_dos, bav_conduccion_dos_uno,
        bav_conduccion_tres_uno, bav_conduccion_cuatro_uno, bav_conduccion_otros
    } = req.body;

    try {
        const [exist] = await db.query('SELECT id FROM consulta_paraclinico_ecg WHERE consulta_medica_id = ?', [consulta_medica_id]);
        
        // Formateo a JSON para los campos múltiples
        const cavidadesJson = crecimiento_cavidades ? JSON.stringify(crecimiento_cavidades) : null;
        const derivacionesJson = derivacion_afectada_id ? JSON.stringify(derivacion_afectada_id) : null; 

        if (exist.length > 0) {
            await db.query(
                `UPDATE consulta_paraclinico_ecg SET 
                    ritmo_id=?, frecuencia_cardiaca=?, intervalo_pr=?, duracion_qrs=?, 
                    intervalo_qt=?, eje_qrs=?, crecimiento_cavidades=?, segmento_st_id=?, 
                    q_patologica=?, derivacion_afectada_id=?, bloqueo_rama_id=?, bav_id=?, 
                    suc_bav_id=?, arritmias_id=?, f_qrs=?, f_p=?, descripcion_hallazgos=?,
                    bav_dos_mobitz_uno=?, bav_dos_mobitz_dos=?, bav_conduccion_dos_uno=?,
                    bav_conduccion_tres_uno=?, bav_conduccion_cuatro_uno=?, bav_conduccion_otros=?
                WHERE consulta_medica_id=?`,
                [
                    ritmo_id, frecuencia_cardiaca, intervalo_pr, duracion_qrs,
                    intervalo_qt, eje_qrs, cavidadesJson, segmento_st_id,
                    q_patologica, derivacionesJson, bloqueo_rama_id, bav_id, 
                    suc_bav_id, arritmias_id, f_qrs, f_p, descripcion_hallazgos,
                    bav_dos_mobitz_uno, bav_dos_mobitz_dos, bav_conduccion_dos_uno,
                    bav_conduccion_tres_uno, bav_conduccion_cuatro_uno, bav_conduccion_otros,
                    consulta_medica_id
                ]
            );
            return res.json({ message: 'ECG actualizado' });
        }

        await db.query(
            `INSERT INTO consulta_paraclinico_ecg 
            (
                consulta_medica_id, ritmo_id, frecuencia_cardiaca, intervalo_pr, 
                duracion_qrs, intervalo_qt, eje_qrs, crecimiento_cavidades, 
                segmento_st_id, q_patologica, derivacion_afectada_id, bloqueo_rama_id, 
                bav_id, suc_bav_id, arritmias_id, f_qrs, f_p, descripcion_hallazgos,
                bav_dos_mobitz_uno, bav_dos_mobitz_dos, bav_conduccion_dos_uno,
                bav_conduccion_tres_uno, bav_conduccion_cuatro_uno, bav_conduccion_otros
            ) 
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                consulta_medica_id, ritmo_id, frecuencia_cardiaca, intervalo_pr,
                duracion_qrs, intervalo_qt, eje_qrs, cavidadesJson,
                segmento_st_id, q_patologica, derivacionesJson, bloqueo_rama_id, 
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
        const [rows] = await db.query('SELECT * FROM consulta_paraclinico_ecg WHERE consulta_medica_id = ?', [req.params.consultaId]);
        res.json(rows[0] || null);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- BLOQUE ECO ---
const saveECO = async (req, res) => {
    const {
        consulta_medica_id, fevi_simpson, fevi_z_score, ddvi,
        ddvi_z_score, ddvd, evaluacion_valvular_id, evaluacion_sub_valvular_id,
        vcsip, fop,
        valvula_vao_id, valvula_vm_id, valvula_vp_id, valvula_vt_id,
        induccion_isquemia_tipo_id, 
        frecuencia_cardiaca_maxima_estimada, 
        resultado_isquemia_id, 
        territorio_isquemia_id, 
        resultado_viabilidad_id,
        territorio_viabilidad_id, 
        estado_funcion_sistolica_id_hemodinamia,
        funcion_sistolica_id_hemodinamia,
        funcion_diastolica_id_hemodinamia,
        trastorno_contractilidad_json_hemodinamia,
        descripcion_eco_hemodinamia,
        descripcion_eco_doppler_hemodinamia
    } = req.body;

    try {
        const [exist] = await db.query('SELECT id FROM consulta_paraclinico_eco WHERE consulta_medica_id = ?', [consulta_medica_id]);

        const evaluacionValvularJson = evaluacion_valvular_id ? JSON.stringify(evaluacion_valvular_id) : null;
        const trastornoContractilidadJson = trastorno_contractilidad_json_hemodinamia ? JSON.stringify(trastorno_contractilidad_json_hemodinamia) : null;

        if (exist.length > 0) {
            await db.query(
                `UPDATE consulta_paraclinico_eco SET 
                    fevi_simpson=?, fevi_z_score=?, ddvi=?, ddvi_z_score=?, ddvd=?, 
                    evaluacion_valvular_id=?, evaluacion_sub_valvular_id=?, vcsip=?, fop=?,
                    valvula_vao_id=?, valvula_vm_id=?, valvula_vp_id=?, valvula_vt_id=?,
                    induccion_isquemia_tipo_id=?, frecuencia_cardiaca_maxima_estimada=?,
                    resultado_isquemia_id=?, territorio_isquemia_id=?, 
                    resultado_viabilidad_id=?, territorio_viabilidad_id=?,
                    estado_funcion_sistolica_id_hemodinamia=?, funcion_sistolica_id_hemodinamia=?,
                    funcion_diastolica_id_hemodinamia=?, trastorno_contractilidad_json_hemodinamia=?,
                    descripcion_eco_hemodinamia=?, descripcion_eco_doppler_hemodinamia=?
                WHERE consulta_medica_id=?`,
                [
                    fevi_simpson, fevi_z_score, ddvi, ddvi_z_score, ddvd,
                    evaluacionValvularJson, 
                    evaluacion_sub_valvular_id, vcsip, fop,
                    valvula_vao_id, valvula_vm_id, valvula_vp_id, valvula_vt_id,
                    induccion_isquemia_tipo_id || null, 
                    frecuencia_cardiaca_maxima_estimada || null, 
                    resultado_isquemia_id || null, 
                    territorio_isquemia_id || null, 
                    resultado_viabilidad_id || null,
                    territorio_viabilidad_id || null, 
                    estado_funcion_sistolica_id_hemodinamia || null,
                    funcion_sistolica_id_hemodinamia || null,
                    funcion_diastolica_id_hemodinamia || null,
                    trastornoContractilidadJson,
                    descripcion_eco_hemodinamia || null,
                    descripcion_eco_doppler_hemodinamia || null,
                    consulta_medica_id
                ]
            );
            return res.json({ message: 'ECO actualizado' });
        }

        await db.query(
            `INSERT INTO consulta_paraclinico_eco 
            (
                consulta_medica_id, fevi_simpson, fevi_z_score, ddvi, ddvi_z_score, ddvd, 
                evaluacion_valvular_id, evaluacion_sub_valvular_id, vcsip, fop,
                valvula_vao_id, valvula_vm_id, valvula_vp_id, valvula_vt_id,
                induccion_isquemia_tipo_id, frecuencia_cardiaca_maxima_estimada, 
                resultado_isquemia_id, territorio_isquemia_id,
                resultado_viabilidad_id, territorio_viabilidad_id,
                estado_funcion_sistolica_id_hemodinamia, funcion_sistolica_id_hemodinamia,
                funcion_diastolica_id_hemodinamia, trastorno_contractilidad_json_hemodinamia,
                descripcion_eco_hemodinamia, descripcion_eco_doppler_hemodinamia
            ) 
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, 
            [
                consulta_medica_id, fevi_simpson, fevi_z_score, ddvi, ddvi_z_score, ddvd,
                evaluacionValvularJson, 
                evaluacion_sub_valvular_id, vcsip, fop,
                valvula_vao_id, valvula_vm_id, valvula_vp_id, valvula_vt_id,
                induccion_isquemia_tipo_id || null, 
                frecuencia_cardiaca_maxima_estimada || null, 
                resultado_isquemia_id || null, 
                territorio_isquemia_id || null, 
                resultado_viabilidad_id || null,
                territorio_viabilidad_id || null, 
                estado_funcion_sistolica_id_hemodinamia || null,
                funcion_sistolica_id_hemodinamia || null,
                funcion_diastolica_id_hemodinamia || null,
                trastornoContractilidadJson,
                descripcion_eco_hemodinamia || null,
                descripcion_eco_doppler_hemodinamia || null
            ]
        );
        res.status(201).json({ message: 'ECO registrado' });
    } catch (error) {
        console.error("Error en saveECO:", error);
        res.status(500).json({ error: error.message });
    }
};

const getECO = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM consulta_paraclinico_eco WHERE consulta_medica_id = ?', [req.params.consultaId]);
        res.json(rows[0] || null);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- BLOQUE RX ---
const saveRX = async (req, res) => {
    const { consulta_medica_id, ict, crecimiento_cavidades, flujo_pulmonar_id, otros_hallazgos } = req.body;

    try {
        const [exist] = await db.query(
            'SELECT id FROM consulta_paraclinico_rx WHERE consulta_medica_id = ?',
            [consulta_medica_id]
        );

        const cavidadesJson = crecimiento_cavidades ? JSON.stringify(crecimiento_cavidades) : null;
        const hallazgosJson = otros_hallazgos ? JSON.stringify(otros_hallazgos) : null;

        if (exist.length > 0) {
            await db.query(
                `UPDATE consulta_paraclinico_rx 
                 SET ict=?, crecimiento_cavidades=?, flujo_pulmonar_id=?, otros_hallazgos=? 
                 WHERE consulta_medica_id=?`,
                [ict, cavidadesJson, flujo_pulmonar_id, hallazgosJson, consulta_medica_id]
            );
            return res.json({ message: 'RX actualizada' });
        } else {
            await db.query(
                `INSERT INTO consulta_paraclinico_rx 
                (consulta_medica_id, ict, crecimiento_cavidades, flujo_pulmonar_id, otros_hallazgos) 
                VALUES (?, ?, ?, ?, ?)`,
                [consulta_medica_id, ict, cavidadesJson, flujo_pulmonar_id, hallazgosJson]
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
        const [rows] = await db.query('SELECT * FROM consulta_paraclinico_rx WHERE consulta_medica_id = ?', [req.params.consultaId]);
        res.json(rows[0] || null);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = {
    lista_catalogo_paraclinicos,
    saveECG, getECG,
    saveECO, getECO,
    saveRX, getRX
};