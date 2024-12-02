'use strict';

const { join } = require('path');
const { createReadStream, existsSync } = require('fs');
const { bgYellow, cyan, yellow } = require('kleur');
const polka = require('polka');
const http = require('http');
const socketIo = require('socket.io');
const pug = require('pug');
const  db = require('../../../../firebase.js'); // Asegúrate de que db esté inicializado correctamente

const HTTP_PORT = process.env.PORT || 3000;
const QR_FILE = process.env.QR_FILE ?? 'bot';
const PUBLIC_URL = process.env.PUBLIC_URL ?? process.env.RAILWAY_STATIC_URL ?? 'http://localhost';

const dir = [join(__dirname, 'dashboard'), join(__dirname, '..', '..', '..', '..', 'dashboard')].find((i) => existsSync(i));
const serve = require('serve-static')(dir);

let currentUser = null;  // Variable para almacenar al usuario autenticado

const start = (args) => {
    const injectArgs = {
        port: HTTP_PORT,
        publicSite: PUBLIC_URL,
        name: QR_FILE,
        ...args,
    };
    const { port, publicSite, name } = injectArgs;

    const banner = () => {
        console.log(``);
        console.log(bgYellow(`🚩 ESCANEAR QR 🚩`));
        console.log(cyan(`Existen varias maneras de escanear el QR code`));
        console.log(cyan(`- También puedes visitar `), yellow(`${publicSite}:${port}`));
        console.log(cyan(`- Se ha creado un archivo que finaliza `), yellow('qr.png'));
        console.log(``);
    };

    // Creamos un servidor HTTP estándar de Node.js
    const server = http.createServer((req, res) => {
        polka()
            .use(serve)
            .get('/', (req, res) => {
                console.log(`Solicitud recibida en la ruta principal (/)`);
                const html = pug.renderFile(join(__dirname, '..', '..', '..', '..', 'dashboard', 'index.pug'), {
                    title: 'Mi página con Pug',
                    message: '¡Bienvenido a la página dinámica con Pug!',
                });
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            })
            .get('qr.png', (_, res) => {
                console.log(`Solicitud recibida para qr.png`);
                const qrSource = [
                    join(process.cwd(), `${name}.qr.png`),
                    join(__dirname, '..', `${name}.qr.png`),
                    join(__dirname, `${name}.qr.png`),
                ].find((i) => existsSync(i));

                const qrMark = [
                    join(__dirname, 'dashboard', 'water-mark.png'),
                    join(__dirname, '..', '..', '..', '..', 'dashboard', 'water-mark.png'),
                ].find((i) => existsSync(i));

                console.log(`Archivo QR encontrado en: ${qrSource ?? qrMark}`);

                const fileStream = createReadStream(qrSource ?? qrMark);
                res.writeHead(200, { 'Content-Type': 'image/png' });
                fileStream.pipe(res);
            })
            .handler(req, res);
    });

    // Inicializar socket.io en el servidor
    const io = socketIo(server);

    // Exportar la instancia de io para que se pueda usar en otros archivos

    ///////////////////// Funciones relacionadas con socket /////////////////////

    io.on('connection', (socket) => {
        console.log('socket conectado');

        const STATIC_USERNAME = "admin";
        const STATIC_PASSWORD = "123456";

        socket.on('login', (data) => {
            const { username, password } = data;

            if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
                currentUser = { username };
                socket.emit('login-success', { message: 'Login exitoso', user: { username } });
            } else {
                socket.emit('login-error', { message: 'Usuario o contraseña incorrectos' });
            }
        });

        socket.on('check-auth', () => {
            if (currentUser) {
                socket.emit('auth-status', { authenticated: true, user: currentUser });
            } else {
                socket.emit('auth-status', { authenticated: false });
            }
        });

        // Escuchar cambios en la colección 'pedidos' en Firestore
        const pedidosRef = db.collection('pedidos');

        // Listener para cambios en los pedidos
        const unsubscribe = pedidosRef.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    // console.log('Nuevo pedido agregado:', change.doc.data());
                    socket.emit('new-order', change.doc.data());  // Emitir el nuevo pedido al cliente
                }
                if (change.type === 'modified') {
                    console.log('Pedido modificado:', change.doc.data());
                    socket.emit('order-updated', change.doc.data());  // Emitir la actualización del pedido
                }
                if (change.type === 'removed') {
                    console.log('Pedido eliminado:', change.doc.data());
                    socket.emit('order-removed', change.doc.data());  // Emitir que el pedido fue eliminado
                }
            });
        });

        // Desuscribir el listener cuando el socket se desconecte
        socket.on('disconnect', () => {
            console.log('socket desconectado');
            unsubscribe();  // Detener la escucha cuando el cliente se desconecte
        });
    });

    server.listen(port, () => banner());
};

var portal_http = start;

module.exports = portal_http;
