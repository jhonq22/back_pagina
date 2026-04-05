// index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');


// Configuración de variables de entorno
dotenv.config();

// Importar rutas
const pacienteRoutes = require('./routes/pacienteRoutes');
const userRoutes = require('./routes/userRoutes');
const archivoRoutes = require('./routes/archivoRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const tipoListaRoutes = require('./routes/tipoLista');
const representanteRoutes = require('./routes/representanteRoutes');
const implantacionRoutes = require('./routes/implantacionRoutes');
const tecnicaRoutes = require('./routes/tecnicaRoutes');
const complicacionesRoutes = require('./routes/ComplicacionesImplantadasRoutes');
const indicacionesRoutes = require('./routes/indicacionesRoutes');
const AntecedentesHemodinamiaRoutes = require('./routes/hemodinamia/antecedentesPersonalesHabitosRoutes');
const cateterismoRoutes = require('./routes/hemodinamia/cateterismoRoutes');
const cateterismoTerapeuticoRoutes = require('./routes/hemodinamia/cateterismoTerapeuticoRoutes');
const egresoHemodinamiaRoutes = require('./routes/hemodinamia/egresoHemodinamiaRoutes');
const configuracionDiasRoutes = require('./routes/configuracion_citas/configuracionDiasRoutes');
const crudListaTipoRoutes = require('./routes/crud/CrudListaTipoRoutes');
const enfermedadAntecedentesRoutes = require('./routes/antecedentes/enfermedadAntecedentesRoutes');
const antecedentesRoutes = require('./routes/antecedentes/antecedentesRoutes');
const paraclinicosRoutes = require('./routes/antecedentes/paraclinicosRoutes');
const examenFisicoRoutes = require('./routes/antecedentes/examenFisicoRoutes');
const medicosRoutes = require('./routes/crud/medicosRoutes');
const reportesRoutes = require('./routes/reportes/reportesRoutes');
const hemodinamiaRoutes = require('./routes/antecedentes/hemodinamiaRoutes');
const sugerenciasRoutes = require('./routes/hemodinamia/sugerenciaRoutes');


//NO MIGRAR
const noticiasRoutes = require('./routes/intranet/noticiasRoutes');
const galeriaRoutes = require('./routes/intranet/galeriaRoutes');
const baseLegalesRoutes = require('./routes/intranet/baseLegalesRoutes');

const app = express();

// Middlewares
app.use(cors()); // Permite conexiones externas
app.use(express.json()); // Permite recibir JSON en el body

// Rutas
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/archivos', archivoRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/listas', tipoListaRoutes);
app.use('/api/representantes', representanteRoutes);
app.use('/api/implantacion', implantacionRoutes);
app.use('/api/tecnica', tecnicaRoutes);
app.use('/api/complicaciones', complicacionesRoutes);
app.use('/api/indicaciones', indicacionesRoutes);
app.use('/api/antecedentes-hemodinamia', AntecedentesHemodinamiaRoutes);
app.use('/api/cateterismo', cateterismoRoutes);
app.use('/api/sugerencias', sugerenciasRoutes);
app.use('/api/cateterismo-terapeutico', cateterismoTerapeuticoRoutes);
app.use('/api/egreso-hemodinamia', egresoHemodinamiaRoutes);
app.use('/api/configuracion-dias', configuracionDiasRoutes);
app.use('/api/crud-lista-tipo', crudListaTipoRoutes);
app.use('/api/antecedentes-enfermedad-actual', enfermedadAntecedentesRoutes);
app.use('/api/antecedentes', antecedentesRoutes);
app.use('/api/paraclinicos', paraclinicosRoutes);
app.use('/api/examen-fisico', examenFisicoRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/galeria', galeriaRoutes);
app.use('/api/base-legales', baseLegalesRoutes);
app.use('/api/hemodinamia', hemodinamiaRoutes);




//NO MIGRAR//
app.use('/api/noticias', noticiasRoutes);


// Ruta base de prueba
app.get('/', (req, res) => {
    res.send('API REST Salud funcionando correctamente');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});