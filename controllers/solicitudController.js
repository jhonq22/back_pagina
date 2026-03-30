const db = require('../config/db');

const createSolicitud = async (req, res) => {
    const {
        paciente_id, centro_salud_id, posee_cedula_identidad, archivo_cedula_id,
        observacion_cedula, posee_informe_medico, archivo_informe_medico_id,
        observacion_informe_medico, tipo_operacion_id, tipo_marca_paso_id, marcapaso
    } = req.body;

    try {
        const sql = `INSERT INTO registrar_solicitud_pacientes 
            (paciente_id, centro_salud_id, posee_cedula_identidad, archivo_cedula_id, observacion_cedula, 
            posee_informe_medico, archivo_informe_medico_id, observacion_informe_medico, tipo_operacion_id, tipo_marca_paso_id, marcapaso) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await db.query(sql, [
            paciente_id, centro_salud_id, posee_cedula_identidad, archivo_cedula_id,
            observacion_cedula, posee_informe_medico, archivo_informe_medico_id,
            observacion_informe_medico, tipo_operacion_id, tipo_marca_paso_id, marcapaso
        ]);

        res.status(201).json({ message: 'Solicitud creada', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSolicitudes = async (req, res) => {
    try {
        // Al usar SELECT *, ya incluye tipo_marca_paso_id automáticamente
        const [rows] = await db.query('SELECT * FROM registrar_solicitud_pacientes');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- API PARA EL PACIENTE: Obtener su solicitud actual ---
const getSolicitudByPacienteId = async (req, res) => {
    const { paciente_id } = req.params;
    try {
        const sql = `
            SELECT 
                s.*, 
                p.primer_nombre, p.primer_apellido, p.cedula, p.correo, p.telefono_celular,
                s.tipo_marca_paso_id,
                es.nombre_estatus AS estatus_nombre,
                DATE_FORMAT(s.fecha_creacion, '%e de %M de %Y') AS fecha_formateada
            FROM registrar_solicitud_pacientes s
            INNER JOIN pacientes p ON s.paciente_id = p.id
            LEFT JOIN estatus_solicitudes es ON s.estatus_solicitud_id = es.id
            WHERE s.paciente_id = ?
            ORDER BY s.fecha_creacion DESC LIMIT 1`;

        const [rows] = await db.query(sql, [paciente_id]);
        if (rows.length === 0) return res.status(404).json({ message: 'No se encontró solicitud para este paciente ID' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getSolicitudById = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT 
                s.*, 
                p.primer_nombre, p.primer_apellido, p.cedula, p.correo, p.telefono_celular,
                s.tipo_operacion_id,
                s.tipo_marca_paso_id,
                es.nombre_estatus AS estatus_nombre,
                DATE_FORMAT(s.fecha_creacion, '%e de %M de %Y') AS fecha_formateada
            FROM registrar_solicitud_pacientes s
            INNER JOIN pacientes p ON s.paciente_id = p.id
            LEFT JOIN estatus_solicitudes es ON s.estatus_solicitud_id = es.id
            WHERE s.id = ?`;

        const [rows] = await db.query(sql, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'No se encontró solicitud para este paciente Solicitu id' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// --- NUEVA API: Obtener todas las solicitudes con estatus 1
const getSolicitudesPendientesAreaAdministrativa = async (req, res) => {
    try {
        // Establecer el idioma de la sesión a español
        await db.query("SET lc_time_names = 'es_ES'");

        const sql = `
            SELECT 
                s.*, 
                p.primer_nombre, p.primer_apellido, p.cedula, p.correo, p.telefono_celular,
                s.tipo_marca_paso_id,
                es.nombre_estatus AS estatus_nombre,
                DATE_FORMAT(s.fecha_cita, '%e de %M de %Y') AS fecha_solicitud
            FROM registrar_solicitud_pacientes s
            INNER JOIN pacientes p ON s.paciente_id = p.id
            LEFT JOIN estatus_solicitudes es ON s.estatus_solicitud_id = es.id
            WHERE s.estatus_solicitud_id IN (1)
            ORDER BY s.fecha_creacion DESC`;

        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// solicitudes pendientes por centro salud
const getSolicitudesPendientesPorCentro = async (req, res) => {
    try {
        // 1. Obtenemos el ID del centro de los params y las fechas del query
        const { centro_salud_id } = req.params;
        const { fechaInicio, fechaFin } = req.query;

        if (!centro_salud_id) {
            return res.status(400).json({ error: "El ID del centro de salud es requerido." });
        }

        // Establecer el idioma de la sesión
        await db.query("SET lc_time_names = 'es_ES'");

        // 2. Base de la consulta
        let sql = `
            SELECT 
                s.*, 
                p.primer_nombre, p.primer_apellido, p.cedula, p.correo, p.telefono_celular, p.codificacion_buen_gobierno,
                s.tipo_marca_paso_id, s.observacion_general,
                es.nombre_estatus AS estatus_nombre,
                DATE_FORMAT(s.fecha_cita, '%e de %M de %Y') AS fecha_solicitud
            FROM registrar_solicitud_pacientes s
            INNER JOIN pacientes p ON s.paciente_id = p.id
            LEFT JOIN estatus_solicitudes es ON s.estatus_solicitud_id = es.id
            WHERE s.estatus_solicitud_id IN (1) 
              AND s.centro_salud_id = ?
        `;

        // El primer parámetro siempre será el ID del centro
        const params = [centro_salud_id];

        // 3. Agregar filtro de fechas si ambas están presentes
        if (fechaInicio && fechaFin) {
            sql += ` AND DATE(s.fecha_cita) BETWEEN ? AND ?`;
            params.push(fechaInicio, fechaFin);
        }

        // 4. Ordenamiento final
        sql += ` ORDER BY s.fecha_creacion DESC`;

        // 5. Ejecutar con el array de parámetros construido
        const [rows] = await db.query(sql, params);

        res.json(rows);
    } catch (error) {
        console.error("Error al obtener solicitudes por centro:", error);
        res.status(500).json({ error: error.message });
    }
};







// estatus solicitud dinamicos
const getSolicitudesEstatusDinamico = async (req, res) => {
    try {
        // 1. Obtenemos el id del estatus desde req.params y las fechas desde req.query
        const { id } = req.params;
        const { fechaInicio, fechaFin } = req.query;

        if (!id) {
            return res.status(400).json({ error: "El ID de estatus es obligatorio." });
        }

        // 2. Establecemos el idioma de la sesión a español
        await db.query("SET lc_time_names = 'es_ES'");

        // 3. Base de la consulta SQL
        let sql = `
            SELECT 
                s.*, 
                p.primer_nombre, p.primer_apellido, p.cedula, p.correo, p.telefono_celular, p.codificacion_buen_gobierno,
                s.tipo_marca_paso_id,
                es.nombre_estatus AS estatus_nombre,
                rm.primerNombre AS medico_nombre,
                rm.primerApellido AS medico_apellido,
                DATE_FORMAT(s.fecha_operacion, '%e de %M de %Y') AS fecha_operacion,
                DATE_FORMAT(s.fecha_cita, '%e de %M de %Y') AS fecha_solicitud
            FROM registrar_solicitud_pacientes s
            INNER JOIN pacientes p ON s.paciente_id = p.id
            LEFT JOIN estatus_solicitudes es ON s.estatus_solicitud_id = es.id
            LEFT JOIN registro_medicos rm ON s.medico_id = rm.id
            WHERE s.estatus_solicitud_id = ?
        `;

        // Iniciamos el arreglo de parámetros con el ID del estatus
        const params = [id];

        // 4. Agregamos el filtro de fechas dinámicamente si vienen ambos campos
        if (fechaInicio && fechaFin) {
            sql += ` AND DATE(s.fecha_operacion) BETWEEN ? AND ?`;
            params.push(fechaInicio, fechaFin);
        }

        // 5. Agregamos el ordenamiento al final
        sql += ` ORDER BY s.fecha_cita ASC`;

        // 6. Ejecutamos la consulta pasándole el arreglo de parámetros
        const [rows] = await db.query(sql, params);

        res.json(rows);
    } catch (error) {
        console.error("Error en getSolicitudesEstatusDinamico:", error);
        res.status(500).json({ error: error.message });
    }
};



// --- NUEVA API: Obtener todas las solicitudes con estatus 6 y 5 ---
const getSolicitudesPendientesAreaMedica = async (req, res) => {
    try {
        // 1. Extraemos los parámetros de fecha de la URL (query string)
        const { fechaInicio, fechaFin } = req.query;

        // 2. Establecemos el idioma de la sesión a español
        await db.query("SET lc_time_names = 'es_ES'");

        // 3. Base de la consulta SQL (usamos let para poder modificarla)
        let sql = `
            SELECT 
                s.*, 
                p.primer_nombre, p.primer_apellido, p.cedula, p.correo, p.telefono_celular,
                s.tipo_marca_paso_id,
                es.nombre_estatus AS estatus_nombre,
                DATE_FORMAT(s.fecha_cita, '%e de %M de %Y') AS fecha_solicitud
            FROM registrar_solicitud_pacientes s
            INNER JOIN pacientes p ON s.paciente_id = p.id
            LEFT JOIN estatus_solicitudes es ON s.estatus_solicitud_id = es.id
            WHERE s.estatus_solicitud_id IN (6, 5)
        `;

        const params = [];

        // 4. Agregamos el filtro de fecha_cita dinámicamente
        if (fechaInicio && fechaFin) {
            sql += ` AND DATE(s.fecha_cita) BETWEEN ? AND ?`;
            params.push(fechaInicio, fechaFin);
        }

        // 5. Agregamos el ordenamiento al final
        sql += ` ORDER BY s.fecha_cita ASC`;

        // 6. Ejecutamos la consulta con sus parámetros
        const [rows] = await db.query(sql, params);

        res.json(rows);
    } catch (error) {
        console.error("Error en getSolicitudesPendientesAreaMedica:", error);
        res.status(500).json({ error: error.message });
    }
};




const getSolicitudesPendientesAreaMedicaOperados = async (req, res) => {
    try {
        // 1. Extraemos los parámetros de fecha de la URL (query string)
        const { fechaInicio, fechaFin } = req.query;

        // 2. Establecemos el idioma de la sesión a español
        await db.query("SET lc_time_names = 'es_ES'");

        // 3. Base de la consulta SQL (usamos let para poder modificarla)
        let sql = `
            SELECT 
                s.*, 
                p.primer_nombre, p.primer_apellido, p.cedula, p.correo, p.telefono_celular,
                s.tipo_marca_paso_id,
                es.nombre_estatus AS estatus_nombre,
                DATE_FORMAT(s.fecha_cita, '%e de %M de %Y') AS fecha_solicitud
            FROM registrar_solicitud_pacientes s
            INNER JOIN pacientes p ON s.paciente_id = p.id
            LEFT JOIN estatus_solicitudes es ON s.estatus_solicitud_id = es.id
            WHERE s.estatus_solicitud_id IN (3)
        `;

        const params = [];

        // 4. Agregamos el filtro de fecha_cita dinámicamente
        if (fechaInicio && fechaFin) {
            sql += ` AND DATE(s.fecha_cita) BETWEEN ? AND ?`;
            params.push(fechaInicio, fechaFin);
        }

        // 5. Agregamos el ordenamiento al final
        sql += ` ORDER BY s.fecha_cita ASC`;

        // 6. Ejecutamos la consulta con sus parámetros
        const [rows] = await db.query(sql, params);

        res.json(rows);
    } catch (error) {
        console.error("Error en getSolicitudesPendientesAreaMedica:", error);
        res.status(500).json({ error: error.message });
    }
};

















// --- API ADMINISTRATIVA: Solo 1 solicitud ---
const getSolicitudesAdministrativas = async (req, res) => {
    // 1. Obtenemos el ID del parámetro de la ruta
    const { id } = req.params;

    try {
        const sql = `
            SELECT 
                s.*, 
                p.primer_nombre, p.primer_apellido, p.cedula, p.edad, p.fecha_nacimiento, p.correo, p.telefono_celular,
                s.tipo_marca_paso_id,
                DATE_FORMAT(s.fecha_creacion, '%e de %M de %Y') AS fecha_solicitud
            FROM registrar_solicitud_pacientes s
            INNER JOIN pacientes p ON s.paciente_id = p.id
            WHERE s.estatus_solicitud_id IN (1, 4) 
            AND s.id = ?`; // 2. Filtramos por estatus 2 y el ID específico

        // 3. Pasamos el [id] como segundo argumento para reemplazar el '?'
        const [rows] = await db.query(sql, [id]);

        // Opcional: Si buscas por ID, usualmente quieres el objeto directo, no un array.
        // Si prefieres devolver el objeto directo usa: res.json(rows[0]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- API MÉDICA: Solo 1 solicitud ---
const getSolicitudesMedicas = async (req, res) => {
    try {
        const sql = `
            SELECT 
                s.*, 
                p.primer_nombre, p.primer_apellido, p.cedula, p.correo, p.telefono_celular,
                s.tipo_marca_paso_id,
                DATE_FORMAT(s.fecha_creacion, '%e de %M de %Y') AS fecha_solicitud
            FROM registrar_solicitud_pacientes s
            INNER JOIN pacientes p ON s.paciente_id = p.id
            WHERE s.estatus_solicitud_id = 2
            ORDER BY s.fecha_creacion DESC LIMIT 1`;

        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateEstatusFase = async (req, res) => {
    const { id } = req.params;
    const { estatus_solicitud_id } = req.body;
    try {
        await db.query('UPDATE registrar_solicitud_pacientes SET estatus_solicitud_id = ? WHERE id = ?', [estatus_solicitud_id, id]);
        res.json({ message: 'Estatus de solicitud actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateDatosMedicos = async (req, res) => {
    const { id } = req.params;
    const { tipo_operacion_id, tipo_marca_paso_id, marcapaso, centro_salud_id } = req.body;
    try {
        await db.query(
            'UPDATE registrar_solicitud_pacientes SET tipo_operacion_id = ?, tipo_marca_paso_id = ?, marcapaso = ?, centro_salud_id = ? WHERE id = ?',
            [tipo_operacion_id, tipo_marca_paso_id, marcapaso, centro_salud_id, id]
        );
        res.json({ message: 'Datos médicos de la solicitud actualizados' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateVerificacionDocumento = async (req, res) => {
    const { id } = req.params;
    const { tipo_documento, aprobado, observacion } = req.body;

    let campoPosee = '';
    let campoObservacion = '';

    if (tipo_documento === 'CEDULA') {
        campoPosee = 'posee_cedula_identidad';
        campoObservacion = 'observacion_cedula';
    } else if (tipo_documento === 'INFORME') {
        campoPosee = 'posee_informe_medico';
        campoObservacion = 'observacion_informe_medico';
    } else {
        return res.status(400).json({ error: 'Tipo de documento inválido.' });
    }

    if (!aprobado && (!observacion || observacion.trim() === '')) {
        return res.status(400).json({ error: 'La observación es obligatoria al rechazar.' });
    }

    try {
        const valorPosee = aprobado ? 1 : 0;
        const valorObservacion = aprobado ? null : observacion;
        const sql = `UPDATE registrar_solicitud_pacientes SET ${campoPosee} = ?, ${campoObservacion} = ? WHERE id = ?`;
        await db.query(sql, [valorPosee, valorObservacion, id]);
        res.json({ message: 'Verificación actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteSolicitud = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM registrar_solicitud_pacientes WHERE id = ?', [id]);
        res.json({ message: 'Solicitud eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sumarDias = (fecha, dias) => {
    const res = new Date(fecha);
    res.setDate(res.getDate() + dias);
    return res;
};

const fechaSQL = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// --- FINALIZAR PROCESO ADMINISTRATIVO ---
const finalizarVerificacion = async (req, res) => {
    const { id } = req.params; // ID de la solicitud

    // Extraemos los posibles campos del body
    const {
        tipo_operacion_id,
        estatus_solicitud_id,
        observacion_general,
        fecha_operacion,
        medico_id
    } = req.body;

    // 1. Construcción dinámica de campos a actualizar
    const camposActualizar = [];
    const valores = [];

    if (tipo_operacion_id !== undefined) { camposActualizar.push('tipo_operacion_id = ?'); valores.push(tipo_operacion_id); }
    if (estatus_solicitud_id !== undefined) { camposActualizar.push('estatus_solicitud_id = ?'); valores.push(estatus_solicitud_id); }
    if (observacion_general !== undefined) { camposActualizar.push('observacion_general = ?'); valores.push(observacion_general); }
    if (fecha_operacion !== undefined) { camposActualizar.push('fecha_operacion = ?'); valores.push(fecha_operacion); }
    if (medico_id !== undefined) { camposActualizar.push('medico_id = ?'); valores.push(medico_id); }

    // Si no enviaron absolutamente nada para actualizar, devolvemos error
    if (camposActualizar.length === 0) {
        return res.status(400).json({
            error: 'Debes enviar al menos un campo válido para actualizar.'
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 2. Verificamos que la solicitud exista
        const [solicitud] = await connection.query(
            'SELECT id, paciente_id, centro_salud_id FROM registrar_solicitud_pacientes WHERE id = ?',
            [id]
        );

        if (solicitud.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        let nuevaFechaCita = null;
        const centro_salud_id = solicitud[0].centro_salud_id;

        // 3. Lógica de Re-agendar (SOLO si se envió estatus_solicitud_id y es 100)
        if (estatus_solicitud_id !== undefined && parseInt(estatus_solicitud_id) === 100) {
            const [config] = await connection.query(
                'SELECT * FROM configuracion_dias WHERE centro_salud_id = ?',
                [centro_salud_id]
            );

            const cuposPorDia = {};
            config.forEach(c => cuposPorDia[c.dia_semana] = c.cupos_maximos);

            let fechaCursor = sumarDias(new Date(), 1);
            let asignado = false;
            let intentos = 0;

            while (!asignado && intentos < 365) {
                let diaSemanaJS = fechaCursor.getDay();
                let diaSemanaDB = (diaSemanaJS === 0) ? 7 : diaSemanaJS;

                const fechaStr = fechaSQL(fechaCursor);
                const limite = cuposPorDia[diaSemanaDB] || 0;

                if (limite === 0) {
                    fechaCursor = sumarDias(fechaCursor, 1);
                    intentos++;
                    continue;
                }

                const [[oficiales], [temporales]] = await Promise.all([
                    connection.query(
                        'SELECT COUNT(*) as total FROM registrar_solicitud_pacientes WHERE fecha_cita = ? AND centro_salud_id = ? AND estatus_solicitud_id != 10',
                        [fechaStr, centro_salud_id]
                    ),
                    connection.query(
                        'SELECT COUNT(*) as total FROM pacientes_cita_temporal WHERE fecha_cita_asignada = ? AND estatus = "en_espera"',
                        [fechaStr]
                    )
                ]);

                const totalOcupado = (oficiales[0]?.total || 0) + (temporales[0]?.total || 0);

                if (totalOcupado < limite) {
                    nuevaFechaCita = fechaStr;
                    asignado = true;
                } else {
                    fechaCursor = sumarDias(fechaCursor, 1);
                }
                intentos++;
            }

            if (!nuevaFechaCita) {
                await connection.rollback();
                return res.status(400).json({ error: 'No se encontró disponibilidad para re-agendar.' });
            }

            // Si logramos reagendar, agregamos fecha_cita a nuestra actualización dinámica
            camposActualizar.push('fecha_cita = ?');
            valores.push(nuevaFechaCita);
        }

        // 4. Ejecutar el UPDATE dinámico
        const queryUpdate = `UPDATE registrar_solicitud_pacientes SET ${camposActualizar.join(', ')} WHERE id = ?`;
        valores.push(id); // Añadimos el ID al final del arreglo de valores para el WHERE

        await connection.query(queryUpdate, valores);
        await connection.commit();

        res.json({
            message: nuevaFechaCita
                ? `Cita re-agendada con éxito para el día ${nuevaFechaCita}`
                : 'Actualización finalizada con éxito',
            estatus_actualizado: estatus_solicitud_id !== undefined ? estatus_solicitud_id : 'No modificado',
            nueva_fecha: nuevaFechaCita || null
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error en finalizarVerificacion:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


const asignarHospital = async (req, res) => {
    const { id } = req.params;
    const { centro_salud_id, tipo_operacion_id } = req.body;

    try {
        const sql = `
            UPDATE registrar_solicitud_pacientes 
            SET 
                centro_salud_id = ?, 
                tipo_operacion_id = ?,
                estatus_solicitud_id = 5 
            WHERE id = ?`;

        const [result] = await db.query(sql, [centro_salud_id, tipo_operacion_id, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Solicitud no encontrada" });
        }

        res.json({ message: "Hospital asignado y estatus actualizado a 5" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const updateTipoOperacionYMarcaPaso = async (req, res) => {
    const { id } = req.params;
    const { tipo_marca_paso_id, tipo_operacion_id } = req.body;

    try {
        let campos = [];
        let valores = [];

        if (tipo_marca_paso_id !== undefined && tipo_marca_paso_id !== null) {
            campos.push("tipo_marca_paso_id = ?");
            valores.push(tipo_marca_paso_id);
        }

        if (tipo_operacion_id !== undefined && tipo_operacion_id !== null) {
            campos.push("tipo_operacion_id = ?");
            valores.push(tipo_operacion_id);
        }

        if (campos.length === 0) {
            return res.status(400).json({ message: 'No se enviaron datos válidos para actualizar' });
        }

        valores.push(id);

        const sql = `UPDATE registrar_solicitud_pacientes SET ${campos.join(', ')} WHERE id = ?`;

        const [result] = await db.query(sql, valores);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        res.json({ message: 'Campos de operación y marcapaso actualizados correctamente' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const PacientesConSolicitudes = async (req, res) => {
    try {
        // 1. Extraemos los parámetros de req.query
        const { fechaInicio, fechaFin } = req.query;

        // 2. Definimos la base de la consulta
        // Nota: He quitado el ORDER BY de aquí para concatenarlo al final
        let sql = `
            SELECT
                p.id as paciente_id, 
                p.primer_nombre, 
                p.primer_apellido, 
                p.cedula, 
                p.edad, 
                p.codificacion_buen_gobierno, 
                p.correo, 
                p.telefono_celular, 
                p.telefono_local,
                s.tipo_marca_paso_id, 
                DATE_FORMAT(s.fecha_cita, '%d/%m/%y') AS fecha_cita,
                es.nombre_estatus AS estatus_nombre,
                cs.descripcion AS centro_salud_nombre
            FROM registrar_solicitud_pacientes s
            LEFT JOIN pacientes p ON s.paciente_id = p.id
            LEFT JOIN estatus_solicitudes es ON s.estatus_solicitud_id = es.id
            LEFT JOIN lista_centro_salud cs ON s.centro_salud_id = cs.id
        `;

        const params = [];

        // 3. Agregamos el filtro de fechas dinámicamente
        // Si vienen null o vacíos, este bloque se salta y trae todo
        if (fechaInicio && fechaFin) {
            sql += ` WHERE DATE(s.fecha_cita) BETWEEN ? AND ?`;
            params.push(fechaInicio, fechaFin);
        }

        // 4. Agregamos el ordenamiento al final de todo
        sql += ` ORDER BY s.fecha_creacion DESC`;

        // 5. Ejecutamos la consulta con los parámetros
        const [rows] = await db.query(sql, params);

        if (rows.length === 0) {
            // Cambiado a 200 con array vacío para que el front no de error de "No encontrado"
            // pero mantengo tu lógica de mensaje si prefieres el 404
            return res.status(200).json([]);
        }

        res.json(rows);
    } catch (error) {
        console.error("Error en PacientesConSolicitudes:", error);
        res.status(500).json({ error: error.message });
    }
};


const PacientesConSolicitudesNoActualizados = async (req, res) => {
    try {
        // 1. Extraemos los parámetros de la URL (Query String)
        const { fechaInicio, fechaFin } = req.query;

        // 2. Definimos la base de la consulta SQL
        let sql = `
            SELECT
                p.id as paciente_id, 
                p.primer_nombre, 
                p.primer_apellido, 
                p.cedula, 
                p.edad, 
                p.codificacion_buen_gobierno, 
                p.correo, 
                p.telefono_celular, 
                p.telefono_local,
                s.tipo_marca_paso_id, 
                DATE_FORMAT(s.fecha_cita, '%d/%m/%y') AS fecha_cita,
                es.nombre_estatus AS estatus_nombre,
                cs.descripcion AS centro_salud_nombre
            FROM registrar_solicitud_pacientes s
            LEFT JOIN pacientes p ON s.paciente_id = p.id
            LEFT JOIN estatus_solicitudes es ON s.estatus_solicitud_id = es.id
            LEFT JOIN lista_centro_salud cs ON s.centro_salud_id = cs.id
            WHERE p.actualizado = 0 AND s.estatus_solicitud_id = 1
        `;

        const params = [];

        // 3. Aplicamos el filtro de fechas solo si ambos campos están presentes
        if (fechaInicio && fechaFin) {
            sql += ` AND DATE(s.fecha_cita) BETWEEN ? AND ?`;
            params.push(fechaInicio, fechaFin);
        }

        // 4. Agregamos el ordenamiento final
        sql += ` ORDER BY s.fecha_creacion DESC`;

        // 5. Ejecutamos la consulta usando parámetros para evitar SQL Injection
        const [rows] = await db.query(sql, params);

        if (rows.length === 0) {
            return res.status(200).json([]);
        }

        // Retornamos los resultados
        res.json(rows);
    } catch (error) {
        console.error("Error en PacientesConSolicitudesNoActualizados:", error);
        res.status(500).json({ error: error.message });
    }
};


const PacientesConSolicitudesActualizados = async (req, res) => {
    try {
        // 1. Recibimos los parámetros por query string (ej: ?fechaInicio=2023-01-01&fechaFin=2023-12-31)
        const { fechaInicio, fechaFin } = req.query;

        // 2. Base de la consulta y arreglo de parámetros
        let sql = `
            SELECT
                p.id as paciente_id, 
                p.primer_nombre, 
                p.primer_apellido, 
                p.cedula, 
                p.edad, 
                p.codificacion_buen_gobierno, 
                p.correo, 
                p.telefono_celular, 
                p.telefono_local,
                s.tipo_marca_paso_id, 
                DATE_FORMAT(s.fecha_cita, '%d/%m/%y') AS fecha_cita,
                es.nombre_estatus AS estatus_nombre,
                cs.descripcion AS centro_salud_nombre
            FROM registrar_solicitud_pacientes s
            LEFT JOIN pacientes p ON s.paciente_id = p.id
            LEFT JOIN estatus_solicitudes es ON s.estatus_solicitud_id = es.id
            LEFT JOIN lista_centro_salud cs ON s.centro_salud_id = cs.id
            WHERE p.actualizado = 1 AND s.estatus_solicitud_id = 1
        `;
        
        const params = [];

        // 3. Agregamos las condiciones dinámicamente si vienen los parámetros
        if (fechaInicio && fechaFin) {
            // Si vienen ambas, filtramos por el rango
            sql += ` AND DATE(s.fecha_cita) BETWEEN ? AND ?`;
            params.push(fechaInicio, fechaFin);
        } else if (fechaInicio) {
            // Si por alguna razón solo mandan el inicio
            sql += ` AND DATE(s.fecha_cita) >= ?`;
            params.push(fechaInicio);
        } else if (fechaFin) {
            // Si solo mandan el fin
            sql += ` AND DATE(s.fecha_cita) <= ?`;
            params.push(fechaFin);
        }

        // 4. Agregamos el ordenamiento al final
        sql += ` ORDER BY s.fecha_creacion DESC`;

        // 5. Ejecutamos pasando el arreglo de parámetros
        const [rows] = await db.query(sql, params);

        if (rows.length === 0) {
            return res.status(200).json([]); 
        }

        res.status(200).json(rows);

    } catch (error) {
        console.error("Error en PacientesConSolicitudesActualizados:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    createSolicitud,
    getSolicitudes,
    getSolicitudByPacienteId,
    getSolicitudesAdministrativas,
    getSolicitudesMedicas,
    updateEstatusFase,
    updateDatosMedicos,
    updateVerificacionDocumento,
    deleteSolicitud,
    finalizarVerificacion,
    asignarHospital,
    getSolicitudesPendientesAreaMedica,
    getSolicitudesPendientesAreaAdministrativa,
    getSolicitudById,
    updateTipoOperacionYMarcaPaso,
    getSolicitudesPendientesPorCentro,
    PacientesConSolicitudes,
    getSolicitudesEstatusDinamico,
    PacientesConSolicitudesActualizados,
    PacientesConSolicitudesNoActualizados,
    getSolicitudesPendientesAreaMedicaOperados
};