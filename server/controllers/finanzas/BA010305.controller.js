const oracledb = require('oracledb');
const dbParams = require('../../database');
const xmlParser = require('../../xml-parser');
const Client = require('ftp');
const fs = require('fs');
const ftpAccess = require('../../ftp-access');

const responseParams = {
    outFormat: oracledb.OBJECT
};

const ba010305Controller = {
    ComboPeriodos: (req, res) => {
        const { empresa } = req.params;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                console.error(err);
                return;
            }
            const query = "select co_periodo value,de_periodo text from table(pack_new_maestros.f_list_combo_periodos(:empresa))";
            const params = {
                empresa: { val: empresa }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    console.error(error);
                    conn.close();
                    return;
                }
                res.set('Content-Type', 'text/xml');
                res.send(xmlParser.renderCombo(result.rows));
            });
        });
    },
    ListaPlanillas: (req, res) => {
        const { empresa, cobrador, periodo } = req.params;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                console.error(err);
                return;
            }
            const query = "select co_planilla_cobranza,co_caja,to_char(fe_creacion_planilla,'yyyy-mm-dd') fe_creacion_planilla,to_char(fe_cierre,'yyyy-mm-dd') fe_cierre,co_moneda,de_moneda,co_tipo_docu_administr,de_tipo_doc_admin,im_tarjeta,im_total,im_valores,im_deposito_total,im_diferencia,st_conciliado,st_liquidado,st_recibo,co_periodo,to_char(fe_aprobacion_cierre,'yyyy-mm-dd') fe_aprobacion_cierre,es_vigencia from table(pack_new_finanzas_no_tocar.f_list_plan_cobranza_cobr_per(:empresa,:cobrador,:periodo))";
            const params = {
                empresa: { val: empresa },
                cobrador: { val: cobrador },
                periodo: { val: periodo }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    console.error(error);
                    conn.close();
                    return;
                }
                res.set('Content-Type', 'text/xml');
                res.send(xmlParser.renderXml(result.rows));
            });
        });
    },
    Grafico12: (req, res) => {
        const { empresa, cobrador, periodo } = req.body;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "select co_tipo_doc_administr codigo,de_tipo_doc_administr tipo,num_primero importe,num_segundo deposito from table(pack_new_finanzas_no_tocar.f_grafico_planillas_1(:empresa,:cobrador,:periodo))";
            const params = {
                empresa: { val: empresa },
                cobrador: { val: cobrador },
                periodo: { val: periodo }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                res.json({
                    state: 'success',
                    data: {
                        grafico: result.rows
                    }
                });
            });
        });
    },
    Grafico3: (req, res) => {
        const { empresa, cobrador, periodo } = req.body;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "select co_tipo_doc_administr codigo,de_tipo_doc_administr tipo,num_primero conciliadas,num_segundo planillas from table(pack_new_finanzas_no_tocar.f_grafico_planillas_2(:empresa,:cobrador,:periodo))";
            const params = {
                empresa: { val: empresa },
                cobrador: { val: cobrador },
                periodo: { val: periodo }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                res.json({
                    state: 'success',
                    data: {
                        grafico: result.rows
                    }
                });
            });
        });
    },
    BuscaPlanillaVigente: (req, res) => {
        const { empresa, vendedor } = req.body;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "call pack_new_cobranzas.sp_planilla_vigente(:p_empresa,:p_vendedor,:o_resultado,:o_planilla,:o_serie,:o_moneda,:o_periodo,:o_tipo_docu_administr,:o_total,:o_deposito_total,:o_fecreacion,:o_fecierre,:o_caja,:o_nmoneda)";
            const params = {
                p_empresa: { val: empresa },
                p_vendedor: { val: vendedor },
                o_resultado: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
                o_planilla: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
                o_serie: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                o_moneda: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                o_periodo: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                o_tipo_docu_administr: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
                o_total: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                o_deposito_total: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                o_fecreacion: { dir: oracledb.BIND_OUT, type: oracledb.DATE },
                o_fecierre: { dir: oracledb.BIND_OUT, type: oracledb.DATE },
                o_caja: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                o_nmoneda: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                const { o_resultado, o_planilla, o_serie, o_moneda, o_periodo, o_tipo_docu_administr, o_total, o_deposito_total, o_fecreacion, o_fecierre, o_caja, o_nmoneda } = result.outBinds;
                //o_resultado
                res.json({
                    state: 'success',
                    data: {
                        resultado: o_resultado,
                        planilla: {
                            codigo: o_planilla,
                            serie: o_serie,
                            moneda: o_moneda,
                            periodo: o_periodo,
                            tpdoc: o_tipo_docu_administr,
                            importe: o_total,
                            deposito: o_deposito_total,
                            fcreacion: o_fecreacion,
                            fcierre: o_fecierre,
                            caja: o_caja,
                            nmoneda: o_nmoneda
                        }
                    }
                });
            });
        });
    },
    CargarListaMonedas: (req, res) => {
        const { empresa, vendedor } = req.params;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "select co_moneda value, de_nombre || ' - ' || de_abreviatura text from table(pack_new_cobranzas.f_monedas_recaudador(:p_empresa,:p_recaudador))";
            const params = {
                p_empresa: { val: empresa },
                p_recaudador: { val: vendedor }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                res.set('Content-Type', 'text/xml');
                res.send(xmlParser.renderCombo(result.rows));
            });
        });
    },
    CrearPlanillaCobranza: (req, res) => {
        const { empresa, vendedor, moneda, docadmin, ptoventa, cerrada, covariable } = req.body;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "call pack_new_cobranzas.sp_genera_planilla_wap(:p_empresa,:p_vendedor,:p_moneda,:p_docadmin,:p_ptoventa,:p_cerrada,:p_covariable,:o_resultado,:o_planilla)";
            const params = {
                p_empresa: { val: empresa },
                p_vendedor: { val: vendedor },
                p_moneda: { val: moneda },
                p_docadmin: { val: docadmin },
                p_ptoventa: { val: ptoventa },
                p_cerrada: { val: cerrada },
                p_covariable: { val: covariable },
                o_resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                o_planilla: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                const { o_resultado, o_planilla } = result.outBinds;
                res.json({
                    state: 'success',
                    data: {
                        resultado: o_resultado,
                        mensaje: o_planilla
                    }
                });
            });
        });
    },
    AbrirPlanillaCobranza: (req, res) => {
        const { planilla, cobrador, empresa } = req.body;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "call pack_new_cobranzas.sp_apertura_planilla(:p_empresa,:p_planilla,:p_vendedor)";
            const params = {
                p_empresa: { val: empresa },
                p_planilla: { val: planilla },
                p_vendedor: { val: cobrador }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                res.json({
                    state: 'success'
                });
            });
        });
    },
    CerrarPlanillaCobranza: (req, res) => {
        const { alias } = req.body;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "call pack_new_cobranzas.sp_cierra_planilla(:p_alias,:o_resultado,:o_mensaje)";
            const params = {
                p_alias: { val: alias },
                o_resultado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                o_mensaje: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                const { o_resultado, o_mensaje } = result.outBinds;
                res.json({
                    state: 'success',
                    data: {
                        resultado: o_resultado,
                        mensaje: o_mensaje
                    }
                });
            });
        });
    },
    ComboTiposCobro: (req, res) => {
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "select co_tipo_cobro \"value\",de_nombre \"text\" from ma_tipo_cobr_m where st_vista_abono = 'S' order by co_tipo_cobro asc";
            const params = {};
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                res.json({
                    options: result.rows
                });
            });
        });
    },
    ListaDocumentosPagoCliente: (req, res) => {
        const { empresa, ruc } = req.params;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "select co_documento,im_saldo,to_char(fec_venc,'yyyy-mm-dd'),nu_unico,st_letra,de_estadoletra,st_recaudo from table(pack_new_creditos_planilla.f_list_cta_cte(:p_empresa,:p_ruc))";
            const params = {
                p_empresa: { val: empresa },
                p_ruc: { val: ruc }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                res.set('Content-Type', 'text/xml');
                res.send(xmlParser.renderXml(result.rows));
            });
        });
    },
    ComboBancos: (req, res) => {
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "select ta.co_banco \"value\",ta.de_nombre \"text\" from ba_banc_m ta join ma_pais_m tb on ta.co_pais = tb.co_pais where ta.es_vigencia = 'Vigente'";
            const params = {};
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                res.json({
                    options: result.rows
                });
            });
        });
    },
    RegistraPagoPlanilla: (req, res) => {
        const { vendedor, empresa, tipo, documento, importe, banco, serieret, nrodoc, regfecha } = req.body;
        const numero = (nrodoc == '') ? '0' : nrodoc;
        const serie = (serieret == '') ? '0' : serieret;
        const ls_data = 'x@' + documento + '@' + importe + '@' + tipo + '@' + banco + '@' + serie + '@' + regfecha + '@' + numero + '@177';
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = tipo != 1 ? "call pack_new_cobranzas.sp_reg_pago_planilla(:p_vendedor,:p_empresa,:p_cadena)" : "call pack_new_cobranzas.sp_reg_pago_planilla_efectivo(:p_vendedor,:p_empresa,:p_documento,:p_importe,:p_tpcobro)";
            const params = tipo != 1 ? {
                p_vendedor: { val: vendedor },
                p_empresa: { val: empresa },
                p_cadena: { val: ls_data }
            } : {
                p_vendedor: { val: vendedor },
                p_empresa: { val: empresa },
                p_documento: { val: documento },
                p_importe: { val: importe },
                p_tpcobro: { val: tipo }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                return res.json({
                    state: 'success'
                });
            });
        });
    },
    ComboPlanillas: (req, res) => {
        const { vendedor, empresa } = req.params;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "select co_planilla_cobranza \"value\", co_planilla_cobranza || ' [' || es_vigencia || ']' \"text\" from ba_plan_cobr_t where co_recaudador = :p_usuario and st_liquidado = 'N' and st_recibo = 'N' and co_empresa = :p_empresa and (im_total > 0 or es_vigencia = 'Vigente') order by es_vigencia desc,co_planilla_cobranza asc";
            const params = {
                p_usuario: { val: vendedor },
                p_empresa: { val: empresa }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                res.json({
                    options: result.rows
                });
            });
        });
    },
    ComboCuentasBancarias: (req, res) => {
        const { banco, empresa, moneda } = req.body;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "select tb.co_cuenta_corriente as \"value\",ta.de_abreviatura || ' - ' || tb.co_cuenta_corriente as \"text\" from ba_banc_m ta join ba_cuen_banc_c tb on ta.co_banco = tb.co_banco join ma_mone_m tc on tb.co_moneda = tc.co_moneda where tb.st_publico = 'S' and tb.co_banco = :p_banco and tb.co_empresa = :p_empresa and tb.co_moneda = :p_moneda order by \"value\" desc";
            const params = {
                p_banco: { val: banco },
                p_empresa: { val: empresa },
                p_moneda: { val: moneda }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                res.json({
                    state: 'success',
                    data: result.rows
                });
            });
        });
    },
    GuardarDeposito: (req, res) => {
        const { vendedor, empresa, planilla, banco, cuenta, fecha, operacion, importe, base64, name } = req.body;
        const vFecha = fecha.split('-');
        const fecha2 = vFecha[2] + '/' + vFecha[1] + '/' + vFecha[0];
        const ls_data = '-@' + operacion + '@' + cuenta + '@' + importe + '@' + fecha2 + '@' + 153 + '@' + planilla;
        const periodo = vFecha[0] + '' + vFecha[1];
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "call pack_new_cobranzas.sp_reg_deposito_planilla(:p_vendedor,:p_empresa,:p_cadena)";
            const params = {
                p_vendedor: { val: vendedor },
                p_empresa: { val: empresa },
                p_cadena: { val: ls_data }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                //sube la imagen
                if(base64 != undefined) {
                    const vFile = base64.split(',');
                    //guarda en la bd prro!
                    const localPath = './tmp/' + name;
                    const remotePath = '/publico/document/11/BANCOS/' + cuenta + '/' + periodo;
                    const remoteFilename = operacion + '.' + name.split('.')[1].toUpperCase();
                    fs.writeFile(localPath, vFile[1], 'base64', function(err) {
                        const c = new Client();
                        c.on('ready', function() {
                            c.mkdir(remotePath, (error) => {
                                //if(error) throw(error);
                                c.put(localPath, remotePath + '/' + remoteFilename, function(putError) {
                                    c.end();
                                    res.json({
                                        state: 'success',
                                        message: 'Depósito almacenado'
                                    });
                                });
                            });
                        });
                        c.connect(ftpAccess);
                    });
                }
                else res.json({
                    state: 'success',
                    data: 'Depósito registrado'
                });
            });
        });
    },
    EliminarPago: (req, res) => {
        const { vendedor, empresa, documento, tpcobro } = req.body;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                res.json({
                    state: 'error',
                    message: err
                });
                return;
            }
            const query = "call pack_new_cobranzas.sp_elimina_cobranza(:p_vendedor,:p_empresa,:p_documento,:p_tipocobro)";
            const params = {
                p_vendedor: { val: vendedor },
                p_empresa: { val: empresa },
                p_documento: { val: documento },
                p_tipocobro: { val: tpcobro }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    res.json({
                        state: 'error',
                        message: error
                    });
                    conn.close();
                    return;
                }
                res.json({
                    state: 'success',
                    data: 'Cobranza eliminada'
                });
            });
        });
    },
    ListaDepositos: (req, res) => {
        const { vendedor, empresa, periodo } = req.params;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                console.error(err);
                return;
            }
            const query = "select * from table(pack_new_finanzas_no_tocar.f_list_depositos(:p_vendedor,:p_empresa,:p_periodo))";
            const params = {
                p_vendedor: { val: vendedor },
                p_empresa: { val: empresa },
                p_periodo: { val: periodo }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    console.error(error);
                    conn.close();
                    return;
                }
                res.set('Content-Type', 'text/xml');
                res.send(xmlParser.renderXml(result.rows));
            });
        });
    },
    GraficoDepositos: (req, res) => {
        const { vendedor, empresa, periodo } = req.body;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                console.error(err);
                return;
            }
            const query = "select sum(im_total - im_deposito_total) \"nodepo\",sum(im_deposito_total) \"deposito\" from ba_plan_cobr_t where co_empresa = :p_empresa and co_recaudador = :p_vendedor and co_periodo = :p_periodo";
            const params = {
                p_vendedor: { val: vendedor },
                p_empresa: { val: empresa },
                p_periodo: { val: periodo }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    conn.close();
                    res.send({
                        state: 'error',
                        message: error
                    });
                    return;
                }
                res.json({
                    state: 'success',
                    data: result.rows[0]
                });
            });
        });
    },
    ListaDepositosConciliacion: (req, res) => {
        const { empresa, planilla } = req.params;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                console.error(err);
                return;
            }
            const query = "select 'ic-picture.svg',tb.de_abreviatura,ta.co_cuenta_corriente,ta.co_comprobante,ta.im_deposito,to_char(ta.fe_registro,'yyyy-mm-dd'),ta.co_transa_bancaria_tran id,td.es_conciliacion,case td.es_conciliacion when 'S' then to_char(td.fe_conciliacion,'yyyy-mm-dd') else '-' end,td.co_extracto_bancario,td.co_documento,td.de_descripcion from ba_depo_plan_cobr_m ta join ba_banc_m tb on ta.co_banco = tb.co_banco join ba_tran_banc_d td on ta.co_empresa= td.co_empresa and ta.co_transa_bancaria_tran= td.co_transa_bancaria_tran where ta.co_planilla_cobranza = :p_planilla and ta.co_empresa = :p_empresa and td.es_conciliacion = 'N'";
            const params = {
                p_empresa: { val: empresa },
                p_planilla: { val: planilla }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    console.error(error);
                    conn.close();
                    return;
                }
                res.set('Content-Type', 'text/xml');
                res.send(xmlParser.renderXml(result.rows));
            });
        });
    },
    ListaExtractosConciliacion: (req, res) => {
        return new Promise(async (resolve, reject) => {
            const { cuenta, transaccion } = req.params;
            let conn;
            try {
                conn = await oracledb.getConnection(dbParams);
                //ejecuta el sp_marcar_coincidencias
                const QuerySugeridos = "call pack_bancos2do.sp_marcar_coincidencias(:p_transaccion)";
                const ParamsSugeridos = {
                    p_transaccion: { val: transaccion }
                };
                await conn.execute(QuerySugeridos, ParamsSugeridos, responseParams);
                //genera la data
                //const QueryExtractos = "select 'ic-select.svg^Seleccionar',co_extracto_bancario id,co_cuenta_corriente,to_char(fe_movimiento,'yyyy-mm-dd'),de_concepto,nu_operacion,im_abono,im_cargo,de_sucursal_banco,de_referencia,co_tipo_transaccion,to_char(fe_conciliado,'yyyy-mm-dd'),st_conciliado,co_clase_documento,st_sugerido,nu_documento from ba_extr_banc_t where co_cuenta_corriente = :p_cuenta and st_conciliado = 'N' and st_sugerido <> 'N' and fe_conciliado is null order by st_sugerido desc, im_cargo desc";
                const QueryExtractos = "select 'ic-select.svg^Seleccionar',co_extracto_bancario id,co_cuenta_corriente,to_char(fe_movimiento,'yyyy-mm-dd'),de_concepto,nu_operacion,im_abono,im_cargo,de_sucursal_banco,de_referencia,co_tipo_transaccion,to_char(fe_conciliado,'yyyy-mm-dd'),st_conciliado,co_clase_documento,st_sugerido,nu_documento from ba_extr_banc_t where co_cuenta_corriente = :p_cuenta and st_conciliado = 'N' and st_sugerido <> 'N' order by st_sugerido desc, im_cargo desc";
                const ParamsExtractos = {
                    p_cuenta: { val: cuenta }
                };
                const result = await conn.execute(QueryExtractos, ParamsExtractos, responseParams);
                res.set('Content-Type', 'text/xml');
                resolve(res.send(xmlParser.renderXml(result.rows)));
            }
            catch(error) {
                resolve(res.json({
                    state: 'error',
                    message: error
                }));
                return;
            }
        });
        /*const { cuenta, transaccion } = req.params;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                console.error(err);
                return;
            }
            const query = "select 'ic-select.svg^Seleccionar',co_extracto_bancario,co_cuenta_corriente,to_char(fe_movimiento,'yyyy-mm-dd'),de_concepto,nu_operacion,im_cargo,im_abono,de_sucursal_banco,de_referencia,co_tipo_transaccion,to_char(fe_conciliado,'yyyy-mm-dd'),st_conciliado,co_clase_documento,st_sugerido,nu_documento from ba_extr_banc_t where co_cuenta_corriente = :p_cuenta and st_conciliado = 'N' order by st_sugerido desc, im_cargo desc";
            const params = {
                p_cuenta: { val: cuenta }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    console.error(error);
                    conn.close();
                    return;
                }
                res.set('Content-Type', 'text/xml');
                res.send(xmlParser.renderXml(result.rows));
            });
        });*/
    },
    ConciliarDepositos: (req, res) => {
        return new Promise(async (resolve, reject) => {
            const { alias, lista } = req.body;
            const vLista = JSON.parse(lista);
            let conn;
            try {
                conn = await oracledb.getConnection(dbParams);
                //
                const querySesion = "call pack_venta.sm_activar_empresa(:p_alias)";
                const paramsSesion = { p_alias: { val: alias } };
                var result = await conn.execute(querySesion, paramsSesion, responseParams);
                //ejecutar los sp para conciliar
                const numberOfQuerys = vLista.length;
                for(var i = 0; i < numberOfQuerys; i++) {
                    const splista = vLista[i].split('@');
                    const iTransaccion = splista[0];
                    const iExtracto = splista[1];console.log('iTransaccion, iExtracto', iTransaccion, iExtracto);
                    var queryConcilia = "call pack_bancos2do.sp_marca_conciliado(:p_transaccion, :p_extracto)";
                    var paramsConcilia = {
                        p_transaccion: { val: iTransaccion },
                        p_extracto: { val: iExtracto }
                    };
                    await conn.execute(queryConcilia, paramsConcilia, responseParams);
                }
                await conn.close();
                resolve(res.json({
                    state: 'success'
                }));
            }
            catch(error) {
                if(conn) {
                    try {
                        await conn.close();
                    }
                    catch (err) {
                        reject(res.json({
                            state: 'error',
                            message: err
                        }));
                    }
                }
                reject(res.json({
                    state: 'error',
                    message: error
                }));
            }
        });
    },
    ComboSeries: (req, res) => {
        const { empresa } = req.params;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                console.error(err);
                return;
            }
            const query = "select co_serie value, de_serie || ' [' || nu_cantidad || ']' text from co_seri_nvo where co_empresa = :p_empresa and co_tipo_doc_administr = 623 and es_vigencia = 'Vigente'";
            const params = {
                p_empresa: { val: empresa }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    console.error(error);
                    conn.close();
                    return;
                }
                res.set('Content-Type', 'text/xml');
                res.send(xmlParser.renderCombo(result.rows));
            });
        });
    },
    GeneraRecibo: async (req, res) => {
        return new Promise(async (resolve, reject) => {
            const { serie, concepto, recaudador, detalle, cantidad, alias } = req.body;
            let conn;
            try {
                conn = await oracledb.getConnection(dbParams);
                //ejecuta el activar empresa
                const QuerySesion = "call pack_venta.sm_activar_empresa(:p_alias)";
                const ParamsSesion = { p_alias: { val: alias } };
                await conn.execute(QuerySesion, ParamsSesion, responseParams);
                //genera el recibo
                const ls_cabecera = serie + '@*@' + recaudador + '@*@' + concepto;
                const QueryRecibo = "call pack_cobranza2.sp_gen_recibo_caja(:p_cabecera,:p_detalle,:p_cantidad,:o_resultado)";
                const ParamsRecibo = {
                    p_cabecera: { val: ls_cabecera },
                    p_detalle: { val: detalle },
                    p_cantidad: { val: cantidad },
                    o_resultado: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
                };
                const result = await conn.execute(QueryRecibo, ParamsRecibo, responseParams);
                const { o_resultado } = result.outBinds;
                await conn.close();
                resolve(res.json({
                    state: 'success',
                    data: {
                        recibo: o_resultado
                    }
                }));
            }
            catch(error) {
                reject(res.json({
                    state: 'error',
                    message: error
                }));
            }
        });
    },
    ListaRecibos: (req, res) => {
        const { empresa, recaudador, recibo } = req.params;
        oracledb.getConnection(dbParams, (err, conn) => {
            if(err) {
                console.error(err);
                return;
            }
            const query = "select '' idx,'' icon,t1.co_recibo_caja,to_char(t1.fe_sys,'yyyy-mm-dd'),t1.co_recaudador,ce_r.de_razon_social de_recaudador,t1.im_total_ingreso,t1.im_total_deposito,t1.im_total_recibido,t1.de_concepto,t1.co_usuario_reg,ce_u.de_razon_social de_usuario_reg from ba_reci_caja_c t1 inner join ma_cata_enti_m ce_r on t1.co_recaudador = ce_r.co_catalogo_entidad inner join ma_cata_enti_m ce_u on t1.co_usuario_reg = ce_u.co_catalogo_entidad where t1.co_empresa = :p_empresa and t1.co_recaudador = :p_recaudador";
            const params = {
                p_empresa: { val: empresa },
                p_recaudador: { val: recaudador }
            };
            conn.execute(query, params, responseParams, (error, result) => {
                if(error) {
                    console.error(error);
                    conn.close();
                    return;
                }
                res.set('Content-Type', 'text/xml');
                res.send(xmlParser.renderXml(result.rows));
            });
        });
    }
};

module.exports = ba010305Controller;