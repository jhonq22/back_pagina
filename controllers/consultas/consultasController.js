const db = require('../../config/db');

// =====================================================================
// CRUD: CONSULTAS MÉDICAS (MAESTRO)
// =====================================================================

const saveConsultaMedica = async (req, res) => {
    const {
        id, // Si viene null o vacío, hace INSERT. Si trae valor, hace UPDATE.
        paciente_id,
        motivo_consulta_id,
        fecha_consulta
    } = req.body;

    if (!paciente_id) {
        return res.status(400).json({ message: "El paciente_id es obligatorio" });
    }

    try {
        if (id) {
            // UPDATE
            await db.query(
                `UPDATE consultas_medicas SET 
                    paciente_id = ?, 
                    motivo_consulta_id = ?, 
                    fecha_consulta = ?, 
                    fecha_modificacion = CURRENT_TIMESTAMP, 
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [paciente_id, motivo_consulta_id || null, fecha_consulta || null, id]
            );
            return res.status(200).json({ message: 'Consulta médica actualizada con éxito', id });
        } else {
            // INSERT
            const [result] = await db.query(
                `INSERT INTO consultas_medicas 
                (paciente_id, motivo_consulta_id, fecha_consulta, estatus, fecha_creacion) 
                VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)`, 
                [paciente_id, motivo_consulta_id || null, fecha_consulta || null]
            );
            return res.status(200).json({ message: 'Consulta médica creada con éxito', id: result.insertId });
        }
    } catch (error) {
        console.error("Error en saveConsultaMedica:", error);
        res.status(500).json({ error: error.message });
    }
};

const getConsultaMedicaById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM consultas_medicas WHERE id = ?', [id]);
        if (rows.length === 0) return res.json(null);
        res.json(rows[0]);
    } catch (error) {
        console.error("Error en getConsultaMedicaById:", error);
        res.status(500).json({ error: error.message });
    }
};


// =====================================================================
// CRUD: TEST SEATLE PRIMERA ETAPA
// =====================================================================

const savePrimeraEtapa = async (req, res) => {
    const {
        id, // Si viene null o vacío, hace INSERT. Si trae valor, hace UPDATE.
        consultas_medica_id,
        limitacion_fisica,
        caminar_paso_ligero_id,
        caminar_por_casa_id,
        bañarse_vestirse_id,
        frecuencia_angina_pregunta_uno_id,
        frecuencia_angina_pregunta_dos_id,
        percepcion_calidad_pregunta_uno_id,
        percepcion_calidad_pregunta_dos_id,
        valores_respuesta_id,
        puntuacion_valderrama // <-- NUEVO CAMPO AGREGADO AQUÍ
    } = req.body;

    if (!consultas_medica_id) {
        return res.status(400).json({ message: "El consultas_medica_id es obligatorio" });
    }

    try {
        if (id) {
            // UPDATE
            await db.query(
                `UPDATE test_seatle_primera_etapa_consulta SET 
                    limitacion_fisica = ?, caminar_paso_ligero_id = ?, caminar_por_casa_id = ?, bañarse_vestirse_id = ?,
                    frecuencia_angina_pregunta_uno_id = ?, frecuencia_angina_pregunta_dos_id = ?, percepcion_calidad_pregunta_uno_id = ?, 
                    percepcion_calidad_pregunta_dos_id = ?, valores_respuesta_id = ?, puntuacion_valderrama = ?, 
                    fecha_modificacion = CURRENT_TIMESTAMP, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [
                    limitacion_fisica || null, caminar_paso_ligero_id || null, caminar_por_casa_id || null, bañarse_vestirse_id || null,
                    frecuencia_angina_pregunta_uno_id || null, frecuencia_angina_pregunta_dos_id || null, percepcion_calidad_pregunta_uno_id || null, 
                    percepcion_calidad_pregunta_dos_id || null, valores_respuesta_id || null, puntuacion_valderrama || null, id
                ]
            );
            return res.status(200).json({ message: 'Primera etapa actualizada con éxito', id });
        } else {
            // INSERT
            const [result] = await db.query(
                `INSERT INTO test_seatle_primera_etapa_consulta 
                (consultas_medica_id, limitacion_fisica, caminar_paso_ligero_id, caminar_por_casa_id, bañarse_vestirse_id, frecuencia_angina_pregunta_uno_id, frecuencia_angina_pregunta_dos_id, percepcion_calidad_pregunta_uno_id, percepcion_calidad_pregunta_dos_id, valores_respuesta_id, puntuacion_valderrama, estatus, fecha_creacion) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
                [
                    consultas_medica_id, limitacion_fisica || null, caminar_paso_ligero_id || null, caminar_por_casa_id || null, bañarse_vestirse_id || null,
                    frecuencia_angina_pregunta_uno_id || null, frecuencia_angina_pregunta_dos_id || null, percepcion_calidad_pregunta_uno_id || null, 
                    percepcion_calidad_pregunta_dos_id || null, valores_respuesta_id || null, puntuacion_valderrama || null
                ]
            );
            return res.status(200).json({ message: 'Primera etapa creada con éxito', id: result.insertId });
        }
    } catch (error) {
        console.error("Error en savePrimeraEtapa:", error);
        res.status(500).json({ error: error.message });
    }
};

const getPrimeraEtapaByConsultaId = async (req, res) => {
    const { consultaId } = req.params; // Se busca usando el ID del maestro
    try {
        const [rows] = await db.query('SELECT * FROM test_seatle_primera_etapa_consulta WHERE consultas_medica_id = ?', [consultaId]);
        if (rows.length === 0) return res.json(null);
        res.json(rows[0]);
    } catch (error) {
        console.error("Error en getPrimeraEtapaByConsultaId:", error);
        res.status(500).json({ error: error.message });
    }
};


// =====================================================================
// CRUD: TEST SEATLE SEGUNDA ETAPA
// =====================================================================

const saveSegundaEtapa = async (req, res) => {
    const {
        id, // Si viene null o vacío, hace INSERT. Si trae valor, hace UPDATE.
        consultas_medica_id,
        revision_aceso_id,
        evolucion_post_procedimiento,
        tratamientos_id, // Se recibe como array para ser JSON
        sugerencia_consulta_id, // Se recibe como array para ser JSON
        puntuacion_valderrama // <-- NUEVO CAMPO AGREGADO
    } = req.body;

    if (!consultas_medica_id) {
        return res.status(400).json({ message: "El consultas_medica_id es obligatorio" });
    }

    try {
        const tratamientosJson = tratamientos_id ? JSON.stringify(tratamientos_id) : null;
        const sugerenciaJson = sugerencia_consulta_id ? JSON.stringify(sugerencia_consulta_id) : null;

        if (id) {
            // UPDATE
            await db.query(
                `UPDATE test_seatle_segunda_etapa_consulta SET 
                    revision_aceso_id = ?, 
                    evolucion_post_procedimiento = ?, 
                    tratamientos_id = ?, 
                    sugerencia_consulta_id = ?, 
                    puntuacion_valderrama = ?, 
                    fecha_modificacion = CURRENT_TIMESTAMP, 
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [
                    revision_aceso_id || null, 
                    evolucion_post_procedimiento || null, 
                    tratamientosJson, 
                    sugerenciaJson, 
                    puntuacion_valderrama || null, // <-- Pasamos el valor al UPDATE
                    id
                ]
            );
            return res.status(200).json({ message: 'Segunda etapa actualizada con éxito', id });
        } else {
            // INSERT
            const [result] = await db.query(
                `INSERT INTO test_seatle_segunda_etapa_consulta 
                (consultas_medica_id, revision_aceso_id, evolucion_post_procedimiento, tratamientos_id, sugerencia_consulta_id, puntuacion_valderrama, estatus, fecha_creacion) 
                VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`, // <-- Agregamos un '?' extra
                [
                    consultas_medica_id, 
                    revision_aceso_id || null, 
                    evolucion_post_procedimiento || null, 
                    tratamientosJson, 
                    sugerenciaJson, 
                    puntuacion_valderrama || null // <-- Pasamos el valor al INSERT
                ]
            );
            return res.status(200).json({ message: 'Segunda etapa creada con éxito', id: result.insertId });
        }
    } catch (error) {
        console.error("Error en saveSegundaEtapa:", error);
        res.status(500).json({ error: error.message });
    }
};

const getSegundaEtapaByConsultaId = async (req, res) => {
    const { consultaId } = req.params; // Se busca usando el ID del maestro
    try {
        const [rows] = await db.query('SELECT * FROM test_seatle_segunda_etapa_consulta WHERE consultas_medica_id = ?', [consultaId]);
        
        if (rows.length === 0) return res.json(null);
        
        const etapa = rows[0];

        // Parseamos los JSON para que el frontend reciba arrays directamente
        if (typeof etapa.tratamientos_id === 'string') {
            etapa.tratamientos_id = JSON.parse(etapa.tratamientos_id);
        }
        if (typeof etapa.sugerencia_consulta_id === 'string') {
            etapa.sugerencia_consulta_id = JSON.parse(etapa.sugerencia_consulta_id);
        }

        res.json(etapa);
    } catch (error) {
        console.error("Error en getSegundaEtapaByConsultaId:", error);
        res.status(500).json({ error: error.message });
    }
};

// Buscar paciente por cédula y obtener su última solicitud
const buscarCedulaConsultas = async (req, res) => {
    const { cedula } = req.params;

    if (!cedula) {
        return res.status(400).json({ message: "La cédula es requerida" });
    }

    try {
        // 1. Buscar los datos del paciente en la tabla 'pacientes'
        const [pacienteRows] = await db.query(
            `SELECT id, cedula, primer_nombre, primer_apellido, sexo, fecha_nacimiento 
             FROM pacientes 
             WHERE cedula = ?`,
            [cedula]
        );

        // Si no existe el paciente, retornamos un 404
        if (pacienteRows.length === 0) {
            return res.status(404).json({ message: "No se encontró ningún paciente con esa cédula." });
        }

        const paciente = pacienteRows[0];

        // 2. Buscar la ÚLTIMA solicitud en 'registrar_solicitud_pacientes'
        const [solicitudRows] = await db.query(
            `SELECT tipo_operacion_id, marcapaso, fecha_cita, fecha_operacion 
             FROM registrar_solicitud_pacientes 
             WHERE paciente_id = ? 
             ORDER BY id DESC 
             LIMIT 1`,
            [paciente.id]
        );

        const ultimaSolicitud = solicitudRows.length > 0 ? solicitudRows[0] : null;

        // 3. Juntar toda la información en un solo objeto para el Frontend
        const respuestaUnificada = {
            paciente_id: paciente.id,
            cedula: paciente.cedula,
            primer_nombre: paciente.primer_nombre,
            primer_apellido: paciente.primer_apellido,
            sexo: paciente.sexo,
            fecha_nacimiento: paciente.fecha_nacimiento,
            
            // Si tiene solicitud previa llenamos los datos, si no, se van en null
            tipo_operacion_id: ultimaSolicitud ? ultimaSolicitud.tipo_operacion_id : null,
            marcapaso: ultimaSolicitud ? ultimaSolicitud.marcapaso : null,
            fecha_cita: ultimaSolicitud ? ultimaSolicitud.fecha_cita : null,
            fecha_operacion: ultimaSolicitud ? ultimaSolicitud.fecha_operacion : null
        };

        return res.status(200).json(respuestaUnificada);

    } catch (error) {
        console.error("Error en buscarCedulaConsultas:", error);
        res.status(500).json({ error: error.message });
    }
};

const lista_por_tipo = async (req, res) => {
    const { tipo } = req.params;

    if (!tipo) {
        return res.status(400).json({ message: "El tipo de catálogo es requerido" });
    }

    try {
        const [rows] = await db.query(
            `SELECT 
                nombre AS label, 
                id AS value,
                puntaje 
             FROM catalogo_consultas 
             WHERE tipo = ? AND estatus = 1
             ORDER BY nombre ASC`,
            [tipo]
        );

        res.json(rows);
    } catch (error) {
        console.error("Error en lista_por_tipo (hemodinamia):", error);
        res.status(500).json({ error: error.message });
    }
};


const getConsultasConEtapas = async (req, res) => {
    try {
        // 1. Extraemos las fechas de la URL (query parameters)
        const { fecha_inicio, fecha_fin } = req.query;

        // 2. Armamos la consulta base con WHERE 1=1 para concatenar dinámicamente
        let query = `
            SELECT 
                cm.id AS consulta_medica_id,
                cm.paciente_id,
                cm.fecha_consulta,
                cm.estatus,
                t.nombre AS motivo_consulta, 
                
                -- NUEVO: Datos del paciente
                p.cedula,
                p.es_cedulado,
                p.primer_nombre,
                p.segundo_nombre,
                p.primer_apellido,
                p.segundo_apellido,
                p.sexo,
                p.fecha_nacimiento,
                -- CONCAT_WS une los textos con un espacio, ignorando los nulos automáticamente
                CONCAT_WS(' ', NULLIF(p.primer_nombre, ''), NULLIF(p.segundo_nombre, ''), NULLIF(p.primer_apellido, ''), NULLIF(p.segundo_apellido, '')) AS paciente_nombre_completo,
                
                -- Evaluamos en qué etapa está
                CASE 
                    WHEN se.id IS NOT NULL THEN 'Segunda Etapa'
                    WHEN pe.id IS NOT NULL THEN 'Primera Etapa'
                    ELSE 'Solo Registro'
                END AS etapa_actual,

                pe.id AS primera_etapa_id,
                se.id AS segunda_etapa_id
                
            FROM consultas_medicas cm
            
            LEFT JOIN catalogo_consultas t ON cm.motivo_consulta_id = t.id 
            
            -- NUEVO: Hacemos JOIN con la tabla pacientes
            LEFT JOIN pacientes p ON cm.paciente_id = p.id
            
            LEFT JOIN test_seatle_primera_etapa_consulta pe ON cm.id = pe.consultas_medica_id
            LEFT JOIN test_seatle_segunda_etapa_consulta se ON cm.id = se.consultas_medica_id
            WHERE 1=1
        `;

        const queryParams = [];

        // 3. Agregamos los filtros de fecha si existen
        if (fecha_inicio) {
            query += ` AND DATE(cm.fecha_consulta) >= ?`;
            queryParams.push(fecha_inicio);
        }

        if (fecha_fin) {
            query += ` AND DATE(cm.fecha_consulta) <= ?`;
            queryParams.push(fecha_fin);
        }

        // 4. Agregamos el ordenamiento final
        query += ` ORDER BY cm.fecha_creacion DESC`;

        // 5. Ejecutamos el query pasándole el arreglo de parámetros
        const [rows] = await db.query(query, queryParams);

        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener la lista de consultas:", error);
        return res.status(500).json({ error: error.message });
    }
};


// =====================================================================
// EXPORTAR MÓDULOS
// =====================================================================
module.exports = { 
    saveConsultaMedica, getConsultaMedicaById,
    savePrimeraEtapa, getPrimeraEtapaByConsultaId,
    saveSegundaEtapa, getSegundaEtapaByConsultaId,
    buscarCedulaConsultas, lista_por_tipo, getConsultasConEtapas

 
};