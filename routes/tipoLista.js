const express = require('express');
const router = express.Router();
const tipoListaController = require('../controllers/tipoListaController');

// Ubicaciones y Geografía
router.get('/estados', tipoListaController.getEstados);
router.get('/municipios/:id_estado', tipoListaController.getMunicipiosByEstado);
router.get('/parroquias/:id_municipio', tipoListaController.getParroquiasByMunicipio);
router.get('/paises', tipoListaController.getPaises);

// Listas de Caracterización
router.get('/estatus-solicitudes', tipoListaController.getEstatusSolicitudes);
router.get('/tipo-operaciones', tipoListaController.getTipoOperaciones);
router.get('/nivel-estudios', tipoListaController.getNivelEstudios);
router.get('/etnias', tipoListaController.getEtniasIndigenas);

// Listas de Marcapasos (NUEVAS)
router.get('/marcapasos-tipos', tipoListaController.getTiposMarcapasos);
router.get('/marcapasos-marcas/:id_tipo', tipoListaController.getMarcasByTipo);
router.get('/marcapasos-modelos/:id_marca', tipoListaController.getModelosByMarca);

// Listas de Indicaciones Médicas
router.get('/indicaciones-frecuencia', tipoListaController.getRelacionadoFrecuencia);
router.get('/indicaciones-conduccion', tipoListaController.getTrastornosConduccion);
router.get('/indicaciones-funcionales', tipoListaController.getTrastornosFuncionales);
router.get('/indicaciones-otros', tipoListaController.getTrastornosOtros);
router.get('/listado-cardiopatia-isquemica', tipoListaController.getListadoCardiopatiaIsquemica); // Nueva


// Listas de Técnica de Procedimiento
router.get('/tecnica-general', tipoListaController.getTecnicaGeneral);
router.get('/via-acceso', tipoListaController.getViaAcceso);
router.get('/bolsillo-mcp', tipoListaController.getBolsilloMCP);
router.get('/colocacion-electrodos', tipoListaController.getColocacionElectrodos);
router.get('/lugar-estimulacion', tipoListaController.getLugarEstimulacion);

// Lista de Estudio de Inducción Hemodinamia
router.get('/lista-induccion-isquemia', tipoListaController.getListaInduccion);
router.get('/lista-dominancia', tipoListaController.getDominancia);

// Listas de Cateterismo Terapéutico
router.get('/lista-conclusiones-cateterismo', tipoListaController.getListaConclusiones);
router.get('/lista-intervencion-realizada', tipoListaController.getListaIntervenciones);

// Listas de Egreso Hemodinamia
router.get('/lista-diagnostico-egreso', tipoListaController.getPlanDiagnosticoEgreso);

// Listas de Centros de Salud Nueva
router.get('/lista-centros-salud', tipoListaController.getCentrosSalud);

// Listas de Medicos
router.get('/lista-medicos', tipoListaController.getMedicos);

module.exports = router;