'use strict';

const { join } = require('path');
const { createReadStream, existsSync } = require('fs');
const { bgYellow, cyan, yellow } = require('kleur');
const polka = require('polka');
const http = require('http');
const socketIo = require('socket.io');
const pug = require('pug');
const db = require('../../../../firebase.js'); // Asegúrate de que db esté inicializado correctamente

const HTTP_PORT = process.env.PORT || 3000;
const QR_FILE = process.env.QR_FILE ?? 'bot';
const PUBLIC_URL = process.env.PUBLIC_URL ?? process.env.RAILWAY_STATIC_URL ?? 'http://localhost';

const dir = [join(__dirname, 'dashboard'), join(__dirname, '..', '..', '..', '..', 'dashboard')].find((i) => existsSync(i));
const serve = require('serve-static')(dir);

let currentUser = null; // Variable para almacenar al usuario autenticado

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

    const server = http.createServer((req, res) => {
        polka()
            .use(serve)
            .get('/', (req, res) => {
                const html = pug.renderFile(join(__dirname, '..', '..', '..', '..', 'dashboard', 'index.pug'), {
                    title: 'Mi página con Pug',
                    message: '¡Bienvenido a la página dinámica con Pug!',
                });
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            })
            .handler(req, res);
    });

    const io = socketIo(server);

    io.on('connection', (socket) => {
        console.log('Socket conectado');

        const STATIC_USERNAME = 'admin';
        const STATIC_PASSWORD = '123456';

        socket.on('login', async (data) => {
            const { username, password } = data;

            if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
                currentUser = { username };

                // Enviar la lista de pedidos al cliente autenticado
                const pedidosRef = db.collection('pedidos');
                const snapshot = await pedidosRef.get();
                const pedidos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

                socket.emit('login-success', { message: 'Login exitoso', user: { username }, pedidos });
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

        const unsubscribe = pedidosRef.onSnapshot((snapshot) => {
            if (!currentUser) return; // No emitir eventos si no hay usuario autenticado

            snapshot.docChanges().forEach((change) => {
                const pedido = { id: change.doc.id, ...change.doc.data() };

                if (change.type === 'added') {
                    socket.emit('new-order', pedido);
                } else if (change.type === 'modified') {
                    socket.emit('order-updated', pedido);
                } else if (change.type === 'removed') {
                    socket.emit('order-removed', pedido);
                }
            });
        });

        socket.on('disconnect', () => {
            console.log('Socket desconectado');
            unsubscribe();
        });
    });

    server.listen(port, () => banner());
};

var portal_http = start;

module.exports = portal_http;
