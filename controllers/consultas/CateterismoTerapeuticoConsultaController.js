const db = require('../../config/db');

/**
 * =========================================================================
 * PANTALLA 1: ARTERIAS TERAPÉUTICAS (Mantiene la lógica original intacta)
 * =========================================================================
 */

/**
 * GUARDAR O ACTUALIZAR CATETERISMO TERAPÉUTICO (UPSERT MAESTRO-DETALLE)
 */
const saveTerapeutico = async (req, res) => {
    const { consulta_medica_id, arterias_terapeuticas } = req.body;

    if (!consulta_medica_id) {
        return res.status(400).json({ message: "El consulta_medica_id es obligatorio" });
    }

    try {
        // 1. Verificar si ya existe la cabecera (Maestro)
        const [exist] = await db.query(
            'SELECT id FROM cateterismo_terapeutico_consulta WHERE consulta_medica_id = ?',
            [consulta_medica_id]
        );

        let terapeuticoId;

        if (exist.length > 0) {
            // 2. Si existe, actualizamos la fecha del maestro
            terapeuticoId = exist[0].id;
            await db.query(
                'UPDATE cateterismo_terapeutico_consulta SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
                [terapeuticoId]
            );

            // 3. Limpiamos el detalle anterior (borramos las arterias viejas para insertar las nuevas)
            await db.query(
                'DELETE FROM consulta_cateterismo_terapeutico_detalle_arterias WHERE terapeutico_id = ?',
                [terapeuticoId]
            );
        } else {
            // 4. Si no existe, creamos el maestro
            const [result] = await db.query(
                'INSERT INTO cateterismo_terapeutico_consulta (consulta_medica_id) VALUES (?)',
                [consulta_medica_id]
            );
            terapeuticoId = result.insertId;
        }

        // 5. Insertamos las arterias tratadas en la tabla detalle
        if (arterias_terapeuticas && arterias_terapeuticas.length > 0) {
            const arteriasValues = arterias_terapeuticas.map(a => [
                terapeuticoId,
                a.arteria_nombre,
                a.lesion_residual_hemodinamia || null,
                a.flujo_hemodinamia || null,
                a.tipo_json_hemodinamia ? JSON.stringify(a.tipo_json_hemodinamia) : null, // Se convierte el array a JSON
                a.tecnica_hemodinamia || null,
                a.medina_hemodinamia || null
            ]);

            await db.query(
                `INSERT INTO consulta_cateterismo_terapeutico_detalle_arterias 
                (terapeutico_id, arteria_nombre, lesion_residual_hemodinamia, flujo_hemodinamia, tipo_json_hemodinamia, tecnica_hemodinamia, medina_hemodinamia) 
                VALUES ?`,
                [arteriasValues]
            );
        }

        return res.status(200).json({ message: 'Cateterismo terapéutico guardado con éxito' });

    } catch (error) {
        console.error("Error en saveTerapeutico:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * OBTENER DATOS DEL CATETERISMO TERAPÉUTICO POR CONSULTA
 */
const getTerapeuticoBySolicitud = async (req, res) => {
    // Asegúrate de que en tu router este parámetro se llame :consulta_medica_id
    // Ej: router.get('/terapeutico/:consulta_medica_id', getTerapeuticoBySolicitud)
    const { consulta_medica_id } = req.params;

    try {
        // Obtenemos el maestro
        const [maestro] = await db.query(
            'SELECT id, consulta_medica_id FROM cateterismo_terapeutico_consulta WHERE consulta_medica_id = ?',
            [consulta_medica_id]
        );

        if (maestro.length === 0) {
            return res.json({ arterias_terapeuticas: [] }); // Retorna vacío si no hay datos
        }

        const terapeuticoId = maestro[0].id;

        // Obtenemos los detalles (arterias)
        const [arterias] = await db.query(
            'SELECT * FROM consulta_cateterismo_terapeutico_detalle_arterias WHERE terapeutico_id = ?',
            [terapeuticoId]
        );

        // Parseamos el JSON del campo 'tipo' para que el frontend lo reciba como un arreglo normal
        const arteriasFormateadas = arterias.map(art => ({
            ...art,
            tipo_json_hemodinamia: art.tipo_json_hemodinamia ? JSON.parse(art.tipo_json_hemodinamia) : []
        }));

        res.json({
            id: terapeuticoId,
            consulta_medica_id: maestro[0].consulta_medica_id,
            arterias_terapeuticas: arteriasFormateadas
        });

    } catch (error) {
        console.error("Error en getTerapeuticoBySolicitud:", error);
        res.status(500).json({ error: error.message });
    }
};


/**
 * =========================================================================
 * PANTALLA 2: DATOS GENERALES DEL TERAPÉUTICO (Nuevas Funciones)
 * =========================================================================
 */

/**
 * GUARDAR O ACTUALIZAR LOS DATOS GENERALES DEL PADRE
 */
const saveTerapeuticoGeneral = async (req, res) => {
    const {
        consulta_medica_id,
        tecnica_cateterismo_terapeutico_id,
        intervencion_realizada_id, // Este es el Array/JSON
        complicaciones_procedimiento_terapeutico, // Este es Array/JSON
        complicaciones_acceso_terapeutico, // Este es INT
        sugerencia_terapeuticas_id,
        territorio_angioplastia_id
    } = req.body;

    if (!consulta_medica_id) {
        return res.status(400).json({ message: "El consulta_medica_id es obligatorio" });
    }

    try {
        const [exist] = await db.query(
            'SELECT id FROM cateterismo_terapeutico_consulta WHERE consulta_medica_id = ?',
            [consulta_medica_id]
        );

        // Convertimos los arreglos a string JSON válido (si existen)
        const intervencionJson = intervencion_realizada_id ? JSON.stringify(intervencion_realizada_id) : null;
        const compProcedimientoJson = complicaciones_procedimiento_terapeutico ? JSON.stringify(complicaciones_procedimiento_terapeutico) : null;

        if (exist.length > 0) {
            // Si el padre ya existe, actualizamos solo estos campos
            await db.query(
                `UPDATE cateterismo_terapeutico_consulta SET 
                    tecnica_cateterismo_terapeutico_id = ?, 
                    intervencion_realizada_id = ?, 
                    complicaciones_procedimiento_terapeutico = ?, 
                    complicaciones_acceso_terapeutico = ?, 
                    sugerencia_terapeuticas_id = ?,
                    territorio_angioplastia_id = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE consulta_medica_id = ?`,
                [
                    tecnica_cateterismo_terapeutico_id || null,
                    intervencionJson,
                    compProcedimientoJson, // <-- JSON Stringificado
                    complicaciones_acceso_terapeutico || null, // <-- INT Directo
                    sugerencia_terapeuticas_id || null,
                    territorio_angioplastia_id || null,
                    consulta_medica_id
                ]
            );
            return res.status(200).json({ message: 'Datos generales terapéuticos actualizados con éxito' });
        } else {
            // Si el padre NO existe, lo creamos con estos campos
            await db.query(
                `INSERT INTO cateterismo_terapeutico_consulta 
                (consulta_medica_id, tecnica_cateterismo_terapeutico_id, intervencion_realizada_id, complicaciones_procedimiento_terapeutico, complicaciones_acceso_terapeutico, sugerencia_terapeuticas_id, territorio_angioplastia_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    consulta_medica_id,
                    tecnica_cateterismo_terapeutico_id || null,
                    intervencionJson,
                    compProcedimientoJson, // <-- JSON Stringificado
                    complicaciones_acceso_terapeutico || null, // <-- INT Directo
                    sugerencia_terapeuticas_id || null,
                    territorio_angioplastia_id || null
                ]
            );
            return res.status(201).json({ message: 'Datos generales terapéuticos guardados con éxito' });
        }

    } catch (error) {
        console.error("Error en saveTerapeuticoGeneral:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * OBTENER LOS DATOS GENERALES DEL PADRE POR CONSULTA
 */
const getTerapeuticoGeneralBySolicitud = async (req, res) => {
    // Asegúrate de que en tu router este parámetro se llame :consulta_medica_id
    const { consulta_medica_id } = req.params;

    try {
        const [maestro] = await db.query(
            `SELECT id, consulta_medica_id, tecnica_cateterismo_terapeutico_id, 
                    intervencion_realizada_id, complicaciones_procedimiento_terapeutico, 
                    complicaciones_acceso_terapeutico, sugerencia_terapeuticas_id, territorio_angioplastia_id 
             FROM cateterismo_terapeutico_consulta 
             WHERE consulta_medica_id = ?`,
            [consulta_medica_id]
        );

        if (maestro.length === 0) {
            return res.json({}); // Retorna objeto vacío si no hay datos
        }

        const datosGenerales = maestro[0];

        // Parseamos el JSON de intervenciones para que el frontend lo pueda leer como arreglo
        if (datosGenerales.intervencion_realizada_id) {
            try {
                datosGenerales.intervencion_realizada_id = JSON.parse(datosGenerales.intervencion_realizada_id);
            } catch (e) {
                datosGenerales.intervencion_realizada_id = [];
            }
        } else {
            datosGenerales.intervencion_realizada_id = [];
        }

        // Parseamos el JSON de complicaciones del procedimiento para que el frontend lo pueda leer como arreglo
        if (datosGenerales.complicaciones_procedimiento_terapeutico) {
            try {
                datosGenerales.complicaciones_procedimiento_terapeutico = JSON.parse(datosGenerales.complicaciones_procedimiento_terapeutico);
            } catch (e) {
                datosGenerales.complicaciones_procedimiento_terapeutico = [];
            }
        } else {
            datosGenerales.complicaciones_procedimiento_terapeutico = [];
        }

        res.json(datosGenerales);

    } catch (error) {
        console.error("Error en getTerapeuticoGeneralBySolicitud:", error);
        res.status(500).json({ error: error.message });
    }
};



/**
 * REPORTE: CATETERISMO TERAPÉUTICO (UNE PANTALLA 1 Y 2)
 */
const getReporteTerapeutico = async (req, res) => {
    try {
        const { consulta_medico_id } = req.params;

        if (!consulta_medico_id) {
            return res.status(400).json({
                success: false,
                message: "El parámetro consulta_medico_id es requerido."
            });
        }

        // =========================================================
        // 1. OBTENER DATOS DEL PACIENTE Y MAESTRO TERAPÉUTICO
        // =========================================================
        const [maestroResult] = await db.query(`
            SELECT 
                -- Datos del paciente
                p.cedula, p.primer_nombre, p.primer_apellido, p.sexo, p.fecha_nacimiento,
                -- Datos de la consulta médica
                c.id AS consulta_id, c.fecha_consulta, c.cateterismo,
                cat_mc.nombre AS motivo_consulta,
                -- Datos Generales Terapéuticos (Pantalla 2)
                t.id AS terapeutico_id,
                t.tecnica_cateterismo_terapeutico_id,
                t.intervencion_realizada_id,
                t.complicaciones_procedimiento_terapeutico,
                t.complicaciones_acceso_terapeutico,
                t.sugerencia_terapeuticas_id,
                t.territorio_angioplastia_id,
                t.fecha_creacion
            FROM consultas_medicas c
            LEFT JOIN pacientes p ON c.paciente_id = p.id
            -- El motivo de la consulta sigue viniendo del catálogo general
            LEFT JOIN catalogo_consultas cat_mc ON c.motivo_consulta_id = cat_mc.id
            LEFT JOIN cateterismo_terapeutico_consulta t ON c.id = t.consulta_medica_id
            WHERE c.id = ? 
            LIMIT 1
        `, [consulta_medico_id]);

        let data = maestroResult.length > 0 ? maestroResult[0] : null;

        if (!data) {
            return res.json({ success: false, message: "No se encontró la consulta médica." });
        }

        // =========================================================
        // 2. OBTENER ARTERIAS DEL DETALLE (Pantalla 1)
        // =========================================================
        let arterias = [];
        if (data.terapeutico_id) {
            const [arteriasResult] = await db.query(`
                SELECT * FROM consulta_cateterismo_terapeutico_detalle_arterias 
                WHERE terapeutico_id = ?
            `, [data.terapeutico_id]);
            arterias = arteriasResult;
        }

        // =========================================================
        // 3. RECOLECCIÓN DE TODOS LOS IDs PARA BUSCAR EN CATÁLOGO
        // =========================================================
        let idsToFetch = new Set();

        // Helper para agregar IDs válidos al Set
        const addId = (id) => { if (id && !isNaN(id)) idsToFetch.add(Number(id)); };

        // Helper para parsear JSON y extraer IDs de arreglos
        const parseAndExtractIds = (jsonString) => {
            if (!jsonString) return [];
            try {
                const arr = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
                if (Array.isArray(arr)) {
                    arr.forEach(addId);
                    return arr;
                }
            } catch (e) { return []; }
            return [];
        };

        // Extraer IDs del Maestro (Pantalla 2)
        addId(data.tecnica_cateterismo_terapeutico_id);
        addId(data.complicaciones_acceso_terapeutico);
        addId(data.sugerencia_terapeuticas_id);
        addId(data.territorio_angioplastia_id);
        const intervenciones_arr = parseAndExtractIds(data.intervencion_realizada_id);
        const comp_procedimiento_arr = parseAndExtractIds(data.complicaciones_procedimiento_terapeutico);

        // Extraer IDs de las Arterias (Pantalla 1)
        let arteriasParseadas = arterias.map(art => {
            addId(art.flujo_hemodinamia); // El flujo es un ID
            const tipos_arr = parseAndExtractIds(art.tipo_json_hemodinamia);
            // La técnica viene en texto ('ANGIOPLASTIA SIMPLE', etc.), así que no la buscamos
            return {
                ...art,
                tipos_ids: tipos_arr // Guardamos temporalmente el arreglo de IDs
            };
        });

        // =========================================================
        // 4. CONSULTAR CATÁLOGO (HEMODINAMIA) Y ARMAR DICCIONARIO
        // =========================================================
        let catalogosMap = {};
        if (idsToFetch.size > 0) {
            // CAMBIO: Ahora consultamos directamente a catalogo_hemodinamia
            const [catalogosResult] = await db.query(`
                SELECT id, nombre 
                FROM catalogo_hemodinamia 
                WHERE id IN (?)
            `, [[...idsToFetch]]);

            catalogosResult.forEach(item => {
                catalogosMap[item.id] = item.nombre;
            });
        }

        // =========================================================
        // 5. MAPEAR NOMBRES FINALES AL OBJETO DE RESPUESTA
        // =========================================================

        // Mapeo Datos Generales
        data.tecnica_cateterismo = catalogosMap[data.tecnica_cateterismo_terapeutico_id] || null;
        data.complicaciones_acceso = catalogosMap[data.complicaciones_acceso_terapeutico] || null;
        data.sugerencia_terapeutica = catalogosMap[data.sugerencia_terapeuticas_id] || null;
        data.territorio_angioplastia = catalogosMap[data.territorio_angioplastia_id] || null;

        data.intervenciones_realizadas = intervenciones_arr.map(id => catalogosMap[id] || id);
        data.complicaciones_procedimiento = comp_procedimiento_arr.map(id => catalogosMap[id] || id);

        // Mapeo Datos de las Arterias
        data.arterias = arteriasParseadas.map(art => ({
            arteria_nombre: art.arteria_nombre,
            lesion_residual: art.lesion_residual_hemodinamia,
            flujo: catalogosMap[art.flujo_hemodinamia] || art.flujo_hemodinamia, // Reemplaza ID por nombre
            tecnica: art.tecnica_hemodinamia, // Viene en string desde el front
            medina: art.medina_hemodinamia,
            tipos_lesion: art.tipos_ids.map(id => catalogosMap[id] || id) // Array de nombres de lesión
        }));

        // Limpiamos la basura JSON cruda de la respuesta
        delete data.tecnica_cateterismo_terapeutico_id;
        delete data.intervencion_realizada_id;
        delete data.complicaciones_procedimiento_terapeutico;
        delete data.complicaciones_acceso_terapeutico;
        delete data.sugerencia_terapeuticas_id;
        delete data.territorio_angioplastia_id;

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error("Error en getReporteTerapeutico:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};




module.exports = {
    saveTerapeutico,
    getTerapeuticoBySolicitud,
    saveTerapeuticoGeneral,
    getTerapeuticoGeneralBySolicitud,
    getReporteTerapeutico
};