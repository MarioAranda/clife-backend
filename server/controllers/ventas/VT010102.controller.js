const oracledb = require('oracledb');
const dbParams = require('../../database');
const xmlParser = require('../../xml-parser');

const responseParams = {
    outFormat: oracledb.OBJECT
};

const vt010102Controller = {
    SaveCoutadata: async (req, res) => {
        let {empresa, usuario, codigo, mvenc, mvencm, mvenc30,mvenc60,mvenc90,mvsttn} = req.body;   //console.log(emp, codigo, nombre, descripcion, monto, estado);
            let conn = await oracledb.getConnection(dbParams);
            let query = "call PW_VT010102.SP_UPDATECUOTA_TNEGO(:xempresa,:xusuario,:codigo,:mvenc,:mvencm,:mvenc30,:mvenc60,:mvenc90,:mvsttn,:o_codigo,:o_mensaje)";
            let params = {
                xempresa: { val: empresa },
                xusuario: { val: usuario },
                codigo: { val: codigo },
                mvenc: { val: mvenc },
                mvencm: { val: mvencm },
                mvenc30: { val: mvenc30 },
                mvenc60: { val: mvenc60 },
                mvenc90 : {val: mvenc90 },
                mvsttn : { val : mvsttn },
                o_codigo: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                o_mensaje: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
            }
            conn.execute(query,params, responseParams, (error, result) => {console.log(error,result);
                let { o_codigo, o_mensaje } = result.outBinds;
                if (error) {
                    res.json({state: 'error', codsend: 0, txtsend: error});
                }else{
                    res.json({state: 'success', codsend: o_codigo, txtsend: o_mensaje });
                }
            });
    },
    FormCoutadata: (req, res) => {
        const  {emp,cod} = req.body; 
        oracledb.getConnection(dbParams, (err, conn) => {
            if (err) {
                res.send({state: 'error', error_conexion: err.stack});
                return;
            }
            const query = ' SELECT CTN.*,tn.de_nombre FROM VT_CUOT_TIPO_NEGO_D CTN LEFT JOIN vt_tipo_nego_m TN ON tn.co_tipo_negocio = CTN.CO_TIPO_NEGOCIO WHERE  CTN.CO_EMPRESA=:co_emp and  CTN.CO_TIPO_NEGOCIO=:co_tipo ';
            const params = {co_emp: emp,co_tipo:cod };
            conn.execute(query, params, responseParams, (error, result) => {
                if (error) {
                    res.send({'error_query': error.stack});
                    return;
                }
                res.set('Content-Type', 'application/json');
                res.send(result.rows); 
                conn.close();
            });
        });
    },
    GridTipoNegocio: (req, res) => {
         const {    } = req.params;
        oracledb.getConnection(dbParams, (err, conn) => {
            if (err) {
                res.send({ state: 'error', error_conexion: err.stack });
                return;
            }
            const query = "  SELECT VT_TIPO_NEGO_M.CO_TIPO_NEGOCIO AS CO_TIPO_NEGOCIO, VT_TIPO_NEGO_M.DE_NOMBRE AS DE_NOMBRE, VT_TIPO_NEGO_M.DE_DESCRIPCION AS DE_DESCRIPCION,VT_TIPO_NEGO_M.IM_TOPE_MINIMO  AS IM_TOPE_MINIMO, VT_TIPO_NEGO_M.ES_TIPO_NEGOCIO AS ES_TIPO_NEGOCIO,case ES_TIPO_NEGOCIO when 'Retirado' then '../none.png' else '../cuota_tn.png' end  AS CUOTA,case ES_TIPO_NEGOCIO when 'Retirado' then '../none.png' else '../ic-edit.png' end AS EDIT,case ES_TIPO_NEGOCIO when 'Retirado' then '../ic-add.png' else '../ic-delete.png' end AS BORRAR  FROM VT_TIPO_NEGO_M  where CO_TIPO_NEGOCIO <> 0  ORDER BY CO_TIPO_NEGOCIO  ";
            const params = {   };
            conn.execute(query, params, responseParams, (error, result) => {
                conn.close();
                if (error) {
                    res.send({ 'error_query': error.stack });
                    return;
                }
                res.set('Content-Type', 'text/xml');
                res.send(xmlParser.renderXml(result.rows));
              });
        });
    },
    Listadoestadotp: (req, res) => {
        oracledb.getConnection(dbParams, (err, conn) => {
            if (err) {
                res.send({ 'error_conexion': err.stack });
                return;
            }
            const query = " SELECT MA_ESTA_M.DE_NOMBRE  as LABEL,   MA_ESTA_M.DE_NOMBRE AS VALUE   FROM MA_ESTA_M     WHERE MA_ESTA_M.DE_TIPO_ESTADO = 'Clientes'    ";
            const params = {};
            conn.execute(query, params, responseParams, (error, result) => {
                if (error) {
                    res.send({ 'error_query': error.stack });
                    conn.close();
                    return;
                }
                res.set('Content-Type', 'text/xml');
                res.send(xmlParser.renderSelect(result.rows, 'Vigente'));
            });
        });
    },

    GuardarTipNego: async (req, res) => {
        let {usuario, codigo, nombre, descripcion, monto, estado} = req.body;   //console.log(emp, codigo, nombre, descripcion, monto, estado);
            let conn = await oracledb.getConnection(dbParams);
            let query = "call PW_VT010102.SP_UPDATE_TNEGO(:xusuario,:tn_codigo,:tn_nombre,:tn_descripcion,:tn_importe,:tn_estado,:o_codigo,:o_mensaje)";
            let params = {
                xusuario: { val: usuario },
                tn_codigo: { val: codigo },
                tn_nombre: { val: nombre },
                tn_descripcion: { val: descripcion },
                tn_importe: { val: monto },
                tn_estado: { val: estado },
                o_codigo: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                o_mensaje: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
            }
            conn.execute(query,params, responseParams, (error, result) => {console.log(error,result);
                let { o_codigo, o_mensaje } = result.outBinds;
               if (error) {
                    res.json({ state: 'error', codsend: 0, txtsend: error});
                }else{
                    res.json({ state: 'success', codsend: o_codigo, txtsend: o_mensaje   });
                }
            });
    }

};

module.exports = vt010102Controller;