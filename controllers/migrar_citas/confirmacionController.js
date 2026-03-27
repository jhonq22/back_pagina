const db = require('../../config/db');

// Función para calcular edad
const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const cumple = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
        edad--;
    }
    return edad;
};

const confirmarCitas = async (req, res) => {
    const { centro_salud_id } = req.body;

    if (!centro_salud_id) {
        return res.status(400).json({ status: true, msg: 'El ID del centro de salud es obligatorio.' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [temporales] = await connection.query(
            'SELECT * FROM pacientes_cita_temporal WHERE estatus = "en_espera"'
        );

        if (temporales.length === 0) {
            await connection.rollback();
            return res.json({ status: false, msg: 'No hay pacientes pendientes por confirmar' });
        }

        let procesados = 0;

        for (const temp of temporales) {
            // ==========================================
            // NUEVA VALIDACIÓN: Evitar solicitudes duplicadas
            // ==========================================
            // Nos aseguramos de manejar nulos en la codificación para no tener falsos positivos
            const codGobierno = temp.codificacion_buen_gobierno || '';

            const [solicitudActiva] = await connection.query(
                `SELECT rsp.id 
                 FROM registrar_solicitud_pacientes rsp
                 INNER JOIN pacientes p ON rsp.paciente_id = p.id
                 WHERE (p.cedula = ? OR (p.codificacion_buen_gobierno = ? AND p.codificacion_buen_gobierno != ''))
                   AND (rsp.estatus = 1 AND rsp.estatus_solicitud_id != 6)
                 LIMIT 1`,
                [temp.cedula, codGobierno]
            );

            // Si encuentra una solicitud en true (1) y que no sea 6, bloquea y pinta error
            if (solicitudActiva.length > 0) {
                await connection.rollback();
                return res.status(400).json({
                    status: true,
                    msg: `La cédula ${temp.cedula} o código ya tiene una solicitud asignada y no puede registrar otra hasta que la finalice.`
                });
            }
            // ==========================================

            let pacienteId = null;
            const edadCalculada = calcularEdad(temp.fecha_nacimiento);

            const [existente] = await connection.query(
                'SELECT id FROM pacientes WHERE cedula = ?',
                [temp.cedula]
            );

            if (existente.length > 0) {
                pacienteId = existente[0].id;
                await connection.query(
                    `UPDATE pacientes SET 
                        codificacion_buen_gobierno = ?,
                        fecha_nacimiento = ?,
                        edad = ?,
                        telefono_local = ?,
                        telefono_celular = ?,
                        estado_id = 24,
                        municipio_id = 462,
                        parroquia_id = 1117
                     WHERE id = ?`,
                    [temp.codificacion_buen_gobierno, temp.fecha_nacimiento, edadCalculada, temp.telefono, temp.telefono2, pacienteId]
                );
            } else {
                const [nuevo] = await connection.query(
                    `INSERT INTO pacientes 
                    (cedula, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, 
                     telefono_local, telefono_celular, correo, fecha_nacimiento, edad, codificacion_buen_gobierno, 
                     estado_id, municipio_id, parroquia_id, estatus, es_cedulado) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 24, 462, 1117, 1, 1)`,
                    [
                        temp.cedula, temp.primer_nombre, temp.segundo_nombre, temp.primer_apellido, temp.segundo_apellido,
                        temp.telefono, temp.telefono2, temp.correo, temp.fecha_nacimiento, edadCalculada, temp.codificacion_buen_gobierno
                    ]
                );
                pacienteId = nuevo.insertId;
            }

            // Crear solicitud
            await connection.query(
                `INSERT INTO registrar_solicitud_pacientes 
                (paciente_id, fecha_cita, estatus_solicitud_id, tipo_operacion_id, centro_salud_id, estatus, fecha_creacion) 
                VALUES (?, ?, 1, 1, ?, 1, NOW())`,
                [pacienteId, temp.fecha_cita_asignada, centro_salud_id]
            );

            // Marcar procesado
            await connection.query(
                'UPDATE pacientes_cita_temporal SET estatus = "procesado" WHERE id = ?',
                [temp.id]
            );

            procesados++;
        }

        await connection.commit();
        res.json({ status: false, msg: 'Confirmación exitosa', total_procesados: procesados });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error en confirmación:", error);
        res.status(500).json({ status: true, msg: 'Error en la confirmación', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const eliminarTemporales = async (req, res) => {
    // Obtenemos una conexión del pool
    const connection = await db.getConnection();

    try {
        // Ejecutamos la consulta de eliminación
        const [result] = await connection.query(
            'DELETE FROM pacientes_cita_temporal WHERE estatus = "en_espera"'
        );

        // Verificamos si se eliminó algo
        if (result.affectedRows > 0) {
            return res.json({
                status: true,
                msg: `Se han eliminado ${result.affectedRows} registros en espera correctamente.`
            });
        } else {
            return res.json({
                status: true,
                msg: 'No se encontraron registros en espera para eliminar.'
            });
        }

    } catch (error) {
        console.error("Error al eliminar temporales:", error);
        return res.status(500).json({
            status: false,
            msg: 'Hubo un error al intentar limpiar la lista.',
            error: error.message
        });
    } finally {
        // Importante: Liberar la conexión siempre
        if (connection) connection.release();
    }
};


const eliminarTemporalPorId = async (req, res) => {
    // Obtenemos el ID de los parámetros de la ruta
    const { id } = req.params;
    const connection = await db.getConnection();

    try {
        // Ejecutamos la consulta filtrando por el ID
        const [result] = await connection.query(
            'DELETE FROM pacientes_cita_temporal WHERE id = ?',
            [id]
        );

        // Verificamos si las filas afectadas son mayores a 0
        if (result.affectedRows > 0) {
            return res.json({
                status: true,
                msg: `El registro con ID ${id} ha sido eliminado correctamente.`
            });
        } else {
            // Si el ID no existe o ya fue eliminado
            return res.status(404).json({
                status: false,
                msg: 'No se encontró el registro especificado para eliminar.'
            });
        }

    } catch (error) {
        console.error("Error al eliminar el registro temporal:", error);
        return res.status(500).json({
            status: false,
            msg: 'Hubo un error al intentar eliminar el registro.',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};


module.exports = { confirmarCitas, eliminarTemporales, eliminarTemporalPorId };