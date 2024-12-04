'use strict';

const { join } = require('path');
const { createReadStream, existsSync, watchFile } = require('fs');
const { bgYellow, cyan, yellow } = require('kleur');
const pug = require('pug');
const http = require('http');
const socketIo = require('socket.io');
const serveStatic = require('serve-static');
const db = require('../../../../firebase.js'); // Asegúrate de que db esté inicializado correctamente

const HTTP_PORT = process.env.PORT || 3000;
const QR_FILE = process.env.QR_FILE ?? 'bot';
const PUBLIC_URL = process.env.PUBLIC_URL ?? process.env.RAILWAY_STATIC_URL ?? 'http://localhost';

const dir = [join(__dirname, 'dashboard'), join(__dirname, '..', '..', '..', '..', 'dashboard')].find((i) =>
    existsSync(i)
);
const serve = serveStatic(dir);

let currentUser = null; // Variable para almacenar al usuario autenticado

// Inicializar el servidor HTTP y Socket.IO al cargar el módulo
const server = http.createServer((req, res) => {
    serve(req, res, () => {
        if (req.url === '/qr.png') {
            const qrSource = [
                join(process.cwd(), `${QR_FILE}.qr.png`),
                join(__dirname, '..', `${QR_FILE}.qr.png`),
                join(__dirname, `${QR_FILE}.qr.png`),
            ].find((i) => existsSync(i));

            if (!qrSource) {
                res.writeHead(404);
                res.end('QR no encontrado');
                return;
            }

            const fileStream = createReadStream(qrSource);
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-store',
                'Pragma': 'no-cache',
                'Expires': '0',
            });
            fileStream.pipe(res);
            return;
        }

        if (req.url === '/') {
            const html = pug.renderFile(join(__dirname, '..', '..', '..', '..', 'dashboard', 'index.pug'));
            res.end(html);
            return;
        }

        res.writeHead(404);
        res.end('No encontrado');
    });
});

const io = socketIo(server);

// Configurar eventos de Socket.IO
io.on('connection', (socket) => {
    console.log('Socket conectado');

//preguntar a bayleis


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
        if (!currentUser) return;

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

// Configurar `watchFile` para observar cambios en el archivo QR
const qrPath = join(process.cwd(), `${QR_FILE}.qr.png`);
watchFile(qrPath, { interval: 100 }, () => {
    io.emit('qr-updated'); // Emitir evento cuando el archivo QR se actualice
});

// Función para iniciar el servidor
const start = (args) => {
    const port = args?.port || HTTP_PORT;
    server.listen(port, () => {
        console.log(bgYellow(`🚩 ESCANEAR QR 🚩`));
        console.log(cyan(`Existen varias maneras de escanear el QR code:`));
        console.log(cyan(`- Visita `), yellow(`${PUBLIC_URL}:${port}`));
        console.log(cyan(`- Archivo generado: `), yellow(`${QR_FILE}.qr.png`));
    });
};

module.exports = { QRPortalWeb: start, io };
