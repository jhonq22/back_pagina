const db = require('../../config/db');

/**
 * Obtiene opciones de catálogo de antecedentes filtradas por padre_id
 */
const lista_catalogo_antecedentes = async (req, res) => {
    const { padre_id } = req.params;

    if (!padre_id) {
        return res.status(400).json({ message: "El padre_id es requerido" });
    }

    try {
        const [rows] = await db.query(
            `SELECT 
                nombre AS label, 
                id AS value 
             FROM antecedentes_catalogos 
             WHERE padre_id = ? AND estatus = 1
             ORDER BY nombre ASC`,
            [padre_id]
        );

        res.json(rows);
    } catch (error) {
        console.error("Error en lista_catalogo_antecedentes:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Guarda o Actualiza los Antecedentes del Paciente (Upsert)
 */
const saveAntecedentes = async (req, res) => {
    const {
        solicitud_paciente_id,
        hospitalizacion_personales_mayores,
        patologia_base,
        hospitalizacion_neonatal,
        habitos,
        quirurgico,
        descripcion_quirurgico,
        familiares,
        descripcion_familiares,
        tipo, // 'PERSONALES', 'FAMILIARES' o 'QUIRURGICOS'
        neonatal_pan,
        neonatal_tan,
        neonatal_eg,
        otras,
        estatus,
        // --- NUEVOS CAMPOS HEMODINAMIA ---
        hta_hemodinamia,
        dislipidemia_hemodinamia,
        erc_hemodinamia,
        erc_hemodinamia_hijo, 
        neurologico_conservado_hc_hemodinamia,
        sincope_hemodinamia,
        claudicacion_intermitente_hemodinamia,
        diabetes_mellitus_hemodinamia,
        diabetes_mellitus_hemodinamia_hijo,
        tabaquismo_hemodinamia,
        tabaquismo_hemodinamia_hijo,
        antecedentes_cardiopatia_isquemica_hemodinamia,
        scasest_angina_inestable_hijo_hemodinamia,
        im_sin_elevacion_st_hijo_hemodinamia,
        scacest_hijo_hemodinamia,
        alergia_yodo_hemodinamia,
        alergia_yodo_hemodinamia_hijo,
        alergia_medicamentos_hemodinamia,
        alergia_medicamentos_hemodinamia_hijo,
        otras_patologias_hemodinamia,
        otras_patologias_hemodinamia_hijo
    } = req.body;

    // Validaciones iniciales
    if (!solicitud_paciente_id) {
        return res.status(400).json({ message: "ID de solicitud requerido" });
    }
    if (!tipo) {
        return res.status(400).json({ message: "El tipo de antecendete es requerido" });
    }

    try {
        const [exist] = await db.query(
            'SELECT id FROM pacientes_antecedentes WHERE solicitud_paciente_id = ? AND tipo = ?',
            [solicitud_paciente_id, tipo]
        );

        const camposJson = {
            hpm: hospitalizacion_personales_mayores ? JSON.stringify(hospitalizacion_personales_mayores) : null,
            pb: patologia_base ? JSON.stringify(patologia_base) : null,
            hn: hospitalizacion_neonatal ? JSON.stringify(hospitalizacion_neonatal) : null,
            hb: habitos ? JSON.stringify(habitos) : null,
            q: quirurgico ? JSON.stringify(quirurgico) : null,
            f: familiares ? JSON.stringify(familiares) : null
        };

        if (exist.length > 0) {
            // 2. UPDATE
            const updateSql = `
                UPDATE pacientes_antecedentes SET 
                    hospitalizacion_personales_mayores = ?, 
                    patologia_base = ?, 
                    hospitalizacion_neonatal = ?, 
                    habitos = ?, 
                    quirurgico = ?, 
                    descripcion_quirurgico = ?, 
                    familiares = ?, 
                    descripcion_familiares = ?, 
                    neonatal_pan = ?, 
                    neonatal_tan = ?, 
                    neonatal_eg = ?, 
                    otras = ?, 
                    estatus = ?,
                    hta_hemodinamia = ?,
                    dislipidemia_hemodinamia = ?,
                    erc_hemodinamia = ?,
                    erc_hemodinamia_hijo = ?,
                    neurologico_conservado_hc_hemodinamia = ?,
                    sincope_hemodinamia = ?,
                    claudicacion_intermitente_hemodinamia = ?,
                    diabetes_mellitus_hemodinamia = ?,
                    diabetes_mellitus_hemodinamia_hijo = ?,
                    tabaquismo_hemodinamia = ?,
                    tabaquismo_hemodinamia_hijo = ?,
                    antecedentes_cardiopatia_isquemica_hemodinamia = ?,
                    scasest_angina_inestable_hijo_hemodinamia = ?,
                    im_sin_elevacion_st_hijo_hemodinamia = ?,
                    scacest_hijo_hemodinamia = ?,
                    alergia_yodo_hemodinamia = ?,
                    alergia_yodo_hemodinamia_hijo = ?,
                    alergia_medicamentos_hemodinamia = ?,
                    alergia_medicamentos_hemodinamia_hijo = ?,
                    otras_patologias_hemodinamia = ?,
                    otras_patologias_hemodinamia_hijo = ?,
                    fecha_modificacion = CURRENT_TIMESTAMP
                WHERE solicitud_paciente_id = ? AND tipo = ?`;

            const updateValues = [
                camposJson.hpm, camposJson.pb, camposJson.hn,
                camposJson.hb, camposJson.q, 
                descripcion_quirurgico || null, 
                camposJson.f, descripcion_familiares || null,
                neonatal_pan, neonatal_tan, neonatal_eg,
                otras, estatus || 1,
                hta_hemodinamia, dislipidemia_hemodinamia, erc_hemodinamia,
                erc_hemodinamia_hijo, // <--- VALOR AGREGADO
                neurologico_conservado_hc_hemodinamia, sincope_hemodinamia, claudicacion_intermitente_hemodinamia,
                diabetes_mellitus_hemodinamia, diabetes_mellitus_hemodinamia_hijo,
                tabaquismo_hemodinamia, tabaquismo_hemodinamia_hijo,
                antecedentes_cardiopatia_isquemica_hemodinamia, scasest_angina_inestable_hijo_hemodinamia,
                im_sin_elevacion_st_hijo_hemodinamia, scacest_hijo_hemodinamia,
                alergia_yodo_hemodinamia, alergia_yodo_hemodinamia_hijo,
                alergia_medicamentos_hemodinamia, alergia_medicamentos_hemodinamia_hijo,
                otras_patologias_hemodinamia, otras_patologias_hemodinamia_hijo,
                solicitud_paciente_id, tipo 
            ];

            await db.query(updateSql, updateValues);
            return res.json({ message: `Antecedentes ${tipo} actualizados con éxito` });

        } else {
            // 3. INSERT
            const insertSql = `
                INSERT INTO pacientes_antecedentes 
                (
                    solicitud_paciente_id, hospitalizacion_personales_mayores, 
                    patologia_base, hospitalizacion_neonatal, habitos, 
                    quirurgico, descripcion_quirurgico, familiares, descripcion_familiares, tipo, 
                    neonatal_pan, neonatal_tan, neonatal_eg, otras, estatus,
                    hta_hemodinamia, dislipidemia_hemodinamia, erc_hemodinamia, 
                    erc_hemodinamia_hijo, 
                    neurologico_conservado_hc_hemodinamia,
                    sincope_hemodinamia, claudicacion_intermitente_hemodinamia,
                    diabetes_mellitus_hemodinamia, diabetes_mellitus_hemodinamia_hijo,
                    tabaquismo_hemodinamia, tabaquismo_hemodinamia_hijo,
                    antecedentes_cardiopatia_isquemica_hemodinamia, scasest_angina_inestable_hijo_hemodinamia,
                    im_sin_elevacion_st_hijo_hemodinamia, scacest_hijo_hemodinamia,
                    alergia_yodo_hemodinamia, alergia_yodo_hemodinamia_hijo,
                    alergia_medicamentos_hemodinamia, alergia_medicamentos_hemodinamia_hijo,
                    otras_patologias_hemodinamia, otras_patologias_hemodinamia_hijo
                ) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const insertValues = [
                solicitud_paciente_id, camposJson.hpm, camposJson.pb,
                camposJson.hn, camposJson.hb, camposJson.q, 
                descripcion_quirurgico || null, 
                camposJson.f, descripcion_familiares || null,
                tipo, neonatal_pan, neonatal_tan, neonatal_eg,
                otras, estatus || 1,
                hta_hemodinamia, dislipidemia_hemodinamia, erc_hemodinamia,
                erc_hemodinamia_hijo, // <--- VALOR AGREGADO
                neurologico_conservado_hc_hemodinamia,
                sincope_hemodinamia, claudicacion_intermitente_hemodinamia,
                diabetes_mellitus_hemodinamia, diabetes_mellitus_hemodinamia_hijo,
                tabaquismo_hemodinamia, tabaquismo_hemodinamia_hijo,
                antecedentes_cardiopatia_isquemica_hemodinamia, scasest_angina_inestable_hijo_hemodinamia,
                im_sin_elevacion_st_hijo_hemodinamia, scacest_hijo_hemodinamia,
                alergia_yodo_hemodinamia, alergia_yodo_hemodinamia_hijo,
                alergia_medicamentos_hemodinamia, alergia_medicamentos_hemodinamia_hijo,
                otras_patologias_hemodinamia, otras_patologias_hemodinamia_hijo
            ];

            await db.query(insertSql, insertValues);
            return res.status(201).json({ message: `Antecedentes ${tipo} registrados con éxito` });
        }
    } catch (error) {
        console.error("Error en saveAntecedentes:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obtiene antecedentes por ID de solicitud
 */
const getAntecedentesBySolicitud = async (req, res) => {
    const { solicitudId } = req.params;

    if (!solicitudId) {
        return res.status(400).json({ message: "ID de solicitud es necesario" });
    }

    try {
        // 1. Obtenemos todos los registros de la solicitud (pueden ser hasta 3)
        const [rows] = await db.query(
            `SELECT * FROM pacientes_antecedentes 
             WHERE solicitud_paciente_id = ? AND estatus = 1`,
            [solicitudId]
        );

        if (rows.length === 0) {
            return res.json(null);
        }

        // 2. Unificamos todos los registros en un solo objeto "aplanado"
        // Esto combina los datos de PERSONALES, FAMILIARES y QUIRURGICOS
        const unificado = rows.reduce((acc, current) => {
            // Recorremos cada campo del registro actual
            Object.keys(current).forEach(key => {
                // Solo asignamos el valor si no es NULL en el registro actual
                // o si el acumulador aún no tiene valor para esa llave
                if (current[key] !== null) {
                    acc[key] = current[key];
                }
            });
            return acc;
        }, {});

        // 3. Enviamos el objeto unificado
        res.json(unificado);

    } catch (error) {
        console.error("Error al obtener antecedentes unificados:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    saveAntecedentes,
    getAntecedentesBySolicitud,
    lista_catalogo_antecedentes
};