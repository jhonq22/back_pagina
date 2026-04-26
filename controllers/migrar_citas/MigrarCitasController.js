const xlsx = require('xlsx');
const db = require('../../config/db');

/**
 * Utilidades de fecha
 */
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

const formatExcelDate = (excelDate) => {
    if (!excelDate) return null;
    if (typeof excelDate === 'string') return excelDate.split('/').reverse().join('-');
    const date = new Date((excelDate - (25567 + 1)) * 86400 * 1000);
    return fechaSQL(date);
};

const obtenerEstadoHospital = async (req, res) => {
    try {
        const { centro_salud_id } = req.params;
        const [rows] = await db.query(
            'SELECT fecha_inicio_reparto, ultima_fecha_asignada FROM control_asignacion_citas WHERE centro_salud_id = ?',
            [centro_salud_id]
        );
        if (rows.length === 0) return res.json({ existe: false });
        res.json({
            existe: true,
            ultima_fecha: rows[0].ultima_fecha_asignada,
            fecha_inicio_inicial: rows[0].fecha_inicio_reparto
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error al consultar estado' });
    }
};

const subirExcelTemporal = async (req, res) => {
    try {
        const { centro_salud_id, fecha_inicio } = req.body;
        if (!req.file) return res.status(400).json({ msg: 'Falta el archivo Excel' });
        if (!centro_salud_id) return res.status(400).json({ msg: 'Debe seleccionar un hospital.' });

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const datosRaw = xlsx.utils.sheet_to_json(sheet);

        if (datosRaw.length === 0) return res.status(200).json({ msg: 'El Excel está vacío.' });

        // --- 1. VALIDACIÓN DE NULOS/VACÍOS Y DUPLICADOS DENTRO DEL MISMO EXCEL ---
        const cedulasEnExcel = new Set();
        const codigosEnExcel = new Set();

        for (const fila of datosRaw) {
            const cedula = fila['CEDULA'];
            const codigo = fila['CODIGO 1X10'];

            // NUEVA VALIDACIÓN: Rechazar si Cédula o Código 1x10 vienen vacíos, null o undefined
            if (cedula === null || cedula === undefined || String(cedula).trim() === '') {
                return res.status(400).json({ msg: 'Error: El archivo Excel contiene registros sin CÉDULA. Archivo rechazado.' });
            }
            if (codigo === null || codigo === undefined || String(codigo).trim() === '') {
                return res.status(400).json({ msg: `Error: El archivo Excel contiene registros sin CÓDIGO 1X10 (Cédula afectada: ${cedula}). Archivo rechazado.` });
            }

            if (cedulasEnExcel.has(cedula)) {
                return res.status(400).json({ msg: `Error: El archivo Excel contiene la Cédula duplicada: ${cedula}` });
            }
            if (codigosEnExcel.has(codigo)) {
                return res.status(400).json({ msg: `Error: El archivo Excel contiene el Código 1x10 duplicado: ${codigo}` });
            }

            cedulasEnExcel.add(cedula);
            codigosEnExcel.add(codigo);
        }

        // --- 2. VALIDACIÓN CONTRA LA BASE DE DATOS (Mismo Hospital y En Espera) ---
        const listaCedulas = Array.from(cedulasEnExcel);
        const listaCodigos = Array.from(codigosEnExcel);

        if (listaCedulas.length > 0) {
            const [duplicadosBD] = await db.query(
                `SELECT cedula, codificacion_buen_gobierno 
                 FROM pacientes_cita_temporal 
                 WHERE estatus = 'en_espera' 
                 AND centro_salud_id = ?
                 AND (cedula IN (?) OR (codificacion_buen_gobierno IN (?) AND codificacion_buen_gobierno IS NOT NULL))`,
                [centro_salud_id, listaCedulas, listaCodigos.length > 0 ? listaCodigos : ['']]
            );

            if (duplicadosBD.length > 0) {
                const item = duplicadosBD[0];
                const esCedula = listaCedulas.includes(item.cedula);
                const desc = esCedula ? `Cédula ${item.cedula}` : `Código 1x10 ${item.codificacion_buen_gobierno}`;
                return res.status(400).json({ msg: `Carga cancelada. Ya existe un registro en espera en este hospital con: ${desc}` });
            }
        }

        // --- 3. PROCESO DE ASIGNACIÓN DE CITAS ---
        const [config] = await db.query(
            'SELECT dia_semana, cupos_maximos FROM configuracion_dias WHERE centro_salud_id = ?',
            [centro_salud_id]
        );
        if (config.length === 0) return res.status(400).json({ msg: 'El hospital no tiene configuración de cupos.' });

        const cuposPorDia = {};
        config.forEach(c => cuposPorDia[c.dia_semana] = c.cupos_maximos);

        const [control] = await db.query('SELECT * FROM control_asignacion_citas WHERE centro_salud_id = ?', [centro_salud_id]);
        let fechaActualStr = fecha_inicio || (control.length > 0 && control[0].ultima_fecha_asignada
            ? fechaSQL(new Date(control[0].ultima_fecha_asignada))
            : fechaSQL(new Date()));

        if (fecha_inicio) {
            await db.query(
                `INSERT INTO control_asignacion_citas (centro_salud_id, fecha_inicio_reparto) 
                 VALUES (?, ?) ON DUPLICATE KEY UPDATE fecha_inicio_reparto = ?, ultima_fecha_asignada = NULL`,
                [centro_salud_id, fecha_inicio, fecha_inicio]
            );
        }

        let fechaCursor = new Date(`${fechaActualStr}T00:00:00`);
        let cuposDisponiblesHoy = null;
        const pacientesParaInsertar = [];

        for (const fila of datosRaw) {
            // Ya validamos arriba que la cédula y el código existen, pero dejamos este continue como red de seguridad
            if (!fila['CEDULA']) continue;

            let asignado = false;
            let intentos = 0;

            while (!asignado && intentos < 365) {
                let diaSemanaJS = fechaCursor.getDay();
                let diaSemanaDB = (diaSemanaJS === 0) ? 7 : diaSemanaJS;
                let limite = cuposPorDia[diaSemanaDB] || 0;
                let fechaStr = fechaSQL(fechaCursor);

                if (limite === 0) {
                    fechaCursor = sumarDias(fechaCursor, 1);
                    cuposDisponiblesHoy = null;
                    intentos++;
                    continue;
                }

                if (cuposDisponiblesHoy === null) {
                    const [oficiales] = await db.query('SELECT COUNT(*) as total FROM registrar_solicitud_pacientes WHERE fecha_cita = ? AND centro_salud_id = ?', [fechaStr, centro_salud_id]);
                    const [temporales] = await db.query('SELECT COUNT(*) as total FROM pacientes_cita_temporal WHERE fecha_cita_asignada = ? AND estatus = "en_espera" AND centro_salud_id = ?', [fechaStr, centro_salud_id]);
                    cuposDisponiblesHoy = limite - ((oficiales[0].total || 0) + (temporales[0].total || 0));
                }

                if (cuposDisponiblesHoy > 0) {
                    pacientesParaInsertar.push([
                        fila['CODIGO 1X10'], // Ya sabemos que no es null
                        fila['CEDULA'],      // Ya sabemos que no es null
                        fila['PRIMER NOMBRE'],
                        fila['SEGUNDO NOMBRE'] || null,
                        fila['PRIMER APELLIDO'],
                        fila['SEGUNDO APELLIDO'] || null,
                        fila['TELEFONO 1'] || null,
                        fila['TELEFONO 2'] || null,
                        fila['CORREO ELECTRONICO'] || null,
                        formatExcelDate(fila['FECHA NACIMIENTO']),
                        fechaStr,
                        (fila['ESTADO'] || '') + ", " + (fila['MUNICIPIO'] || ''),
                        centro_salud_id
                    ]);
                    cuposDisponiblesHoy--;
                    asignado = true;
                } else {
                    fechaCursor = sumarDias(fechaCursor, 1);
                    cuposDisponiblesHoy = null;
                }
                intentos++;
            }
        }

        if (pacientesParaInsertar.length > 0) {
            await db.query(
                `INSERT INTO pacientes_cita_temporal 
                (codificacion_buen_gobierno, cedula, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, telefono2, correo, fecha_nacimiento, fecha_cita_asignada, direccion, centro_salud_id) 
                VALUES ?`,
                [pacientesParaInsertar]
            );
            await db.query('UPDATE control_asignacion_citas SET ultima_fecha_asignada = ? WHERE centro_salud_id = ?', [fechaSQL(fechaCursor), centro_salud_id]);
        }

        res.json({ msg: 'Proceso terminado con éxito', cantidad: pacientesParaInsertar.length, ultima_fecha: fechaSQL(fechaCursor) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error interno del servidor' });
    }
};

const obtenerPacientesTemporales = async (req, res) => {
    try {
        // Obtenemos el id desde los parámetros de la URL o del query string
        const { centro_salud_id } = req.params;

        if (!centro_salud_id) {
            return res.status(400).json({ status: false, msg: 'El ID del centro de salud es requerido' });
        }

        const [rows] = await db.query(
            'SELECT * FROM pacientes_cita_temporal WHERE estatus = "en_espera" AND centro_salud_id = ? ORDER BY fecha_cita_asignada ASC',
            [centro_salud_id]
        );

        res.json({ status: rows.length > 0, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, msg: 'Error al obtener datos' });
    }
};

module.exports = { subirExcelTemporal, obtenerPacientesTemporales, obtenerEstadoHospital };