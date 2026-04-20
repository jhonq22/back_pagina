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

module.exports = {
    saveTerapeutico,
    getTerapeuticoBySolicitud,
    saveTerapeuticoGeneral,
    getTerapeuticoGeneralBySolicitud
};