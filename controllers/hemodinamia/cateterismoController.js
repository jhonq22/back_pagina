const db = require('../../config/db');

// Guardar o Actualizar Cateterismo Diagnóstico (Maestro - Detalle)
const saveCateterismo = async (req, res) => {
    const {
        solicitud_paciente_id, 
        dominancia_id, 
        descripcion,
        complicaciones_procedimiento, // <-- Nuevo campo extraído
        complicaciones_acceso,        // <-- Nuevo campo extraído
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

        if (exist.length > 0) {
            // 2. Si existe, hacemos UPDATE del maestro
            cateterismoId = exist[0].id;
            
            await db.query(
                `UPDATE cateterismo_diagnostico_hemodinamia SET 
                    dominancia_id = ?, 
                    descripcion = ?, 
                    complicaciones_procedimiento = ?, 
                    complicaciones_acceso = ?, 
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [
                    dominancia_id || null, 
                    descripcion || null, 
                    complicaciones_procedimiento || null, // <-- Nuevo valor
                    complicaciones_acceso || null,        // <-- Nuevo valor
                    cateterismoId
                ]
            );

            // 3. Limpiamos el detalle anterior para insertar el nuevo limpiamente
            await db.query(
                'DELETE FROM cateterismo_detalle_arterias WHERE cateterismo_id = ?', 
                [cateterismoId]
            );

        } else {
            // 4. Si no existe, hacemos INSERT del maestro
            const [result] = await db.query(
                `INSERT INTO cateterismo_diagnostico_hemodinamia 
                (solicitud_paciente_id, dominancia_id, descripcion, complicaciones_procedimiento, complicaciones_acceso) 
                VALUES (?, ?, ?, ?, ?)`, // <-- Se agregaron dos ? adicionales
                [
                    solicitud_paciente_id, 
                    dominancia_id || null, 
                    descripcion || null,
                    complicaciones_procedimiento || null, // <-- Nuevo valor
                    complicaciones_acceso || null         // <-- Nuevo valor
                ]
            );
            
            cateterismoId = result.insertId; 
        }

        // 5. Insertamos el detalle (Las arterias evaluadas)
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

module.exports = { saveCateterismo, getCateterismoBySolicitud };