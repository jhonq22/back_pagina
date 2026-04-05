const db = require('../../config/db');

/**
 * Obtiene opciones de catálogo de hemodinamia filtradas por TIPO
 * Útil para cargar listas específicas como "INDUCCION_ISQUEMA"
 */
const lista_por_tipo = async (req, res) => {
    const { tipo } = req.params;

    if (!tipo) {
        return res.status(400).json({ message: "El tipo de catálogo es requerido" });
    }

    try {
        const [rows] = await db.query(
            `SELECT 
                nombre AS label, 
                id AS value 
             FROM catalogo_hemodinamia 
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

/**
 * Obtiene opciones de catálogo de hemodinamia filtradas por padre_id
 */
const lista_por_padre = async (req, res) => {
    const { padre_id } = req.params;

    try {
        // Si el padre_id viene como string "null", lo tratamos como NULL de SQL
        const query = padre_id === 'null' || !padre_id 
            ? 'SELECT nombre AS label, id AS value FROM catalogo_hemodinamia WHERE padre_id IS NULL AND estatus = 1 ORDER BY nombre ASC'
            : 'SELECT nombre AS label, id AS value FROM catalogo_hemodinamia WHERE padre_id = ? AND estatus = 1 ORDER BY nombre ASC';
        
        const params = padre_id === 'null' || !padre_id ? [] : [padre_id];

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Error en lista_por_padre (hemodinamia):", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    lista_por_tipo,
    lista_por_padre
};