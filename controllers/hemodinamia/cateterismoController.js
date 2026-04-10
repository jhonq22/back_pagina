const db = require('../../config/db');

// Guardar o Actualizar Cateterismo Diagnóstico (Maestro - Detalle)
const saveCateterismo = async (req, res) => {
    const {
        solicitud_paciente_id, 
        dominancia_id, 
        descripcion,
        complicaciones_procedimiento, // Se recibe como array para ser JSON
        complicaciones_acceso,        // Se recibe como INT
        conclusiones_id,
        conclusiones_otros,
        sugerencia_diagnostico_id,
        arterias 
    } = req.body;

    if (!solicitud_paciente_id) {
        return res.status(400).json({ message: "El solicitud_paciente_id es obligatorio" });
    }

    try {
        // 1. Verificar si ya existe la cabecera (Maestro)
        const [exist] = await db.query(
            'SELECT id FROM cateterismo_diagnostico_hemodinamia WHERE solicitud_paciente_id = ?',
            [solicitud_paciente_id]
        );

        let cateterismoId;

        // --- FORMATEO DE CAMPOS ---
        const conclusionesJson = conclusiones_id ? JSON.stringify(conclusiones_id) : null;
        // Se aplica stringify al MultiSelect
        const compProcedimientoJson = complicaciones_procedimiento ? JSON.stringify(complicaciones_procedimiento) : null;

        if (exist.length > 0) {
            // 2. Si existe, hacemos UPDATE del maestro
            cateterismoId = exist[0].id;
            
            await db.query(
                `UPDATE cateterismo_diagnostico_hemodinamia SET 
                    dominancia_id = ?, 
                    descripcion = ?, 
                    complicaciones_procedimiento = ?, 
                    complicaciones_acceso = ?, 
                    conclusiones_id = ?,
                    conclusiones_otros = ?,
                    sugerencia_diagnostico_id = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [
                    dominancia_id || null, 
                    descripcion || null, 
                    compProcedimientoJson,         // JSON stringified (MultiSelect)
                    complicaciones_acceso || null, // INT directo (Autocomplete)
                    conclusionesJson,
                    conclusiones_otros || null,
                    sugerencia_diagnostico_id || null,
                    cateterismoId
                ]
            );

            // 3. Limpiamos el detalle anterior
            await db.query(
                'DELETE FROM cateterismo_detalle_arterias WHERE cateterismo_id = ?', 
                [cateterismoId]
            );

        } else {
            // 4. Si no existe, hacemos INSERT del maestro
            const [result] = await db.query(
                `INSERT INTO cateterismo_diagnostico_hemodinamia 
                (solicitud_paciente_id, dominancia_id, descripcion, complicaciones_procedimiento, complicaciones_acceso, conclusiones_id, conclusiones_otros, sugerencia_diagnostico_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                [
                    solicitud_paciente_id, 
                    dominancia_id || null, 
                    descripcion || null,
                    compProcedimientoJson,         // JSON stringified (MultiSelect)
                    complicaciones_acceso || null, // INT directo (Autocomplete)
                    conclusionesJson,
                    conclusiones_otros || null,
                    sugerencia_diagnostico_id || null
                ]
            );
            
            cateterismoId = result.insertId; 
        }

        // 5. Insertamos el detalle (Arterias)
        if (arterias && arterias.length > 0) {
            const arteriasValues = arterias.map(a => [
                cateterismoId,
                a.arteria_nombre,
                a.calibre_id || null,
                a.lesion_id || null,
                a.segmento_id || null,
                a.tipo_id || null,
                a.flujo_id || null
            ]);

            await db.query(
                `INSERT INTO cateterismo_detalle_arterias 
                (cateterismo_id, arteria_nombre, calibre_id, lesion_id, segmento_id, tipo_id, flujo_id) 
                VALUES ?`,
                [arteriasValues]
            );
        }

        return res.status(200).json({ message: 'Cateterismo guardado con éxito' });
        
    } catch (error) {
        console.error("Error en saveCateterismo:", error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener Cateterismo Diagnóstico y sus Arterias
const getCateterismoBySolicitud = async (req, res) => {
    const { solicitudId } = req.params;
    
    try {
        // 1. Buscamos el maestro
        const [masterRows] = await db.query(
            'SELECT * FROM cateterismo_diagnostico_hemodinamia WHERE solicitud_paciente_id = ? AND estatus = 1',
            [solicitudId]
        );

        if (masterRows.length === 0) {
            return res.json(null);
        }

        const cateterismo = masterRows[0];

        // 2. Buscamos el detalle asociado al ID del maestro
        const [detailRows] = await db.query(
            'SELECT * FROM cateterismo_detalle_arterias WHERE cateterismo_id = ?',
            [cateterismo.id]
        );

        // 3. Adjuntamos las arterias al objeto de respuesta
        cateterismo.arterias = detailRows;

        res.json(cateterismo);
        
    } catch (error) {
        console.error("Error en getCateterismoBySolicitud:", error);
        res.status(500).json({ error: error.message });
    }
};



const activarTerapeutico = async (req, res) => {
    const { solicitudId } = req.params;
    
    try {
        const [rows] = await db.query(
            'SELECT sugerencia_diagnostico_id FROM cateterismo_diagnostico_hemodinamia WHERE solicitud_paciente_id = ? LIMIT 1',
            [solicitudId]
        );

        // Si no hay registro o la sugerencia no existe, es false
        if (rows.length === 0 || !rows[0].sugerencia_diagnostico_id) {
            return res.json(false);
        }

        const sugerenciaId = rows[0].sugerencia_diagnostico_id;

        // Si es 48 o 51, devuelve true, de lo contrario false
        if (sugerenciaId === 48 || sugerenciaId === 51) {
            return res.json(true);
        } else {
            return res.json(false);
        }
        
    } catch (error) {
        console.error("Error en activarTerapeutico:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { saveCateterismo, getCateterismoBySolicitud, activarTerapeutico };