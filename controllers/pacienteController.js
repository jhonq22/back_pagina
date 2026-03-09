const db = require('../config/db');

// 1. Obtener todos los pacientes
const getAllPacientes = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM pacientes ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener pacientes', error: error.message });
    }
};

// 2. Obtener un paciente por ID
const getPacienteById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM pacientes WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Paciente no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar paciente', error: error.message });
    }
};

// 3. Crear un nuevo paciente
const createPaciente = async (req, res) => {
    const {
        cedula, es_cedulado, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        sexo, fecha_nacimiento, estado_civil, estado_id, municipio_id, parroquia_id,
        telefono_local, telefono_celular, correo, estatus,
        edad, pais_id, lugar_nacimiento, nivel_estudio_id, direccion_actual,
        institucion_referencia, otra_institucion, religion, etnia_indigena_id,
        bilingue, telefono_emergencia, correo_secundario, instagram, facebook,
        twitter, otras_redes, codificacion_buen_gobierno,
        paciente_id, actualizado,
        profesion // <--- Nuevo campo
    } = req.body;

    try {
        const sql = `
            INSERT INTO pacientes 
            (cedula, es_cedulado, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, 
            sexo, fecha_nacimiento, estado_civil, estado_id, municipio_id, parroquia_id,
            telefono_local, telefono_celular, correo, estatus,
            edad, pais_id, lugar_nacimiento, nivel_estudio_id, direccion_actual,
            institucion_referencia, otra_institucion, religion, etnia_indigena_id,
            bilingue, telefono_emergencia, correo_secundario, instagram, facebook,
            twitter, otras_redes, codificacion_buen_gobierno, paciente_id, actualizado, 
            profesion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            cedula, es_cedulado, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
            sexo, fecha_nacimiento, estado_civil, estado_id, municipio_id, parroquia_id,
            telefono_local, telefono_celular, correo, estatus || 1,
            edad, pais_id, lugar_nacimiento, nivel_estudio_id, direccion_actual,
            institucion_referencia, otra_institucion, religion, etnia_indigena_id,
            bilingue, telefono_emergencia, correo_secundario, instagram, facebook,
            twitter, otras_redes, codificacion_buen_gobierno, paciente_id || null,
            actualizado || 0,
            profesion || null // <--- Valor para profesion
        ];

        const [result] = await db.query(sql, values);
        res.status(201).json({ message: 'Paciente creado exitosamente', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear paciente', error: error.message });
    }
};

// 4. Actualizar un paciente (Se mantiene dinámico, aceptará 'profesion' automáticamente)
const updatePaciente = async (req, res) => {
    const { id } = req.params;
    const camposAActualizar = { ...req.body };

    if (Object.keys(camposAActualizar).length === 0) {
        return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    camposAActualizar.actualizado = 1;

    try {
        const keys = Object.keys(camposAActualizar);
        const setString = keys.map(key => `${key}=?`).join(', ');

        const values = Object.values(camposAActualizar);
        values.push(id);

        const sql = `UPDATE pacientes SET ${setString} WHERE id = ?`;

        const [result] = await db.query(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado' });
        } 

        res.json({ message: 'Paciente actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// 5. Eliminar paciente
const deletePaciente = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM pacientes WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Paciente no encontrado' });
        res.json({ message: 'Paciente eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar paciente', error: error.message });
    }
};


const verInformacionPacientePorID = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT 
                p.*,
                e.estado AS estado_nombre,
                m.municipio AS municipio_nombre,
                pa.parroquia AS parroquia_nombre,
                pais.nombre AS pais_nombre,
                ne.estudio AS nivel_estudio_nombre,
                et.etnia AS etnia_indigena_nombre
            FROM pacientes p
            LEFT JOIN estados e ON p.estado_id = e.id_estado
            LEFT JOIN municipios m ON p.municipio_id = m.id_municipio
            LEFT JOIN parroquias pa ON p.parroquia_id = pa.id_parroquia
            LEFT JOIN paises pais ON p.pais_id = pais.id
            LEFT JOIN nivel_estudios ne ON p.nivel_estudio_id = ne.id
            LEFT JOIN etnia_indigenas et ON p.etnia_indigena_id = et.id
            WHERE p.id = ?
        `;

        const [rows] = await db.query(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener detalles del paciente:", error);
        res.status(500).json({ 
            message: 'Error al buscar paciente', 
            error: error.message 
        });
    }
};

module.exports = { getAllPacientes, getPacienteById, createPaciente, updatePaciente, deletePaciente, verInformacionPacientePorID };