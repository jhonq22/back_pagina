const db = require('../../config/db');
const fs = require('fs');
const path = require('path');
const { encrypt, decrypt } = require('../../config/cryptoUtils');

// Definir la ruta de las firmas
const DIR_FIRMAS = path.join(__dirname, '../../uploads/firmas');

// Crear la carpeta si no existe
if (!fs.existsSync(DIR_FIRMAS)) {
    fs.mkdirSync(DIR_FIRMAS, { recursive: true });
}

const MedicoController = {
    // --- MÉTODOS EXISTENTES ---
    getMedicos: async (req, res) => {
        try {
            const sql = `
            SELECT 
                m.*,
                f.id AS firma_registro_id,
                f.nombre_archivo,
                f.especialidad_id,
                e.descripcion 
            FROM registro_medicos m
            LEFT JOIN firmas_medicos f ON m.id = f.medico_id
            LEFT JOIN especialidades e ON f.especialidad_id = e.id
            WHERE m.estatus = 1
            ORDER BY m.primerApellido ASC, m.primerNombre ASC
        `;

            const [rows] = await db.query(sql);

            // Agrupar especialidades por médico
            const medicosAgrupados = rows.reduce((acc, row) => {
                const medicoExistente = acc.find(m => m.id === row.id);

                const infoFirma = row.firma_registro_id ? {
                    id: row.firma_registro_id,
                    especialidad: row.descripcion,
                    especialidad_id: row.especialidad_id,
                    archivo: row.nombre_archivo,

                } : null;

                if (medicoExistente) {
                    if (infoFirma) medicoExistente.especialidades.push(infoFirma);
                } else {
                    const nuevoMedico = {
                        ...row,
                        especialidades: infoFirma ? [infoFirma] : []
                    };
                    // Limpiamos los campos que ahora están en el array para evitar ruido
                    delete nuevoMedico.firma_registro_id;
                    delete nuevoMedico.nombre_especialidad;
                    delete nuevoMedico.especialidad_id;
                    delete nuevoMedico.nombre_archivo;

                    acc.push(nuevoMedico);
                }
                return acc;
            }, []);

            res.json(medicosAgrupados);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // --- NUEVO MÉTODO: GET MEDICO CON DATOS DE USUARIO ---
    getMedicoUsuario: async (req, res) => {
        try {
            const sql = `
            SELECT 
                m.*,
                f.id AS firma_registro_id,
                f.nombre_archivo,
                f.especialidad_id,
                e.descripcion,
                u.usuario,
                u.nombres AS nombres_usuario,
                u.rol_id,
                u.centro_salud_id,
                u.estatus AS estatus_usuario,
                mrm.roles_medico,
                mrm.marcapaso,    
                mrm.hemodinamia,
                lcs.descripcion AS centro_salud_descripcion
            FROM registro_medicos m
            LEFT JOIN firmas_medicos f ON m.id = f.medico_id
            LEFT JOIN especialidades e ON f.especialidad_id = e.id
            LEFT JOIN users u ON m.usuario_id = u.id
            LEFT JOIN lista_centro_salud lcs ON u.centro_salud_id = lcs.id
            LEFT JOIN multi_roles_medicos mrm ON u.id = mrm.usuario_id
            ORDER BY m.primerApellido ASC, m.primerNombre ASC
        `;

            const [rows] = await db.query(sql);

            // Agrupamos igual que en getMedicos, pero ahora el objeto raíz 
            // contendrá también la info del usuario y sus roles.
            const medicosAgrupados = rows.reduce((acc, row) => {
                const medicoExistente = acc.find(m => m.id === row.id);

                const infoFirma = row.firma_registro_id ? {
                    id: row.firma_registro_id,
                    especialidad: row.descripcion,
                    especialidad_id: row.especialidad_id,
                    archivo: row.nombre_archivo,
                } : null;

                if (medicoExistente) {
                    if (infoFirma) medicoExistente.especialidades.push(infoFirma);
                } else {
                    const nuevoMedico = {
                        ...row,
                        especialidades: infoFirma ? [infoFirma] : []
                    };
                    
                    // Limpiamos los campos agrupados de la firma para el objeto principal
                    delete nuevoMedico.firma_registro_id;
                    delete nuevoMedico.nombre_especialidad;
                    delete nuevoMedico.especialidad_id;
                    delete nuevoMedico.nombre_archivo;
                    // Borramos la 'descripcion' suelta de la especialidad para evitar confusiones, 
                    // ya que está dentro del array 'especialidades' (y tenemos centro_salud_descripcion)
                    delete nuevoMedico.descripcion; 

                    // Parsear roles_medico si viene como string JSON desde la BD
                    if (typeof nuevoMedico.roles_medico === 'string') {
                        try {
                            nuevoMedico.roles_medico = JSON.parse(nuevoMedico.roles_medico);
                        } catch (e) {
                            // Si no es JSON válido, lo dejamos como está
                        }
                    }

                    // Convertir tinyint (0/1) a booleanos para el frontend (opcional pero recomendado para Vue)
                    nuevoMedico.marcapaso = !!nuevoMedico.marcapaso;
                    nuevoMedico.hemodinamia = !!nuevoMedico.hemodinamia;

                    acc.push(nuevoMedico);
                }
                return acc;
            }, []);

            res.json(medicosAgrupados);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },


// --- NUEVO MÉTODO: OBTENER MÉDICOS POR CENTRO DE SALUD ---

    getMedicosByCentroSalud: async (req, res) => {
        const { centro_salud_id } = req.params;

        if (!centro_salud_id) {
            return res.status(400).json({ error: 'El ID del centro de salud es obligatorio' });
        }

        try {
            const sql = `
                SELECT 
                    CONCAT_WS(' ', m.primerNombre, m.primerApellido) AS label,
                    m.id AS value
                FROM registro_medicos m
                INNER JOIN users u ON m.usuario_id = u.id
                WHERE u.centro_salud_id = ? 
                  AND u.rol_id = 4 
                  AND m.estatus = 1
                ORDER BY m.primerNombre ASC, m.primerApellido ASC
            `;

            const [rows] = await db.query(sql, [centro_salud_id]);

            // Devolvemos el arreglo directamente en el formato [{ label: '...', value: X }]
            res.json(rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },














    saveMedico: async (req, res) => {
        const {
            id, cedula, primerNombre, segundoNombre, primerApellido,
            segundoApellido, fechaNacimiento, edad, sexo, estadoCivil,
            id_estado, id_municipio, id_parroquia, direccion_actual,
            telefono_celular, telefono_local, correo, estatus, mpps,
            usuario_id
        } = req.body;

        if (!cedula || !primerNombre || !primerApellido) {
            return res.status(400).json({ error: 'Cédula, primer nombre y primer apellido son obligatorios' });
        }

        try {
            const [existe] = await db.query(
                'SELECT id FROM registro_medicos WHERE cedula = ? AND id != ?',
                [cedula, id || 0]
            );

            if (existe.length > 0) {
                return res.status(400).json({ error: 'Ya existe un médico registrado con esta cédula' });
            }

            if (id) {
                const sql = `
                    UPDATE registro_medicos SET 
                        cedula = ?, primerNombre = ?, segundoNombre = ?, primerApellido = ?, 
                        segundoApellido = ?, fechaNacimiento = ?, edad = ?, sexo = ?, 
                        estadoCivil = ?, id_estado = ?, id_municipio = ?, id_parroquia = ?, 
                        direccion_actual = ?, telefono_celular = ?, telefono_local = ?, 
                        correo = ?, estatus = ?, mpps = ?, usuario_id = ? 
                    WHERE id = ?`;

                await db.query(sql, [
                    cedula, primerNombre, segundoNombre, primerApellido,
                    segundoApellido, fechaNacimiento, edad, sexo,
                    estadoCivil, id_estado, id_municipio, id_parroquia,
                    direccion_actual, telefono_celular, telefono_local,
                    correo, estatus, mpps, usuario_id, id
                ]);

                return res.json({ message: 'Médico actualizado con éxito' });
            } else {
                const sql = `
                    INSERT INTO registro_medicos (
                        cedula, primerNombre, segundoNombre, primerApellido, 
                        segundoApellido, fechaNacimiento, edad, sexo, 
                        estadoCivil, id_estado, id_municipio, id_parroquia, 
                        direccion_actual, telefono_celular, telefono_local, 
                        correo, estatus, mpps, usuario_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`; 

                const [result] = await db.query(sql, [
                    cedula, primerNombre, segundoNombre, primerApellido,
                    segundoApellido, fechaNacimiento, edad, sexo,
                    estadoCivil, id_estado, id_municipio, id_parroquia,
                    direccion_actual, telefono_celular, telefono_local, 
                    correo, mpps, usuario_id
                ]);

                return res.status(201).json({ message: 'Médico creado con éxito', id: result.insertId });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

deleteMedico: async (req, res) => {
    const { id } = req.params;
    const { estatus } = req.body; // Recibimos el estado (1 o 0) desde el cliente

    try {
        // Validamos que el estatus venga en la petición
        if (estatus === undefined) {
            return res.status(400).json({ error: 'El campo estatus es obligatorio' });
        }

        await db.query('UPDATE registro_medicos SET estatus = ? WHERE id = ?', [estatus, id]);

        res.json({ 
            message: `Médico ${estatus == 1 ? 'activado' : 'desactivado'} correctamente` 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
},

    saveFirmaEspecialidad: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'La firma del médico es obligatoria' });
            }

            const { medico_id, especialidad_id } = req.body;
            const nombre_archivo = req.file.originalname;
            const ruta_real = req.file.path;

            if (!medico_id || !especialidad_id) {
                if (fs.existsSync(ruta_real)) fs.unlinkSync(ruta_real);
                return res.status(400).json({ error: 'medico_id y especialidad_id son obligatorios' });
            }

            const ruta_encriptada = encrypt(ruta_real);

            const sql = `
                INSERT INTO firmas_medicos (nombre_archivo, medico_id, especialidad_id, ruta_archivo) 
                VALUES (?, ?, ?, ?)
            `;

            const [result] = await db.query(sql, [nombre_archivo, medico_id, especialidad_id, ruta_encriptada]);

            res.status(201).json({
                message: 'Especialidad y firma registradas correctamente',
                id: result.insertId
            });

        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            res.status(500).json({ error: error.message });
        }
    },

    getFirmaBase64: async (req, res) => {
        const { id } = req.params;
        try {
            const [rows] = await db.query('SELECT * FROM firmas_medicos WHERE id = ?', [id]);
            if (rows.length === 0) return res.status(404).json({ message: 'Registro de firma no encontrado' });

            const registro = rows[0];
            const ruta_desencriptada = decrypt(registro.ruta_archivo);

            if (fs.existsSync(ruta_desencriptada)) {
                const bitmap = fs.readFileSync(ruta_desencriptada);
                const base64 = Buffer.from(bitmap).toString('base64');

                const ext = path.extname(ruta_desencriptada).toLowerCase().replace('.', '');
                let mimeType = '';

                switch (ext) {
                    case 'png': mimeType = 'image/png'; break;
                    case 'jpg': case 'jpeg': mimeType = 'image/jpeg'; break;
                    default: mimeType = 'image/png';
                }

                res.json({
                    nombre: registro.nombre_archivo,
                    medico_id: registro.medico_id,
                    especialidad_id: registro.especialidad_id,
                    base64: `data:${mimeType};base64,${base64}`
                });
            } else {
                res.status(404).json({ message: 'El archivo físico de la firma no existe en el servidor' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = MedicoController;