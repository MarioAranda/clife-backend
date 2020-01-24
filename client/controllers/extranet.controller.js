const path = require('path');
const bcrypt = require('bcrypt');
const oracledb = require('oracledb');
const dbParams = require('../../server/database');

const responseParams = {
    outFormat: oracledb.OBJECT
};

const saltRounds = 4;
const CookieId = 'sess-cookie';
const UserExpo = {
    alias: 'VILLARAN',
    codigo: 7865928,
    empresa: 11
};

const extranetController = {
    home: (request, response) => {
        if (request.cookies[CookieId]) {
            let sesion = request.cookies[CookieId];
            response.render(path.resolve('client/views/extranet/home.ejs'), { sesion: JSON.stringify(JSON.parse(sesion)) });
        }
        else response.redirect('/extranet/login');
    },
    login: (request, response) => {
        response.render(path.resolve('client/views/extranet/login.ejs'), {});
    },
    logout: (request, response) => {
        response.clearCookie(CookieId, { httpOnly: true });
        response.redirect('/extranet/login');
    },
    NuevoUsuario: (request, response) => {
        response.render(path.resolve('client/views/extranet/nuevo-usuario.ejs'));
    },
    ConfirmarUsuario: (request, response) => {
        let email = request.cookies['rgmail'];
        const data = { email: email };
        response.clearCookie('rgmail', { httpOnly: true });
        response.render(path.resolve('client/views/extranet/confirmar-usuario.ejs'), data);
    },
    PruebaRegistro: (request, response) => {
        response.cookie('rgmail','mvelasquez@corporacionlife.com.pe',{ httpOnly: true });
        response.redirect('/extranet/confirmar-usuario');
    },
    DetallePedido: (request, response) => {
        if (request.cookies[CookieId]) {
            let sesion = request.cookies[CookieId];
            response.render(path.resolve('client/views/extranet/detalle-pedido.ejs'), { sesion: JSON.stringify(JSON.parse(sesion)) });
        }
        else response.redirect('/extranet/login');
    },
    //
    AuthLogin: async (request, response) => {
        const { email, pswd } = request.body;
        let empresa = 11;
        let result;
        try {
            let conn = await oracledb.getConnection(dbParams);
            let query = "select node_password \"hash\", st_cuenta_activada \"stact\", st_verifica_mail \"stmail\", co_cliente \"codigo\", de_nombre_comercial \"ncomercial\", de_razon_social \"rsocial\", fe_suscripcion \"fsuscripcion\", de_email \"email\", de_telefono \"telefono\", st_admin \"admin\" from cl_usuarios where de_email = :p_email and co_empresa = :p_empresa and st_tipo_usuario = 'E'";
            let params = {
                p_email: { val: email },
                p_empresa: { val: empresa }
            };
            result = await conn.execute(query, params, responseParams);
            result = result.rows[0];
            if (result.stact == 'N') {
                response.cookie('auth-err','Su cuenta no está ativada. Utilice el enlace proporcionado en el correo de confirmación enviado al momento de su registro.', { httpOnly: true });
                response.redirect('/extranet/login');
                return;
            }
            if (result.stmail == 'N') {
                response.cookie('auth-err','Su correo electrónico no ha sido validado. Utilice el enlace proporcionado en el correo de confirmación enviado al momento de su registro.', { httpOnly: true });
                response.redirect('/extranet/login');
                return;
            }
            bcrypt.compare(pswd, result.hash, function(err, res) {
                if (err) {
                    response.cookie('auth-err','La clave ingresada es incorrecta.', { httpOnly: true });
                    response.redirect('/extranet/login');
                    return;
                }
                let sesion = result;
                delete sesion.hash;
                delete sesion.stact;
                delete sesion.stmail;
                response.cookie(CookieId, JSON.stringify(sesion), { httpOnly: true });
                response.redirect('/extranet');
           });
        }
        catch (err) {
            console.error(err);
            response.json(err);
            return;
        }
    },
    RegistraUsuario: (request, response) => {
        const { idnumber, email, pswd, rpswd } = request.body;
        // auth-sign-in
        let empresa = 11;
        try {
            if (pswd != rpswd) {
                // clave hasta el keke. haz redirect con mensaje de error
                response.json({
                    error: 'Las claves deben coincidir'
                });
                return;
            }
            // go!
            bcrypt.hash(pswd, saltRounds).then(async function(hash) {
                // registra en bd
                let conn = await oracledb.getConnection(dbParams);
                let query = "call pack_new_web_expo.sp_registra_cliente_web(:p_cliente, :p_empresa, :p_email, :p_clave, :o_codigo, :o_mensaje)";
                let params = {
                    p_cliente: { val: idnumber },
                    p_empresa: { val: empresa },
                    p_email: { val: email },
                    p_clave: { val: hash },
                    o_codigo: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                    o_mensaje: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
                };
                let result = await conn.execute(query, params, responseParams);
                const { o_codigo, o_mensaje } = result.outBinds;
                if (o_codigo == 1) {
                    response.cookie('context','registro',{ httpOnly: true });
                    response.redirect('/extranet/confirmar-usuario');
                }
                else {
                    response.json({
                        error: o_mensaje
                    });
                }
            });
        }
        catch (err) {
            console.error(err);
        }
    },
    BuscarClientes: async (request, response) => {
        let { texto } = request.body;
        if (request.cookies[CookieId]) {
            let result;
            texto = texto.toUpperCase();
            try {
                let conn = await oracledb.getConnection(dbParams);
                let query = "select codigo \"codigo\", nombre \"nombre\" from table(pack_new_web_expo.f_buscar_clientes(:p_codigo,:p_empresa,:p_texto))";
                let params = {
                    p_codigo: { val: UserExpo.codigo },
                    p_empresa: { val: UserExpo.empresa },
                    p_texto: { val: texto }
                };
                result = await conn.execute(query, params, responseParams);
                response.json({
                    data: {
                        clientes: result.rows
                    }
                });
            }
            catch (err) {
                console.error(err);
                response.json({
                    error: err
                });
            }
        }
        else response.json({
            error: 'Su sesión expiró'
        });
    },
    DatosCliente: async (request, response) => {
        response.json({
            data: {
                cliente: {
                    codigo: 191383,
                    nombre: 'Hogarama SA',
                    disponible: 50000,
                    solicitud: 0,
                    deuda: 100
                },
                pedido: {
                    // codigo: 'O119-14368',
                    codigo: 'x',
                    moneda: 'US$',
                    importe: 24265.21,
                    fecha: '2019-12-30',
                    items: 96
                },
                ctacte: [
                    { documento: 'F010-1000', moneda: 'US$', deuda: 10000, vence: '2020-01-20', nunico: 857142 },
                    { documento: 'F015-1425', moneda: 'US$', deuda: 25000, vence: '2020-02-03', nunico: 142857 }
                ]
            }
        });
    }
};

module.exports = extranetController;