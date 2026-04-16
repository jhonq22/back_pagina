const db = require('../../config/db');

/**
 * EXAMEN FISICO Y LABORATORIOS HEMODINAMIA
 * Consolida la información de signos vitales, inspección cardiovascular y perfil de laboratorios.
 */
const saveExamenFisico = async (req, res) => {
    const {
        solicitud_paciente_id, 
        
        // Signos Vitales
        peso, talla, fc, fr, ta,
        
        // Inspección Cardiovascular
        ruidos_cardiacos_hemodinamia,
        soplos, soplos_areas_id_hemodinamia, soplos_intensidad_id_hemodinamia, crepitantes,
        
        // Pulso
        estado_pulso_id_hemodinamia, vias_acceso_id_hemodinamia,
        
        // Laboratorios (Hematología y Química)
        hb_hemodinamia, hcto_hemodinamia, pqt_hemodinamia, leu_hemodinamia, 
        glicemia_hemodinamia, urea_hemodinamia, creatinina_hemodinamia, 
        hiv_hemodinamia, vdrl_hemodinamia, hepatitis_hemodinamia,
        
        // Perfil Isquémico
        ckmb_hemodinamia, cktot_hemodinamia, troponina_hemodinamia,
        
        // Perfil Coagulación
        pt_hemodinamia, ptt_hemodinamia, inr_hemodinamia
    } = req.body;

    if (!solicitud_paciente_id) {
        return res.status(400).json({ message: "El solicitud_paciente_id es obligatorio" });
    }

    try {
        const [exist] = await db.query('SELECT id FROM examen_fisico_hemodinamia WHERE solicitud_paciente_id = ?', [solicitud_paciente_id]);

        // Convertimos los campos múltiples a JSON string antes de guardarlos en la BD
        const viasAccesoJson = vias_acceso_id_hemodinamia ? JSON.stringify(vias_acceso_id_hemodinamia) : null;
        const estadoPulsoJson = estado_pulso_id_hemodinamia ? JSON.stringify(estado_pulso_id_hemodinamia) : null; // <-- NUEVO CAMBIO JSON

        if (exist.length > 0) {
            // 2. UPDATE si ya existe el registro
            const updateSql = `
                UPDATE examen_fisico_hemodinamia SET 
                    peso = ?, talla = ?, fc = ?, fr = ?, ta = ?, 
                    ruidos_cardiacos_hemodinamia = ?, soplos = ?, soplos_areas_id_hemodinamia = ?, 
                    soplos_intensidad_id_hemodinamia = ?, crepitantes = ?, estado_pulso_id_hemodinamia = ?, 
                    vias_acceso_id_hemodinamia = ?, 
                    hb_hemodinamia = ?, hcto_hemodinamia = ?, pqt_hemodinamia = ?, leu_hemodinamia = ?, 
                    glicemia_hemodinamia = ?, urea_hemodinamia = ?, creatinina_hemodinamia = ?, 
                    hiv_hemodinamia = ?, vdrl_hemodinamia = ?, hepatitis_hemodinamia = ?, 
                    ckmb_hemodinamia = ?, cktot_hemodinamia = ?, troponina_hemodinamia = ?, 
                    pt_hemodinamia = ?, ptt_hemodinamia = ?, inr_hemodinamia = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP 
                WHERE solicitud_paciente_id = ?`;

            const values = [
                peso, talla, fc, fr, ta,
                ruidos_cardiacos_hemodinamia, soplos, soplos_areas_id_hemodinamia || null, 
                soplos_intensidad_id_hemodinamia || null, crepitantes, 
                estadoPulsoJson, // <-- VARIABLE REEMPLAZADA AQUÍ
                viasAccesoJson, 
                hb_hemodinamia, hcto_hemodinamia, pqt_hemodinamia, leu_hemodinamia, 
                glicemia_hemodinamia, urea_hemodinamia, creatinina_hemodinamia, 
                hiv_hemodinamia, vdrl_hemodinamia, hepatitis_hemodinamia,
                ckmb_hemodinamia, cktot_hemodinamia, troponina_hemodinamia,
                pt_hemodinamia, ptt_hemodinamia, inr_hemodinamia,
                solicitud_paciente_id
            ];

            await db.query(updateSql, values);
            return res.status(200).json({ message: 'Examen físico y laboratorios actualizados' });
        } else {
            // 3. INSERT si es un registro nuevo
            const insertSql = `
                INSERT INTO examen_fisico_hemodinamia (
                    solicitud_paciente_id, peso, talla, fc, fr, ta, 
                    ruidos_cardiacos_hemodinamia, soplos, soplos_areas_id_hemodinamia, soplos_intensidad_id_hemodinamia, 
                    crepitantes, estado_pulso_id_hemodinamia, vias_acceso_id_hemodinamia,
                    hb_hemodinamia, hcto_hemodinamia, pqt_hemodinamia, leu_hemodinamia, 
                    glicemia_hemodinamia, urea_hemodinamia, creatinina_hemodinamia, 
                    hiv_hemodinamia, vdrl_hemodinamia, hepatitis_hemodinamia,
                    ckmb_hemodinamia, cktot_hemodinamia, troponina_hemodinamia,
                    pt_hemodinamia, ptt_hemodinamia, inr_hemodinamia
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = [
                solicitud_paciente_id, peso, talla, fc, fr, ta,
                ruidos_cardiacos_hemodinamia, soplos, soplos_areas_id_hemodinamia || null, soplos_intensidad_id_hemodinamia || null,
                crepitantes, 
                estadoPulsoJson, // <-- VARIABLE REEMPLAZADA AQUÍ
                viasAccesoJson, 
                hb_hemodinamia, hcto_hemodinamia, pqt_hemodinamia, leu_hemodinamia, 
                glicemia_hemodinamia, urea_hemodinamia, creatinina_hemodinamia, 
                hiv_hemodinamia, vdrl_hemodinamia, hepatitis_hemodinamia,
                ckmb_hemodinamia, cktot_hemodinamia, troponina_hemodinamia,
                pt_hemodinamia, ptt_hemodinamia, inr_hemodinamia
            ];

            await db.query(insertSql, values);
            return res.status(201).json({ message: 'Examen físico y laboratorios guardados' });
        }
    } catch (error) {
        console.error("Error en saveExamenFisico:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * OBTENER EXAMEN FISICO POR SOLICITUD
 */
const getExamenFisicoBySolicitud = async (req, res) => {
    const { solicitudId } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM examen_fisico_hemodinamia WHERE solicitud_paciente_id = ?', [solicitudId]);
        res.json(rows[0] || null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    saveExamenFisico,
    getExamenFisicoBySolicitud
};