const db = require('../../config/db');

/**
 * Obtiene opciones de catálogo filtradas por padre_id
 */
const lista_catologo_enfermedad = async (req, res) => {
    const { padre_id } = req.params;

    if (!padre_id) {
        return res.status(400).json({ message: "El padre_id es requerido" });
    }

    try {
        const [rows] = await db.query(
            `SELECT 
                nombre AS label, 
                id AS value 
             FROM enfermedad_actual_catalogos 
             WHERE padre_id = ? AND estatus = 1
             ORDER BY nombre ASC`,
            [padre_id]
        );

        res.json(rows);
    } catch (error) {
        console.error("Error en lista_catologo_enfermedad:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Guarda o Actualiza la Enfermedad Actual del Paciente (Upsert)
 */
const saveEnfermedadActual = async (req, res) => {
    const {
        solicitud_paciente_id,
        ultimo_peso_kg,
        ultimo_peso_fecha,
        peso_actual_kg,
        inicio_sintomalogia_id,
        portador_cardiopatia_estructural,
        tipo_portador_id,
        en_condiccion_id,
        sintomas,
        ic_id,
        origen_torasico_id,
        presentacion_id,
        riesgos_id,
        inicio_id,
        duracion,
        fin_id,
        concamitante_id,
        frecuencia_sincope_id,
        aparicion_id,
        frecuencia_pre_sincope_id,
        clase_funcional_id,
        ross,
        nyha,
        otra_sintomatologia,
        retraso_pondoestatural,
        retraso_pondoestatural_mayor_p3,
        retraso_pondoestatural_mayor_p10,
        retraso_pondoestatural_menor_p10,
        retraso_combo_id,
        // --- NUEVOS CAMPOS HEMODINAMIA ---
        asintomatico_cardiovascular_hemodinamia,
        angina_estable_esfuerzo_hemodinamia,
        angina_hijo_hemodinamia_id,
        scascest_hemodinamia,
        scascest_hemodinamia_hijo_id,
        disnea_esfuerzo_hemodinamia,
        disnea_hijo_id,
        sincope_hemodinamia,
        scacest_texto // <-- NUEVO CAMPO RECIBIDO
    } = req.body;

    if (!solicitud_paciente_id) {
        return res.status(400).json({ message: "ID de solicitud requerido" });
    }

    try {
        const [exist] = await db.query(
            'SELECT id FROM paciente_enfermedad_actual WHERE solicitud_paciente_id = ?',
            [solicitud_paciente_id]
        );

        const sintomasJson = sintomas ? JSON.stringify(sintomas) : null;

        if (exist.length > 0) {
            const updateSql = `
                UPDATE paciente_enfermedad_actual SET 
                    ultimo_peso_kg = ?, ultimo_peso_fecha = ?, peso_actual_kg = ?, 
                    inicio_sintomalogia_id = ?, portador_cardiopatia_estructural = ?, 
                    tipo_portador_id = ?, en_condiccion_id = ?, sintomas = ?, 
                    ic_id = ?, origen_torasico_id = ?, presentacion_id = ?, 
                    riesgos_id = ?, inicio_id = ?, duracion = ?, fin_id = ?, 
                    concamitante_id = ?, frecuencia_sincope_id = ?, aparicion_id = ?, 
                    frecuencia_pre_sincope_id = ?, clase_funcional_id = ?, 
                    ross = ?, nyha = ?, otra_sintomatologia = ?,
                    retraso_pondoestatural = ?, retraso_pondoestatural_mayor_p3 = ?, 
                    retraso_pondoestatural_mayor_p10 = ?, retraso_pondoestatural_menor_p10 = ?,
                    retraso_combo_id = ?,
                    asintomatico_cardiovascular_hemodinamia = ?, angina_estable_esfuerzo_hemodinamia = ?,
                    angina_hijo_hemodinamia_id = ?, scascest_hemodinamia = ?,
                    scascest_hemodinamia_hijo_id = ?, disnea_esfuerzo_hemodinamia = ?,
                    disnea_hijo_id = ?, sincope_hemodinamia = ?,
                    scacest_texto = ?, -- <-- ACTUALIZACIÓN DEL NUEVO CAMPO
                    fecha_modificacion = CURRENT_TIMESTAMP
                WHERE solicitud_paciente_id = ?`;

            const updateValues = [
                ultimo_peso_kg, ultimo_peso_fecha, peso_actual_kg,
                inicio_sintomalogia_id, portador_cardiopatia_estructural,
                tipo_portador_id, en_condiccion_id, sintomasJson,
                ic_id, origen_torasico_id, presentacion_id,
                riesgos_id, inicio_id, duracion, fin_id,
                concamitante_id, frecuencia_sincope_id, aparicion_id,
                frecuencia_pre_sincope_id, clase_funcional_id,
                ross, nyha, otra_sintomatologia,
                retraso_pondoestatural, retraso_pondoestatural_mayor_p3,
                retraso_pondoestatural_mayor_p10, retraso_pondoestatural_menor_p10,
                retraso_combo_id,
                asintomatico_cardiovascular_hemodinamia, angina_estable_esfuerzo_hemodinamia,
                angina_hijo_hemodinamia_id, scascest_hemodinamia,
                scascest_hemodinamia_hijo_id, disnea_esfuerzo_hemodinamia,
                disnea_hijo_id, sincope_hemodinamia,
                scacest_texto, // <-- VALOR NUEVO
                solicitud_paciente_id
            ];

            await db.query(updateSql, updateValues);
            return res.json({ message: 'Enfermedad actual actualizada con éxito' });

        } else {
            const insertSql = `
                INSERT INTO paciente_enfermedad_actual 
                (
                    solicitud_paciente_id, ultimo_peso_kg, ultimo_peso_fecha, peso_actual_kg, 
                    inicio_sintomalogia_id, portador_cardiopatia_estructural, 
                    tipo_portador_id, en_condiccion_id, sintomas, 
                    ic_id, origen_torasico_id, presentacion_id, 
                    riesgos_id, inicio_id, duracion, fin_id, 
                    concamitante_id, frecuencia_sincope_id, aparicion_id, 
                    frecuencia_pre_sincope_id, clase_funcional_id, 
                    ross, nyha, otra_sintomatologia,
                    retraso_pondoestatural, retraso_pondoestatural_mayor_p3, 
                    retraso_pondoestatural_mayor_p10, retraso_pondoestatural_menor_p10,
                    retraso_combo_id, asintomatico_cardiovascular_hemodinamia, 
                    angina_estable_esfuerzo_hemodinamia, angina_hijo_hemodinamia_id, 
                    scascest_hemodinamia, scascest_hemodinamia_hijo_id, 
                    disnea_esfuerzo_hemodinamia, disnea_hijo_id, sincope_hemodinamia,
                    scacest_texto -- <-- NUEVO CAMPO EN INSERT
                ) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const insertValues = [
                solicitud_paciente_id, ultimo_peso_kg, ultimo_peso_fecha, peso_actual_kg,
                inicio_sintomalogia_id, portador_cardiopatia_estructural,
                tipo_portador_id, en_condiccion_id, sintomasJson,
                ic_id, origen_torasico_id, presentacion_id,
                riesgos_id, inicio_id, duracion, fin_id,
                concamitante_id, frecuencia_sincope_id, aparicion_id,
                frecuencia_pre_sincope_id, clase_funcional_id,
                ross, nyha, otra_sintomatologia,
                retraso_pondoestatural, retraso_pondoestatural_mayor_p3,
                retraso_pondoestatural_mayor_p10, retraso_pondoestatural_menor_p10,
                retraso_combo_id, asintomatico_cardiovascular_hemodinamia,
                angina_estable_esfuerzo_hemodinamia, angina_hijo_hemodinamia_id,
                scascest_hemodinamia, scascest_hemodinamia_hijo_id,
                disnea_esfuerzo_hemodinamia, disnea_hijo_id, sincope_hemodinamia,
                scacest_texto // <-- VALOR NUEVO
            ];

            await db.query(insertSql, insertValues);
            return res.status(201).json({ message: 'Enfermedad actual registrada con éxito' });
        }
    } catch (error) {
        console.error("Error en saveEnfermedadActual:", error);
        res.status(500).json({ error: error.message });
    }
};

const getEnfermedadBySolicitud = async (req, res) => {
    const { solicitudId } = req.params;

    if (!solicitudId) {
        return res.status(400).json({ message: "ID de solicitud es necesario" });
    }

    try {
        const [rows] = await db.query(
            `SELECT * FROM paciente_enfermedad_actual 
             WHERE solicitud_paciente_id = ? AND estatus = 1`,
            [solicitudId]
        );

        res.json(rows[0] || null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    saveEnfermedadActual,
    getEnfermedadBySolicitud,
    lista_catologo_enfermedad
};