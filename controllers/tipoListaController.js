const db = require('../config/db');

// 1. Obtener Estados
const getEstados = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT estado as label, id_estado as value FROM estados ORDER BY estado ASC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Obtener Municipios
const getMunicipiosByEstado = async (req, res) => {
    const { id_estado } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT municipio as label, id_municipio as value FROM municipios WHERE id_estado = ? ORDER BY municipio ASC',
            [id_estado]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Obtener Parroquias
const getParroquiasByMunicipio = async (req, res) => {
    const { id_municipio } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT parroquia as label, id_parroquia as value FROM parroquias WHERE id_municipio = ? ORDER BY parroquia ASC',
            [id_municipio]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Estatus de Solicitudes
const getEstatusSolicitudes = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT nombre_estatus as label, id as value FROM estatus_solicitudes WHERE estatus = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. Tipo de Operaciones
const getTipoOperaciones = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT tipo_operacion as label, id as value FROM tipo_operaciones WHERE estatus = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. Nivel de Estudios
const getNivelEstudios = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT estudio as label, id as value FROM nivel_estudios WHERE estatus = 1 ORDER BY id ASC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 7. Etnias Indígenas
const getEtniasIndigenas = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT etnia as label, id as value FROM etnia_indigenas WHERE estatus = 1 ORDER BY etnia ASC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 8. Obtener Países
const getPaises = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT nombre as label, id as value FROM paises ORDER BY nombre ASC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 9. Obtener Tipo de Marcapasos (NUEVO)
const getTiposMarcapasos = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT tipo as label, id as value FROM tipo_marca_pasos WHERE estatus = 1 ORDER BY tipo ASC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 10. Obtener Marcas por Tipo (NUEVO)
const getMarcasByTipo = async (req, res) => {
    const { id_tipo } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT marca as label, id as value FROM marcas WHERE tipo_marca_id = ? AND estatus = 1 ORDER BY marca ASC',
            [id_tipo]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 11. Obtener Modelos por Marca (NUEVO)
const getModelosByMarca = async (req, res) => {
    const { id_marca } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT modelo as label, id as value FROM modelos WHERE marca_id = ? AND estatus = 1 ORDER BY modelo ASC',
            [id_marca]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// 12. Obtener Relacionado Frecuencia Cardíaca
const getRelacionadoFrecuencia = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT descripcion as label, id as value FROM lista_relacionado_frecuencia_cardiaca WHERE estatus = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 13. Obtener Relacionado Trastornos Conducción
const getTrastornosConduccion = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT descripcion as label, id as value FROM lista_relacionado_trastornos_conduccion WHERE estatus = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getListadoCardiopatiaIsquemica = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT descripcion as label, id as value FROM listado_cardiopatia_isquemica WHERE estatus = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 14. Obtener Relacionado Trastornos Funcionales
const getTrastornosFuncionales = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT descripcion as label, id as value FROM lista_relacionado_trastornos_funcionales WHERE estatus = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 15. Obtener Relacionado Trastornos Otros
const getTrastornosOtros = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT descripcion as label, id as value FROM lista_relacionado_trastornos_otros WHERE estatus = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// ... (Tus métodos anteriores del 1 al 15 se mantienen igual)

// 16. Obtener Anestesia (General/Local/Sedación)
const getTecnicaGeneral = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT descripcion as label, id as value FROM lista_general_tecnica_procedimiento WHERE estatus = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 17. Obtener Vía de Acceso
const getViaAcceso = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT descripcion as label, id as value FROM lista_via_acesso_tecnica_procedimiento WHERE estatus = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 18. Obtener Bolsillo MCP
const getBolsilloMCP = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT descripcion as label, id as value FROM lista_bolsillo_mcp_tecnica_procedimiento WHERE estatus = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 19. Obtener Colocación de Electrodos
const getColocacionElectrodos = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT descripcion as label, id as value FROM lista_colocacion_electrodos_tecnica_procedimiento WHERE estatus = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 20. Obtener Lugar de Estimulación
const getLugarEstimulacion = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT descripcion as label, id as value FROM lista_lugar_estimulacion_tecnica_procedimiento WHERE estatus = 1'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 21. Obtener Estudio de Inducción Hemodinamia
const getListaInduccion = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, descripcion FROM lista_estudio_induccion_isquemia WHERE estatus = 1 ORDER BY descripcion ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 22. Obtener Dominancia
const getDominancia = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, descripcion FROM lista_dominancia WHERE estatus = 1 ORDER BY descripcion ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 23. Obtener Conclusiones Cateterismo
const getListaConclusiones = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, descripcion FROM lista_conclusiones_cateterismo WHERE estatus = 1 ORDER BY descripcion ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 24. Obtener Intervenciones Realizadas
const getListaIntervenciones = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, descripcion FROM lista_intervencion_realizada WHERE estatus = 1 ORDER BY descripcion ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// 26. Obtener Plan de Diagnóstico de Egreso
const getPlanDiagnosticoEgreso = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, descripcion FROM lista_plan_diagnostico_egreso WHERE estatus = 1 ORDER BY descripcion ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// 27. Obtener Tipo de Lista
const getCentrosSalud = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT descripcion as label, id as value FROM lista_centro_salud WHERE estatus = 1 ORDER BY descripcion ASC'
        );

        res.json(rows);
    } catch (error) {
        console.error("Error al obtener centros de salud:", error);
        res.status(500).json({
            error: 'Error al obtener la lista de centros de salud',
            details: error.message
        });
    }
};


// obtener lista de medicos
const getMedicos = async (req, res) => {
    try {
        // Utilizamos CONCAT para unir el nombre y el apellido con un espacio intermedio
        const sql = `
            SELECT 
                CONCAT(primerNombre, ' ', primerApellido) AS label, 
                id AS value 
            FROM registro_medicos 
            WHERE estatus = 1 
            ORDER BY primerNombre ASC
        `;

        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getEstados,
    getMunicipiosByEstado,
    getParroquiasByMunicipio,
    getEstatusSolicitudes,
    getTipoOperaciones,
    getNivelEstudios,
    getEtniasIndigenas,
    getPaises,
    getTiposMarcapasos,
    getMarcasByTipo,
    getModelosByMarca,
    getRelacionadoFrecuencia,
    getTrastornosConduccion,
    getTrastornosFuncionales,
    getTrastornosOtros,
    getTecnicaGeneral,
    getViaAcceso,
    getBolsilloMCP,
    getColocacionElectrodos,
    getLugarEstimulacion,
    getListaInduccion,
    getDominancia,
    getListaConclusiones,
    getListaIntervenciones,
    getPlanDiagnosticoEgreso,
    getCentrosSalud,
    getMedicos,
    getListadoCardiopatiaIsquemica
};