const db = require('../../config/db');

const ReportesController = {
    /**
     * Obtiene la "Sábana" completa del paciente
     * Solución nativa en JS para evitar errores de JSON en MariaDB (XAMPP)
     */
  getSabanaPaciente: async (req, res) => {
        try {
            const { solicitud_id } = req.params;

            if (!solicitud_id) {
                return res.status(400).json({
                    success: false,
                    message: "El parámetro solicitud_id es requerido."
                });
            }

            // 0. SOLICITUD OPERACIÓN (NUEVO QUERY AGREGADO)
            const [solicitudOperacionResult] = await db.query(`
                SELECT 
                     
                    p.primer_nombre, p.primer_apellido, p.cedula, p.correo, p.telefono_celular, p.codificacion_buen_gobierno,
                    s.tipo_marca_paso_id,
                    s.estatus_solicitud_id,
                    s.observacion_general,
                    es.nombre_estatus AS estatus_nombre,
                    tp.tipo_operacion AS operacion,
                    cs.descripcion AS nombre_hospital,
                    rm.primerNombre AS medico_nombre,
                    rm.primerApellido AS medico_apellido,
                    DATE_FORMAT(s.fecha_operacion, '%e de %M de %Y') AS fecha_operacion,
                    DATE_FORMAT(s.fecha_cita, '%e de %M de %Y') AS fecha_solicitud
                FROM registrar_solicitud_pacientes s
                INNER JOIN pacientes p ON s.paciente_id = p.id
                LEFT JOIN estatus_solicitudes es ON s.estatus_solicitud_id = es.id
                LEFT JOIN lista_centro_salud cs ON s.centro_salud_id = cs.id
                LEFT JOIN tipo_operaciones tp ON s.tipo_operacion_id = tp.id
                LEFT JOIN registro_medicos rm ON s.medico_id = rm.id
                WHERE s.id = ? LIMIT 1
            `, [solicitud_id]);

            // 1. ENFERMEDAD ACTUAL (Monitoreo de peso y datos generales)
         // 1. ENFERMEDAD ACTUAL (Monitoreo de peso y datos generales)
            const [enfActualResult] = await db.query(`
                SELECT 
                    pea.ultimo_peso_kg AS peso_anterior,
                    pea.ultimo_peso_fecha AS fecha_anterior,
                    pea.peso_actual_kg AS peso_actual,
                    (pea.peso_actual_kg - pea.ultimo_peso_kg) AS diferencia,
                    pea.sintomas, 
                    pea.duracion, 
                    pea.ross, 
                    pea.nyha, 
                    pea.otra_sintomatologia, 
                    pea.retraso_pondoestatural,
                    pea.portador_cardiopatia_estructural,
                    pea.retraso_combo_id, -- <--- AÑADIDO
                    -- Nombres de catálogos
                    c_inicio_sint.nombre AS inicio_sintomatologia_nombre,
                    c_tipo_portador.nombre AS tipo_portador_nombre,
                    c_en_condicion.nombre AS en_condicion_nombre,
                    c_ic.nombre AS ic_nombre,
                    c_origen_t.nombre AS origen_torasico_nombre,
                    c_presentacion.nombre AS presentacion_nombre,
                    c_riesgos.nombre AS riesgos_nombre,
                    c_inicio.nombre AS inicio_nombre,
                    c_fin.nombre AS fin_nombre,
                    c_concomitante.nombre AS concomitante_nombre,
                    c_frec_sincope.nombre AS frecuencia_sincope_nombre,
                    c_aparicion.nombre AS aparicion_nombre,
                    c_frec_pre.nombre AS frecuencia_pre_sincope_nombre,
                    c_clase_funcional.nombre AS clase_funcional_nombre,
                    c_duracion.nombre AS duracion_nombre, -- <--- AÑADIDO
                    c_ross.nombre AS ross_nombre,         -- <--- AÑADIDO
                    c_nyha.nombre AS nyha_nombre          -- <--- AÑADIDO
                FROM paciente_enfermedad_actual pea
                LEFT JOIN enfermedad_actual_catalogos c_inicio_sint ON pea.inicio_sintomalogia_id = c_inicio_sint.id
                LEFT JOIN enfermedad_actual_catalogos c_tipo_portador ON pea.tipo_portador_id = c_tipo_portador.id
                LEFT JOIN enfermedad_actual_catalogos c_en_condicion ON pea.en_condiccion_id = c_en_condicion.id
                LEFT JOIN enfermedad_actual_catalogos c_ic ON pea.ic_id = c_ic.id
                LEFT JOIN enfermedad_actual_catalogos c_origen_t ON pea.origen_torasico_id = c_origen_t.id
                LEFT JOIN enfermedad_actual_catalogos c_presentacion ON pea.presentacion_id = c_presentacion.id
                LEFT JOIN enfermedad_actual_catalogos c_riesgos ON pea.riesgos_id = c_riesgos.id
                LEFT JOIN enfermedad_actual_catalogos c_inicio ON pea.inicio_id = c_inicio.id
                LEFT JOIN enfermedad_actual_catalogos c_fin ON pea.fin_id = c_fin.id
                LEFT JOIN enfermedad_actual_catalogos c_concomitante ON pea.concamitante_id = c_concomitante.id
                LEFT JOIN enfermedad_actual_catalogos c_frec_sincope ON pea.frecuencia_sincope_id = c_frec_sincope.id
                LEFT JOIN enfermedad_actual_catalogos c_aparicion ON pea.aparicion_id = c_aparicion.id
                LEFT JOIN enfermedad_actual_catalogos c_frec_pre ON pea.frecuencia_pre_sincope_id = c_frec_pre.id
                LEFT JOIN enfermedad_actual_catalogos c_clase_funcional ON pea.clase_funcional_id = c_clase_funcional.id
                LEFT JOIN enfermedad_actual_catalogos c_duracion ON pea.duracion = c_duracion.id -- <--- AÑADIDO
                LEFT JOIN enfermedad_actual_catalogos c_ross ON pea.ross = c_ross.id             -- <--- AÑADIDO
                LEFT JOIN enfermedad_actual_catalogos c_nyha ON pea.nyha = c_nyha.id             -- <--- AÑADIDO
                WHERE pea.solicitud_paciente_id = ? LIMIT 1
            `, [solicitud_id]);

            // 2. SIGNOS VITALES
            const [signosResult] = await db.query(`
                SELECT peso, talla, fc, fr, ta, so2 
                FROM paciente_examen_signos_vitales 
                WHERE solicitud_paciente_id = ? LIMIT 1
            `, [solicitud_id]);

            // 3. ANTECEDENTES
            const [antecedentesResult] = await db.query(`
                SELECT 
                    tipo AS grupo, 
                    hospitalizacion_personales_mayores, patologia_base, 
                    hospitalizacion_neonatal, habitos, quirurgico, familiares, 
                    neonatal_pan, neonatal_tan, neonatal_eg, otras
                FROM pacientes_antecedentes 
                WHERE solicitud_paciente_id = ? AND estatus = 1
            `, [solicitud_id]);

            // 4. DIAGNÓSTICO, CATEGORÍAS Y LABORATORIOS
            const [indicacionesResult] = await db.query(`
                SELECT 
                    i.id AS registro_id,
                    i.diagnostico,
                    f.descripcion AS frecuencia_cardiaca,
                    c.descripcion AS trastornos_conduccion,
                    fun.descripcion AS trastornos_funcionales,
                    o.descripcion AS trastornos_otros,
                    i.hb, i.gb, i.plaquetas, i.creatinina, i.urea, i.pt, i.ppt, i.glicemia
                FROM indicaciones_implante_nuevos i
                LEFT JOIN lista_relacionado_frecuencia_cardiaca f ON i.relacionado_frecuencia_cardiaca_id = f.id
                LEFT JOIN lista_relacionado_trastornos_conduccion c ON i.relacionado_trastornos_conduccion_id = c.id
                LEFT JOIN lista_relacionado_trastornos_funcionales fun ON i.relacionado_trastornos_funcionales_id = fun.id
                LEFT JOIN lista_relacionado_trastornos_otros o ON i.relacionado_trastornos_otros_id = o.id
                WHERE i.solicitud_paciente_id = ?
                ORDER BY i.id DESC LIMIT 1;
            `, [solicitud_id]);

            // 5. EXAMEN FÍSICO (NUEVA LÓGICA PARA INCLUIR SUB-OPCIONES)
            const [fisicoResult] = await db.query(`
                SELECT 
                    S.nombre AS seccion_nombre,
                    P.nombre AS parametro,
                    RES.padre_opcion_id,
                    COALESCE(O_RES.texto_opcion, RES.valor_texto) AS valor
                FROM paciente_examen_fisico RES
                INNER JOIN fisico_secciones S ON RES.seccion_id = S.id
                INNER JOIN fisico_parametros P ON RES.parametro_id = P.id
                LEFT JOIN fisico_opciones O_RES ON RES.opcion_id = O_RES.id
                WHERE RES.solicitud_paciente_id = ?
                ORDER BY S.orden ASC, P.orden ASC, RES.padre_opcion_id ASC
            `, [solicitud_id]);

            // Agrupamos el examen físico dinámicamente juntando padres con hijos
            const examenFisicoAgrupado = [];
            const mapSecciones = new Map();
            const mapParametros = new Map(); 

            fisicoResult.forEach(row => {
                // Si la sección no existe, la creamos
                if (!mapSecciones.has(row.seccion_nombre)) {
                    const nuevaSeccion = {
                        seccion: row.seccion_nombre,
                        parametros: []
                    };
                    mapSecciones.set(row.seccion_nombre, nuevaSeccion);
                    examenFisicoAgrupado.push(nuevaSeccion);
                }

                const seccionRef = mapSecciones.get(row.seccion_nombre);
                const paramKey = `${row.seccion_nombre}_${row.parametro}`; // Clave única por parámetro

                if (!row.padre_opcion_id) {
                    // Es una opción principal (Padre)
                    const paramObj = {
                        parametro: row.parametro,
                        valor: row.valor,
                        sub_valores: [] // Array para guardar a los hijos (Ej. Cronología del soplo)
                    };
                    mapParametros.set(paramKey, paramObj);
                    seccionRef.parametros.push(paramObj);
                } else {
                    // Es una sub-opción (Hijo)
                    if (mapParametros.has(paramKey)) {
                        // Lo metemos dentro de los sub_valores de su padre
                        mapParametros.get(paramKey).sub_valores.push(row.valor);
                    } else {
                        // Caso atípico: sub-opción sin padre registrado (Failsafe)
                        seccionRef.parametros.push({
                            parametro: row.parametro,
                            valor: row.valor
                        });
                    }
                }
            });

            // Formatear la salida para que se vea limpio en el FrontEnd: "VALOR PADRE (VALOR HIJO)"
            examenFisicoAgrupado.forEach(sec => {
                sec.parametros = sec.parametros.map(p => {
                    if (p.sub_valores && p.sub_valores.length > 0) {
                        return {
                            parametro: p.parametro,
                            valor: `${p.valor} (${p.sub_valores.join(', ')})`
                        };
                    }
                    return { parametro: p.parametro, valor: p.valor };
                });
            });

            // 6. PARACLÍNICOS (ECG, ECO, RX)
            const [ecgResult] = await db.query(`
                SELECT C.nombre_opcion AS ritmo, E.frecuencia_cardiaca AS fc, 
                       E.eje_qrs AS eje, E.descripcion_hallazgos AS hallazgos
                FROM paciente_paraclinico_ecg E 
                LEFT JOIN paraclinico_catalogos C ON E.ritmo_id = C.id
                WHERE E.solicitud_paciente_id = ? LIMIT 1
            `, [solicitud_id]);

            const [ecoResult] = await db.query(`
                SELECT CONCAT(fevi_simpson, '%') AS fevi, ddvi, 
                       IF(fop, 'SI', 'NO') AS fop, IF(vcsip, 'SI', 'NO') AS vcsip
                FROM paciente_paraclinico_eco 
                WHERE solicitud_paciente_id = ? LIMIT 1
            `, [solicitud_id]);

            const [rxResult] = await db.query(`
                SELECT ict, C.nombre_opcion AS flujo, 
                       crecimiento_cavidades AS cavidades, otros_hallazgos AS otros
                FROM paciente_paraclinico_rx R
                LEFT JOIN paraclinico_catalogos C ON R.flujo_pulmonar_id = C.id
                WHERE R.solicitud_paciente_id = ? LIMIT 1
            `, [solicitud_id]);

            // 7. CONSTRUCCIÓN DEL JSON FINAL
            const sabana_paciente_completa = {
                enfermedad_actual: {
                         solicitud_operacion: solicitudOperacionResult[0] || null, // <--- NUEVO OBJETO AÑADIDO AQUÍ
                    monitoreo_peso: enfActualResult[0] ? {
                        peso_anterior: enfActualResult[0].peso_anterior,
                        fecha_anterior: enfActualResult[0].fecha_anterior,
                        peso_actual: enfActualResult[0].peso_actual,
                        diferencia: enfActualResult[0].diferencia
                    } : null,
                    detalles: enfActualResult[0] || null
                },
                signos_vitales: signosResult[0] || null,
                antecedentes: antecedentesResult,
                indicaciones_laboratorios: indicacionesResult[0] || null, 
                examen_fisico: examenFisicoAgrupado,
                paraclinicos: {
                    ecg: ecgResult[0] || null,
                    eco: ecoResult[0] || null,
                    rx: rxResult[0] || null
                }
            };

            // Enviamos la respuesta limpia al frontend
            res.json({
                success: true,
                data: sabana_paciente_completa
            });

        } catch (error) {
            console.error("Error en ReportesController:", error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

getSabanaHemodinamia: async (req, res) => {
    try {
        const { solicitud_id } = req.params;

        if (!solicitud_id) {
            return res.status(400).json({
                success: false,
                message: "El parámetro solicitud_id es requerido."
            });
        }

        // 0. SOLICITUD OPERACIÓN
        const [solicitudOperacionResult] = await db.query(`
            SELECT 
                p.primer_nombre, p.primer_apellido, p.cedula, p.correo, p.telefono_celular, p.codificacion_buen_gobierno,
                s.tipo_marca_paso_id,
                s.estatus_solicitud_id,
                s.observacion_general,
                es.nombre_estatus AS estatus_nombre,
                tp.tipo_operacion AS operacion,
                cs.descripcion AS nombre_hospital,
                rm.primerNombre AS medico_nombre,
                rm.primerApellido AS medico_apellido,
                DATE_FORMAT(s.fecha_operacion, '%e de %M de %Y') AS fecha_operacion,
                DATE_FORMAT(s.fecha_cita, '%e de %M de %Y') AS fecha_solicitud
            FROM registrar_solicitud_pacientes s
            INNER JOIN pacientes p ON s.paciente_id = p.id
            LEFT JOIN estatus_solicitudes es ON s.estatus_solicitud_id = es.id
            LEFT JOIN lista_centro_salud cs ON s.centro_salud_id = cs.id
            LEFT JOIN tipo_operaciones tp ON s.tipo_operacion_id = tp.id
            LEFT JOIN registro_medicos rm ON s.medico_id = rm.id
            WHERE s.id = ? LIMIT 1
        `, [solicitud_id]);

        // 1. ENFERMEDAD ACTUAL
        const [enfActualResult] = await db.query(`
            SELECT 
                asintomatico_cardiovascular_hemodinamia, 
                angina_estable_esfuerzo_hemodinamia, 
                angina_hijo_hemodinamia_id, 
                scascest_hemodinamia, 
                scascest_hemodinamia_hijo_id, 
                disnea_esfuerzo_hemodinamia, 
                disnea_hijo_id, 
                sincope_hemodinamia, 
                scacest_texto
            FROM paciente_enfermedad_actual 
            WHERE solicitud_paciente_id = ? LIMIT 1
        `, [solicitud_id]);

        // 2. ANTECEDENTES PERSONALES Y HÁBITOS
        const [antecedentesResult] = await db.query(`
            SELECT 
                quirurgico, familiares,
                hta_hemodinamia, dislipidemia_hemodinamia, erc_hemodinamia, 
                erc_hemodinamia_hijo,
                neurologico_conservado_hc_hemodinamia, sincope_hemodinamia, 
                claudicacion_intermitente_hemodinamia, diabetes_mellitus_hemodinamia, 
                diabetes_mellitus_hemodinamia_hijo, tabaquismo_hemodinamia, 
                tabaquismo_hemodinamia_hijo, antecedentes_cardiopatia_isquemica_hemodinamia, 
                scasest_angina_inestable_hijo_hemodinamia, im_sin_elevacion_st_hijo_hemodinamia, 
                scacest_hijo_hemodinamia, alergia_yodo_hemodinamia, alergia_yodo_hemodinamia_hijo, 
                alergia_medicamentos_hemodinamia, alergia_medicamentos_hemodinamia_hijo, 
                otras_patologias_hemodinamia, otras_patologias_hemodinamia_hijo
            FROM pacientes_antecedentes 
            WHERE solicitud_paciente_id = ? LIMIT 1
        `, [solicitud_id]);

        // 3. EXAMEN FÍSICO, SIGNOS VITALES Y LABORATORIOS
        const [fisicoLabsResult] = await db.query(`
            SELECT 
                e.peso, e.talla, e.fc, e.fr, e.ta,
                e.ruidos_cardiacos_hemodinamia, e.soplos, 
                ca.nombre AS soplos_areas_id_hemodinamia, 
                ci.nombre AS soplos_intensidad_id_hemodinamia, 
                e.crepitantes,
                cp.nombre AS estado_pulso_id_hemodinamia, 
                e.vias_acceso_id_hemodinamia,
                e.hb_hemodinamia, e.hcto_hemodinamia, e.pqt_hemodinamia, e.leu_hemodinamia, 
                e.glicemia_hemodinamia, e.urea_hemodinamia, e.creatinina_hemodinamia, 
                e.hiv_hemodinamia, e.vdrl_hemodinamia, e.hepatitis_hemodinamia,
                e.ckmb_hemodinamia, e.cktot_hemodinamia, e.troponina_hemodinamia,
                e.pt_hemodinamia, e.ptt_hemodinamia, e.inr_hemodinamia
            FROM examen_fisico_hemodinamia e
            LEFT JOIN catalogo_hemodinamia ca ON e.soplos_areas_id_hemodinamia = ca.id
            LEFT JOIN catalogo_hemodinamia ci ON e.soplos_intensidad_id_hemodinamia = ci.id
            LEFT JOIN catalogo_hemodinamia cp ON e.estado_pulso_id_hemodinamia = cp.id
            WHERE e.solicitud_paciente_id = ? LIMIT 1
        `, [solicitud_id]);

        // 4. PARACLÍNICOS (ECG y RX)
        const [ecgResult] = await db.query(`
            SELECT C.nombre_opcion AS ritmo, E.frecuencia_cardiaca AS fc, 
                   E.eje_qrs AS eje, E.descripcion_hallazgos AS hallazgos
            FROM paciente_paraclinico_ecg E 
            LEFT JOIN paraclinico_catalogos C ON E.ritmo_id = C.id
            WHERE E.solicitud_paciente_id = ? LIMIT 1
        `, [solicitud_id]);

        const [rxResult] = await db.query(`
            SELECT ict, C.nombre_opcion AS flujo, 
                   crecimiento_cavidades AS cavidades, otros_hallazgos AS otros
            FROM paciente_paraclinico_rx R
            LEFT JOIN paraclinico_catalogos C ON R.flujo_pulmonar_id = C.id
            WHERE R.solicitud_paciente_id = ? LIMIT 1
        `, [solicitud_id]);

        // 5. PARACLÍNICOS (ECO)
        const [ecoResult] = await db.query(`
            SELECT 
                induccion_isquemia_tipo_id, frecuencia_cardiaca_maxima_estimada, 
                resultado_isquemia_id, resultado_viabilidad_id, territorio_isquemia_id, 
                territorio_viabilidad_id, estado_funcion_sistolica_id_hemodinamia, 
                funcion_sistolica_id_hemodinamia, funcion_diastolica_id_hemodinamia, 
                trastorno_contractilidad_json_hemodinamia, descripcion_eco_hemodinamia, 
                descripcion_eco_doppler_hemodinamia
            FROM paciente_paraclinico_eco 
            WHERE solicitud_paciente_id = ? LIMIT 1
        `, [solicitud_id]);

        // 6. INDICACIONES (NUEVA SECCIÓN AGREGADA)
        const [indicacionesResult] = await db.query(`
            SELECT 
                i.hb, i.gb, i.plaquetas, i.creatinina, i.urea, i.diagnostico, i.pt, i.ppt, i.glicemia,
                fc.descripcion AS frecuencia_cardiaca_label,
                tc.descripcion AS trastornos_conduccion_label,
                tf.descripcion AS trastornos_funcionales_label,
                to2.descripcion AS trastornos_otros_label,
                ci.descripcion AS cardiopatia_isquemica_label
            FROM indicaciones_implante_nuevos i
            LEFT JOIN lista_relacionado_frecuencia_cardiaca fc ON i.relacionado_frecuencia_cardiaca_id = fc.id
            LEFT JOIN lista_relacionado_trastornos_conduccion tc ON i.relacionado_trastornos_conduccion_id = tc.id
            LEFT JOIN lista_relacionado_trastornos_funcionales tf ON i.relacionado_trastornos_funcionales_id = tf.id
            LEFT JOIN lista_relacionado_trastornos_otros to2 ON i.relacionado_trastornos_otros_id = to2.id
            LEFT JOIN listado_cardiopatia_isquemica ci ON i.relacionado_cardiopatia_isquemica_id = ci.id
            WHERE i.solicitud_paciente_id = ? AND i.estatus = 1 LIMIT 1
        `, [solicitud_id]);

        // --- PARSEOS Y LIMPIEZA ---
        let trastornoContractilidad = {};
        if (ecoResult[0] && ecoResult[0].trastorno_contractilidad_json_hemodinamia) {
            try {
                trastornoContractilidad = typeof ecoResult[0].trastorno_contractilidad_json_hemodinamia === 'string' 
                    ? JSON.parse(ecoResult[0].trastorno_contractilidad_json_hemodinamia) 
                    : ecoResult[0].trastorno_contractilidad_json_hemodinamia;
            } catch (e) { console.error("Error parseando eco json", e); }
        }

        const fisicoData = fisicoLabsResult[0] || {};
        let viasAccesoParseadas = [];
        if (fisicoData.vias_acceso_id_hemodinamia) {
            try {
                viasAccesoParseadas = typeof fisicoData.vias_acceso_id_hemodinamia === 'string'
                    ? JSON.parse(fisicoData.vias_acceso_id_hemodinamia)
                    : fisicoData.vias_acceso_id_hemodinamia;
            } catch (e) { console.error("Error parseando vias", e); }
        }

        // 7. CONSTRUCCIÓN DEL JSON FINAL
        const sabana_hemodinamia_completa = {
            solicitud_operacion: solicitudOperacionResult[0] || null,
            enfermedad_actual: enfActualResult[0] || null,
            antecedentes: antecedentesResult[0] || null,
            examen_fisico_laboratorios: {
                signos_vitales: {
                    peso: fisicoData.peso,
                    talla: fisicoData.talla,
                    fc: fisicoData.fc,
                    fr: fisicoData.fr,
                    ta: fisicoData.ta
                },
                inspeccion_cardiovascular: {
                    ruidos_cardiacos: fisicoData.ruidos_cardiacos_hemodinamia,
                    soplos: fisicoData.soplos,
                    soplos_areas_id: fisicoData.soplos_areas_id_hemodinamia,
                    soplos_intensidad_id: fisicoData.soplos_intensidad_id_hemodinamia,
                    crepitantes: fisicoData.crepitantes
                },
                pulsos_arteriales: {
                    estado_pulso_id: fisicoData.estado_pulso_id_hemodinamia,
                    vias_acceso_id: viasAccesoParseadas
                },
                laboratorios: {
                    generales: {
                        hb: fisicoData.hb_hemodinamia,
                        hcto: fisicoData.hcto_hemodinamia,
                        pqt: fisicoData.pqt_hemodinamia,
                        leu: fisicoData.leu_hemodinamia,
                        glicemia: fisicoData.glicemia_hemodinamia,
                        urea: fisicoData.urea_hemodinamia,
                        creatinina: fisicoData.creatinina_hemodinamia
                    },
                    serologia: {
                        hiv: fisicoData.hiv_hemodinamia,
                        vdrl: fisicoData.vdrl_hemodinamia,
                        hepatitis: fisicoData.hepatitis_hemodinamia
                    },
                    perfil_isquemico: {
                        ckmb: fisicoData.ckmb_hemodinamia,
                        cktot: fisicoData.cktot_hemodinamia,
                        troponina: fisicoData.troponina_hemodinamia
                    },
                    perfil_coagulacion: {
                        pt: fisicoData.pt_hemodinamia,
                        ptt: fisicoData.ptt_hemodinamia,
                        inr: fisicoData.inr_hemodinamia
                    }
                }
            },
            paraclinicos: {
                ecg: ecgResult[0] || null,
                rx: rxResult[0] || null,
                eco: ecoResult[0] ? {
                    ...ecoResult[0],
                    trastorno_contractilidad_json_hemodinamia: trastornoContractilidad
                } : null
            },
            // NUEVA PROPIEDAD AGREGADA AQUÍ
            indicaciones: indicacionesResult[0] || null 
        };

        // Enviamos la respuesta al frontend
        res.json({
            success: true,
            data: sabana_hemodinamia_completa
        });

    } catch (error) {
        console.error("Error en ReportesController (Hemodinamia):", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
},



reporteCaterismo: async (req, res) => {
        try {
            // Aceptamos solicitudId o solicitud_id
            const solicitud_id = req.params.solicitud_id || req.params.solicitudId;

            if (!solicitud_id) {
                return res.status(400).json({
                    success: false,
                    message: "El parámetro solicitud_id es requerido."
                });
            }

            // 0. OBTENER DATOS DEL PACIENTE (Edad, Fecha de Nacimiento y Sexo/Género)
            const [pacienteResult] = await db.query(`
                SELECT 
                    p.edad, 
                    p.fecha_nacimiento, 
                    p.sexo AS genero
                FROM registrar_solicitud_pacientes s
                INNER JOIN pacientes p ON s.paciente_id = p.id
                WHERE s.id = ? LIMIT 1
            `, [solicitud_id]);

            const pacienteData = pacienteResult[0] || {};

            // 1. OBTENER EL MAESTRO DE CATETERISMO (Ajustado JOIN de dominancia)
            const [cateterismoResult] = await db.query(`
                SELECT 
                    c.*,
                    dom.descripcion AS dominancia, 
                    sug.nombre AS sugerencias,
                    comp.nombre AS complicacion_acceso_nombre
                FROM cateterismo_diagnostico_hemodinamia c
                LEFT JOIN lista_dominancia dom ON c.dominancia_id = dom.id 
                LEFT JOIN catalogo_hemodinamia sug ON c.sugerencia_diagnostico_id = sug.id
                LEFT JOIN catalogo_hemodinamia comp ON c.complicaciones_acceso = comp.id
                WHERE c.solicitud_paciente_id = ? AND c.estatus = 1 LIMIT 1
            `, [solicitud_id]);

            let cateterismoMaster = cateterismoResult[0] || null;
            let arteriasDetalle = [];

            // 2. SI EXISTE EL MAESTRO, BUSCAMOS SUS ARTERIAS (DETALLE)
            if (cateterismoMaster) {
                const [detalleResult] = await db.query(`
                    SELECT 
                        a.*,
                        cal.nombre AS calibre,
                        les.nombre AS tipo_lesion,
                        seg.nombre AS ubicacion,
                        tip.nombre AS tipo,
                        flu.nombre AS flujo_timi
                    FROM cateterismo_detalle_arterias a
                    LEFT JOIN catalogo_hemodinamia cal ON a.calibre_id = cal.id
                    LEFT JOIN catalogo_hemodinamia les ON a.lesion_id = les.id
                    LEFT JOIN catalogo_hemodinamia seg ON a.segmento_id = seg.id
                    LEFT JOIN catalogo_hemodinamia tip ON a.tipo_id = tip.id
                    LEFT JOIN catalogo_hemodinamia flu ON a.flujo_id = flu.id
                    WHERE a.cateterismo_id = ?
                `, [cateterismoMaster.id]);
                
                arteriasDetalle = detalleResult;

                // --- ADAPTACIONES PARA EL PDF ---
                cateterismoMaster.descripcion_texto = cateterismoMaster.descripcion;
                cateterismoMaster.conclusion = cateterismoMaster.conclusiones_otros || '';
                cateterismoMaster.complicacion = cateterismoMaster.complicacion_acceso_nombre || '';
            }

            // 3. OBTENER EXAMEN FÍSICO Y SIGNOS VITALES
            const [fisicoLabsResult] = await db.query(`
                SELECT 
                    e.peso, e.talla, e.fc, e.fr, e.ta
                FROM examen_fisico_hemodinamia e
                WHERE e.solicitud_paciente_id = ? LIMIT 1
            `, [solicitud_id]);

            const fisicoData = fisicoLabsResult[0] || {};

            // 4. CONSTRUCCIÓN DEL JSON FINAL ESTRUCTURADO
            const reporte_cateterismo_completo = {
                paciente: pacienteData, // <- Inyectamos los datos del paciente aquí
                cateterismo: cateterismoMaster ? {
                    ...cateterismoMaster,
                    arterias: arteriasDetalle
                } : null,

                examen_fisico_laboratorios: {
                    signos_vitales: {
                        peso: fisicoData.peso,
                        talla: fisicoData.talla,
                        fc: fisicoData.fc,
                        fr: fisicoData.fr,
                        ta: fisicoData.ta
                    }
                }
            };

            // Enviamos la respuesta al frontend
            res.json({
                success: true,
                data: reporte_cateterismo_completo
            });

        } catch (error) {
            console.error("Error en reporteCaterismo:", error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },







    /**
     * Obtiene el reporte de Marcapasos
     */
    getReporteMarcapasos: async (req, res) => {
        try {
            const { solicitud_id } = req.params;

            if (!solicitud_id) {
                return res.status(400).json({
                    success: false,
                    message: "El parámetro solicitud_id es requerido."
                });
            }

            // 1. IMPLANTACIONES (Generador y Electrodos)
            const [implantacionResult] = await db.query(`
                SELECT 
                    -- Generador
                    g.serial AS generador_serial, ma_g.marca AS generador_marca, mo_g.modelo AS generador_modelo,
                    -- Electrodo Ventricular
                    ev.serial AS electrodo_vent_serial, ma_ev.marca AS electrodo_vent_marca, mo_ev.modelo AS electrodo_vent_modelo, ev.medida AS electrodo_vent_medida, ev.nueva_medida AS electrodo_vent_nueva_medida,
                    -- Electrodo Auricular
                    ea.serial AS electrodo_aur_serial, ma_ea.marca AS electrodo_aur_marca, mo_ea.modelo AS electrodo_aur_modelo, ea.medida AS electrodo_aur_medida, ea.nueva_medida AS electrodo_aur_nueva_medida,
                    -- Modos y Parámetros
                    me.modo_estimulacion, me.r_modo,
                    pmv.umbral_captura AS vent_umbral, pmv.impedancia AS vent_impedancia, pmv.duracion AS vent_duracion,
                    ppv.amplitud_r AS vent_amplitud_r, ppv.fc_minima AS vent_fc_minima, ppv.voltios AS vent_voltios, ppv.tiempos AS vent_tiempos,
                    pma.umbral_captura AS aur_umbral, pma.impedancia AS aur_impedancia, pma.duracion AS aur_duracion,
                    ppa.amplitud_a AS aur_amplitud_a, ppa.fc_minima AS aur_fc_minima
                FROM generador_implantado g
                LEFT JOIN marcas ma_g ON g.marca_id = ma_g.id
                LEFT JOIN modelos mo_g ON g.modelo_id = mo_g.id
                LEFT JOIN electrodo_verticular_implantado ev ON g.solicitud_paciente_id = ev.solicitud_paciente_id
                LEFT JOIN marcas ma_ev ON ev.marca_id = ma_ev.id
                LEFT JOIN modelos mo_ev ON ev.modelo_id = mo_ev.id
                LEFT JOIN electrodo_auricular_implantado ea ON g.solicitud_paciente_id = ea.solicitud_paciente_id
                LEFT JOIN marcas ma_ea ON ea.marca_id = ma_ea.id
                LEFT JOIN modelos mo_ea ON ea.modelo_id = mo_ea.id
                LEFT JOIN modo_estimulacion_implantado me ON g.solicitud_paciente_id = me.solicitud_paciente_id
                LEFT JOIN parametro_medidos_ventricular_implantado pmv ON g.solicitud_paciente_id = pmv.solicitud_paciente_id
                LEFT JOIN parametro_programacion_ventricular_implantado ppv ON g.solicitud_paciente_id = ppv.solicitud_paciente_id
                LEFT JOIN parametro_medidos_auricular_implantado pma ON g.solicitud_paciente_id = pma.solicitud_paciente_id
                LEFT JOIN parametro_programacion_auricular_implantado ppa ON g.solicitud_paciente_id = ppa.solicitud_paciente_id
                WHERE g.solicitud_paciente_id = ? LIMIT 1;
            `, [solicitud_id]);

            // 2. TÉCNICA DE PROCEDIMIENTO
            const [tecnicaResult] = await db.query(`
                SELECT 
                    t.id AS tecnica_id, t.localizacion, tg.descripcion AS tecnica_anestesia, va.descripcion AS via_acceso, t.otro_via_acesso, bm.descripcion AS bolsillo_mcp,
                    GROUP_CONCAT(le_el.descripcion SEPARATOR ', ') AS electrodos_nombres,
                    le.descripcion AS lugar_estimulacion, t.otros_lugar_estimulacion, t.tamano_septum
                FROM tecnica_procedimiento_implantado t
                LEFT JOIN lista_general_tecnica_procedimiento tg ON t.general_id = tg.id
                LEFT JOIN lista_via_acesso_tecnica_procedimiento va ON t.via_acceso_id = va.id
                LEFT JOIN lista_bolsillo_mcp_tecnica_procedimiento bm ON t.bolsillo_mcp_id = bm.id
                LEFT JOIN lista_lugar_estimulacion_tecnica_procedimiento le ON t.lugar_estimulacion_id = le.id
                LEFT JOIN lista_colocacion_electrodos_tecnica_procedimiento le_el ON JSON_CONTAINS(t.colocacion_electrodos_id, CAST(le_el.id AS CHAR), '$')
                WHERE t.solicitud_paciente_id = ?
                GROUP BY t.id LIMIT 1;
            `, [solicitud_id]);

            // 3. COMPLICACIONES Y EGRESO
            const [complicacionesResult] = await db.query(`
                SELECT 
                    IF(ci.ninguna = 1, 'Sí', 'No') AS ninguna, IF(ci.hematoma = 1, 'Sí', 'No') AS hematoma, IF(ci.neumotorax = 1, 'Sí', 'No') AS neumotorax,
                    IF(ci.hemotorax = 1, 'Sí', 'No') AS hemotorax, IF(ci.fallecimiento = 1, 'Sí', 'No') AS fallecimiento, IF(ci.desplazamiento_electrodo = 1, 'Sí', 'No') AS desplazamiento_electrodo,
                    IF(ci.bloqueo_salida = 1, 'Sí', 'No') AS bloqueo_salida, IF(ci.lesion_plexo_braquial = 1, 'Sí', 'No') AS lesion_plexo_braquial, IF(ci.perforacion_cardiaca = 1, 'Sí', 'No') AS perforacion_cardiaca,
                    IF(ci.tvp = 1, 'Sí', 'No') AS tvp, IF(ci.sindrome_mcp = 1, 'Sí', 'No') AS sindrome_mcp, IF(ci.insuficiencia_tricuspidea_signif = 1, 'Sí', 'No') AS insuficiencia_tricuspidea_signif,
                    IF(ci.estimulacion_diafragmatica_reint = 1, 'Sí', 'No') AS estimulacion_diafragmatica_reint, IF(ci.otra = 1, 'Sí', 'No') AS otra, ci.otra_descripcion,
                    sv.fc_lpm AS frecuencia_cardiaca, sv.fr_rpm AS frecuencia_respiratoria, sv.ta_mmhg AS tension_arterial, sv.sato2_porcentaje AS saturacion_oxigeno, sv.temperatura_c AS temperatura,
                    IF(pr.plan_aposito_compresivo_48h = 1, 'Sí', 'No') AS plan_aposito_compresivo_48h, IF(pr.plan_radiografia_torax_control = 1, 'Sí', 'No') AS plan_radiografia_torax_control,
                    IF(pr.plan_inmovilizacion_parcial_ms_izq = 1, 'Sí', 'No') AS plan_inmovilizacion_parcial_ms_izq, IF(pr.plan_atb_cefalosporina_7dias = 1, 'Sí', 'No') AS plan_atb_cefalosporina_7dias,
                    IF(pr.plan_analgesico_aine_5dias = 1, 'Sí', 'No') AS plan_analgesico_aine_5dias, IF(pr.plan_ecg_control = 1, 'Sí', 'No') AS plan_ecg_control, IF(pr.plan_control_7dias = 1, 'Sí', 'No') AS plan_control_7dias
                FROM complicaciones_inmediatas ci
                LEFT JOIN registro_egreso_signos_vitales sv ON ci.solicitud_paciente_id = sv.solicitud_paciente_id
                LEFT JOIN registro_plan_recomendaciones pr ON ci.solicitud_paciente_id = pr.solicitud_paciente_id
                WHERE ci.solicitud_paciente_id = ? LIMIT 1;
            `, [solicitud_id]);

            // 4. CONSTRUCCIÓN DEL JSON FINAL
            const reporte_marcapasos_completo = {
                tecnica_procedimiento: tecnicaResult[0] || null,
                implantacion: implantacionResult[0] || null,
                complicaciones_y_egreso: complicacionesResult[0] || null
            };

            // Enviamos la respuesta
            res.json({
                success: true,
                data: reporte_marcapasos_completo
            });

        } catch (error) {
            console.error("Error al generar reporte de marcapasos:", error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },
/**
     * =========================================================
     * APIS PARA GRÁFICOS (DASHBOARD)
     * =========================================================
     */
getEstadisticasDashboard: async (req, res) => {
        try {
            const consultas = [
                // 1. Solicitudes por Estatus
                db.query(`
                    SELECT 
                        COALESCE(es.nombre_estatus, 'Sin Estatus') AS etiqueta, 
                        COUNT(rs.id) AS total 
                    FROM registrar_solicitud_pacientes rs
                    LEFT JOIN estatus_solicitudes es ON rs.estatus_solicitud_id = es.id
                    GROUP BY rs.estatus_solicitud_id, es.nombre_estatus
                `),

                // 2. Género (Mapeo: 2 = Mujer, 1 o NULL = Hombre)
                db.query(`
                    SELECT 
                        CASE 
                            WHEN p.sexo = '2' OR p.sexo = 2 THEN 'Mujer'
                            ELSE 'Hombre' -- Esto cubre el 1, el NULL, y campos vacíos
                        END AS etiqueta,
                        COUNT(rs.id) AS total 
                    FROM registrar_solicitud_pacientes rs
                    INNER JOIN pacientes p ON rs.paciente_id = p.id
                    GROUP BY etiqueta
                `),

                // 3. Distribución por Edades
                db.query(`
                    SELECT 
                        CASE
                            WHEN p.edad < 18 THEN 'Pediátrico'
                            WHEN p.edad BETWEEN 18 AND 60 THEN 'Adulto'
                            ELSE 'Adulto Mayor'
                        END AS etiqueta,
                        COUNT(rs.id) AS total
                    FROM registrar_solicitud_pacientes rs
                    INNER JOIN pacientes p ON rs.paciente_id = p.id
                    GROUP BY etiqueta
                `),

                // 4. ¿Requiere Marcapaso?
                db.query(`
                    SELECT 
                        IF(rs.tipo_operacion_id IN (1, 3), 'Con Marcapaso', 'Sin Marcapaso') AS etiqueta, 
                        COUNT(rs.id) AS total 
                    FROM registrar_solicitud_pacientes rs
                    GROUP BY etiqueta
                `),

                // 5. Histórico de registros (últimos 6 meses)
                db.query(`
                    SELECT 
                        DATE_FORMAT(rs.fecha_creacion, '%b %Y') AS etiqueta, 
                        COUNT(rs.id) AS total
                    FROM registrar_solicitud_pacientes rs
                    GROUP BY etiqueta
                    ORDER BY MAX(rs.fecha_creacion) ASC
                    LIMIT 6
                `)
            ];

            const [
                [estatusRows], [generoRows], [edadRows], [marcapasoRows], [mensualRows]
            ] = await Promise.all(consultas);

            const format = (rows) => ({
                labels: rows.map(r => r.etiqueta),
                series: rows.map(r => r.total)
            });

            res.json({
                success: true,
                data: {
                    porEstatus: format(estatusRows),
                    porGenero: format(generoRows),
                    porEdad: format(edadRows),
                    porMarcapaso: format(marcapasoRows),
                    tendenciaMensual: format(mensualRows)
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: error.message });
        }
    },


    /**
     * =========================================================
     * API PARA REPORTE GENERAL (MÓDULO V)
     * =========================================================
     * Filtros dinámicos: hospital, estado, rango de fechas y tipo de reporte
     */
getReporteGeneral: async (req, res) => {
    try {
        const { tipo_reporte, hospital_id, estado_id, fecha_inicio, fecha_fin } = req.query;

        if (!tipo_reporte) {
            return res.status(400).json({ success: false, message: "El parámetro tipo_reporte es requerido." });
        }

        let baseQuery = `
            SELECT 
                rs.id AS solicitud_id,
                p.cedula,
                CONCAT(p.primer_nombre, ' ', p.primer_apellido) AS nombre_paciente,
                p.edad,
                cs.descripcion AS nombre_hospital,
                e.estado,
                rs.fecha_creacion,
                rs.fecha_operacion,
                es.nombre_estatus,
                tp.tipo_operacion AS procedimiento,
                IF(rs.tipo_operacion_id IN (1, 3), 'Sí', 'No') AS es_marcapaso
            FROM registrar_solicitud_pacientes rs
            INNER JOIN pacientes p ON rs.paciente_id = p.id
            LEFT JOIN estatus_solicitudes es ON rs.estatus_solicitud_id = es.id
            LEFT JOIN tipo_operaciones tp ON rs.tipo_operacion_id = tp.id
            LEFT JOIN lista_centro_salud cs ON rs.centro_salud_id = cs.id
            LEFT JOIN estados e ON p.estado_id = e.id_estado
            WHERE 1=1
        `;
        
        const params = [];

        if (hospital_id) { 
            baseQuery += ` AND rs.centro_salud_id = ?`; 
            params.push(hospital_id); 
        }

        // --- CAMBIO APLICADO AQUÍ PARA MÚLTIPLES ESTADOS ---
        if (estado_id) { 
            const estadosArray = estado_id.split(','); // Convertimos "1,2" en ['1', '2']
            const placeholders = estadosArray.map(() => '?').join(','); // Creamos los placeholders "?, ?"
            
            baseQuery += ` AND p.estado_id IN (${placeholders})`; 
            params.push(...estadosArray); // Agregamos cada ID al arreglo de parámetros
        }
        // ---------------------------------------------------

        if (fecha_inicio && fecha_fin) {
            baseQuery += ` AND DATE(rs.fecha_creacion) BETWEEN ? AND ?`;
            params.push(fecha_inicio, fecha_fin);
        }

        switch(tipo_reporte) {
            case 'administrativo': baseQuery += ` AND rs.estatus_solicitud_id = 1`; break;
            case 'marcapasos': baseQuery += ` AND rs.tipo_operacion_id IN (1, 3) AND rs.estatus_solicitud_id = 3`; break;
            case 'intervenidos': baseQuery += ` AND rs.estatus_solicitud_id = 3`; break;
            case 'atendidos': baseQuery += ` AND rs.estatus_solicitud_id != 4`; break;
            case 'rechazados': baseQuery += ` AND rs.estatus_solicitud_id = 4`; break;
            default: return res.status(400).json({ success: false, message: "Tipo de reporte inválido." });
        }

        baseQuery += ` ORDER BY rs.fecha_creacion DESC`;
        const [resultados] = await db.query(baseQuery, params);

        res.json({ success: true, total: resultados.length, data: resultados });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
















};

module.exports = ReportesController;