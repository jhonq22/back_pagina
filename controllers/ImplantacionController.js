const db = require('../config/db');

const ImplantacionController = {
    // --- 1. GENERADOR ---
    async saveGenerador(req, res) {
        try {
            const { solicitud_paciente_id, marca_id, modelo_id, serial } = req.body;
            const [exist] = await db.query('SELECT id FROM generador_implantado WHERE solicitud_paciente_id = ?', [solicitud_paciente_id]);

            if (exist.length > 0) {
                await db.query('UPDATE generador_implantado SET marca_id = ?, modelo_id = ?, serial = ? WHERE solicitud_paciente_id = ?',
                    [marca_id, modelo_id, serial, solicitud_paciente_id]);
                return res.json({ message: "Generador actualizado" });
            }

            await db.query('INSERT INTO generador_implantado (solicitud_paciente_id, marca_id, modelo_id, serial) VALUES (?, ?, ?, ?)',
                [solicitud_paciente_id, marca_id, modelo_id, serial]);
            res.status(201).json({ message: "Generador guardado" });
        } catch (e) { res.status(500).json({ error: e.message }); }
    },

    // --- 2. ELECTRODO VENTRICULAR ---

    async saveElectrodoVentricular(req, res) {
        try {
            const {
                solicitud_paciente_id,
                marca_id,
                modelo_id,
                serial,
                medida,
                nueva_medida
            } = req.body;

            const [exist] = await db.query(
                'SELECT id FROM electrodo_verticular_implantado WHERE solicitud_paciente_id = ?',
                [solicitud_paciente_id]
            );

            if (exist.length > 0) {
                await db.query(
                    `UPDATE electrodo_verticular_implantado SET 
                    marca_id = ?, 
                    modelo_id = ?, 
                    serial = ?, 
                    medida = ?, 
                    nueva_medida = ? 
                 WHERE solicitud_paciente_id = ?`,
                    [marca_id, modelo_id, serial, medida, nueva_medida, solicitud_paciente_id]
                );
                return res.json({ message: "Electrodo ventricular actualizado" });
            }

            await db.query(
                `INSERT INTO electrodo_verticular_implantado 
            (solicitud_paciente_id, marca_id, modelo_id, serial, medida, nueva_medida) 
            VALUES (?, ?, ?, ?, ?, ?)`,
                [solicitud_paciente_id, marca_id, modelo_id, serial, medida, nueva_medida]
            );
            res.status(201).json({ message: "Electrodo ventricular guardado" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    },

    // --- 3. ELECTRODO AURICULAR ---
    async saveElectrodoAuricular(req, res) {
        try {
            const {
                solicitud_paciente_id,
                marca_id,
                modelo_id,
                serial,
                medida,
                nueva_medida
            } = req.body;

            const [exist] = await db.query(
                'SELECT id FROM electrodo_auricular_implantado WHERE solicitud_paciente_id = ?',
                [solicitud_paciente_id]
            );

            if (exist.length > 0) {
                await db.query(
                    `UPDATE electrodo_auricular_implantado SET 
                    marca_id = ?, 
                    modelo_id = ?, 
                    serial = ?, 
                    medida = ?, 
                    nueva_medida = ? 
                 WHERE solicitud_paciente_id = ?`,
                    [marca_id, modelo_id, serial, medida, nueva_medida, solicitud_paciente_id]
                );
                return res.json({ message: "Electrodo auricular actualizado" });
            }

            await db.query(
                `INSERT INTO electrodo_auricular_implantado 
            (solicitud_paciente_id, marca_id, modelo_id, serial, medida, nueva_medida) 
            VALUES (?, ?, ?, ?, ?, ?)`,
                [solicitud_paciente_id, marca_id, modelo_id, serial, medida, nueva_medida]
            );
            res.status(201).json({ message: "Electrodo auricular guardado" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    },

    // --- 4. MODO ESTIMULACIÓN ---
    async saveModoEstimulacion(req, res) {
        try {
            const { solicitud_paciente_id, modo_estimulacion, r_modo } = req.body;
            const rModoValue = (r_modo === 'Si' || r_modo === true || r_modo === 1) ? 1 : 0;

            const [exist] = await db.query('SELECT id FROM modo_estimulacion_implantado WHERE solicitud_paciente_id = ?', [solicitud_paciente_id]);

            if (exist.length > 0) {
                await db.query('UPDATE modo_estimulacion_implantado SET modo_estimulacion = ?, r_modo = ? WHERE solicitud_paciente_id = ?',
                    [modo_estimulacion, rModoValue, solicitud_paciente_id]);
                return res.json({ message: "Modo de estimulación actualizado" });
            }

            await db.query('INSERT INTO modo_estimulacion_implantado (solicitud_paciente_id, modo_estimulacion, r_modo) VALUES (?, ?, ?)',
                [solicitud_paciente_id, modo_estimulacion, rModoValue]);
            res.status(201).json({ message: "Modo de estimulación guardado" });
        } catch (e) { res.status(500).json({ error: e.message }); }
    },

    // --- 5. PARÁMETROS MEDIDOS VENTRICULAR ---
    async saveParametrosMedidosVent(req, res) {
        try {
            const { solicitud_paciente_id, umbral_captura, impedancia, duracion, modo_estimulacion } = req.body;
            const [exist] = await db.query('SELECT id FROM parametro_medidos_ventricular_implantado WHERE solicitud_paciente_id = ?', [solicitud_paciente_id]);

            if (exist.length > 0) {
                await db.query('UPDATE parametro_medidos_ventricular_implantado SET umbral_captura = ?, impedancia = ?, duracion = ?, modo_estimulacion = ? WHERE solicitud_paciente_id = ?',
                    [umbral_captura, impedancia, duracion, modo_estimulacion, solicitud_paciente_id]);
                return res.json({ message: "Mediciones ventriculares actualizadas" });
            }

            await db.query('INSERT INTO parametro_medidos_ventricular_implantado (solicitud_paciente_id, umbral_captura, impedancia, duracion, modo_estimulacion) VALUES (?, ?, ?, ?, ?)',
                [solicitud_paciente_id, umbral_captura, impedancia, duracion, modo_estimulacion]);
            res.status(201).json({ message: "Mediciones ventriculares guardadas" });
        } catch (e) { res.status(500).json({ error: e.message }); }
    },

    // --- 6. PARÁMETROS PROGRAMACIÓN VENTRICULAR ---
    async saveParametrosProgVent(req, res) {
        try {
            const { solicitud_paciente_id, amplitud_r, fc_minima, voltios, tiempos } = req.body;

            const [exist] = await db.query(
                'SELECT id FROM parametro_programacion_ventricular_implantado WHERE solicitud_paciente_id = ?',
                [solicitud_paciente_id]
            );

            if (exist.length > 0) {
                // Actualización de registros existentes
                await db.query(
                    'UPDATE parametro_programacion_ventricular_implantado SET amplitud_r = ?, fc_minima = ?, voltios = ?, tiempos = ? WHERE solicitud_paciente_id = ?',
                    [amplitud_r, fc_minima, voltios, tiempos, solicitud_paciente_id]
                );
                return res.json({ message: "Programación ventricular actualizada" });
            }

            // Inserción de nuevo registro
            await db.query(
                'INSERT INTO parametro_programacion_ventricular_implantado (solicitud_paciente_id, amplitud_r, fc_minima, voltios, tiempos) VALUES (?, ?, ?, ?, ?)',
                [solicitud_paciente_id, amplitud_r, fc_minima, voltios, tiempos]
            );

            res.status(201).json({ message: "Programación ventricular guardada" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    },

    // --- 7. PARÁMETROS MEDIDOS AURICULAR ---
    async saveParametrosMedidosAur(req, res) {
        try {
            const { solicitud_paciente_id, umbral_captura, impedancia, duracion, modo_estimulacion } = req.body;
            const [exist] = await db.query('SELECT id FROM parametro_medidos_auricular_implantado WHERE solicitud_paciente_id = ?', [solicitud_paciente_id]);

            if (exist.length > 0) {
                await db.query('UPDATE parametro_medidos_auricular_implantado SET umbral_captura = ?, impedancia = ?, duracion = ?, modo_estimulacion = ? WHERE solicitud_paciente_id = ?',
                    [umbral_captura, impedancia, duracion, modo_estimulacion, solicitud_paciente_id]);
                return res.json({ message: "Mediciones auriculares actualizadas" });
            }

            await db.query('INSERT INTO parametro_medidos_auricular_implantado (solicitud_paciente_id, umbral_captura, impedancia, duracion, modo_estimulacion) VALUES (?, ?, ?, ?, ?)',
                [solicitud_paciente_id, umbral_captura, impedancia, duracion, modo_estimulacion]);
            res.status(201).json({ message: "Mediciones auriculares guardadas" });
        } catch (e) { res.status(500).json({ error: e.message }); }
    },

    // --- 8. PARÁMETROS PROGRAMACIÓN AURICULAR ---
    async saveParametrosProgAur(req, res) {
        try {
            const { solicitud_paciente_id, amplitud_a, fc_minima } = req.body;
            const [exist] = await db.query('SELECT id FROM parametro_programacion_auricular_implantado WHERE solicitud_paciente_id = ?', [solicitud_paciente_id]);

            if (exist.length > 0) {
                await db.query('UPDATE parametro_programacion_auricular_implantado SET amplitud_a = ?, fc_minima = ? WHERE solicitud_paciente_id = ?',
                    [amplitud_a, fc_minima, solicitud_paciente_id]);
                return res.json({ message: "Programación auricular actualizada" });
            }

            await db.query('INSERT INTO parametro_programacion_auricular_implantado (solicitud_paciente_id, amplitud_a, fc_minima) VALUES (?, ?, ?)',
                [solicitud_paciente_id, amplitud_a, fc_minima]);
            res.status(201).json({ message: "Programación auricular guardada" });
        } catch (e) { res.status(500).json({ error: e.message }); }
    },

    // --- GET COMPLETO ---
    async getTodoPorSolicitud(req, res) {
        const { id } = req.params;
        try {
            const queries = [
                db.query('SELECT * FROM generador_implantado WHERE solicitud_paciente_id = ?', [id]),
                db.query('SELECT * FROM electrodo_verticular_implantado WHERE solicitud_paciente_id = ?', [id]),
                db.query('SELECT * FROM electrodo_auricular_implantado WHERE solicitud_paciente_id = ?', [id]),
                db.query('SELECT * FROM modo_estimulacion_implantado WHERE solicitud_paciente_id = ?', [id]),
                db.query('SELECT * FROM parametro_medidos_ventricular_implantado WHERE solicitud_paciente_id = ?', [id]),
                db.query('SELECT * FROM parametro_programacion_ventricular_implantado WHERE solicitud_paciente_id = ?', [id]),
                db.query('SELECT * FROM parametro_medidos_auricular_implantado WHERE solicitud_paciente_id = ?', [id]),
                db.query('SELECT * FROM parametro_programacion_auricular_implantado WHERE solicitud_paciente_id = ?', [id])
            ];

            const results = await Promise.all(queries);

            res.json({
                generador: results[0][0][0] || null,
                electrodoVentricular: results[1][0][0] || null,
                electrodoAuricular: results[2][0][0] || null,
                modoEstimulacion: results[3][0][0] || null,
                medidosVentricular: results[4][0][0] || null,
                progVentricular: results[5][0][0] || null,
                medidosAuricular: results[6][0][0] || null,
                progAuricular: results[7][0][0] || null
            });
        } catch (e) { res.status(500).json({ error: e.message }); }
    }
};

module.exports = ImplantacionController;