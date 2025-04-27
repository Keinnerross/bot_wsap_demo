'use strict';

const { join } = require('path');
const { createReadStream, existsSync, watchFile, unwatchFile } = require('fs');
const fs = require('fs');
const path = require('path');
const { bgYellow, cyan, yellow } = require('kleur');
const pug = require('pug');
const http = require('http');
const socketIo = require('socket.io');
const serveStatic = require('serve-static');
const db = require('../../../../firebase.js');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const HTTP_PORT = process.env.PORT || 4000;
const QR_FILE = process.env.QR_FILE ?? 'bot';
const PUBLIC_URL = process.env.PUBLIC_URL ?? process.env.RAILWAY_STATIC_URL ?? 'http://localhost';

const dir = [join(__dirname, 'out'), join(__dirname, '..', '..', '..', '..', 'out')].find((i) => existsSync(i));
const serve = serveStatic(dir);

let currentUser = null;

// ---------------------- Server HTTP
const server = http.createServer((req, res) => {
    cookieParser()(req, res, () => { });

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

        if (req.url === '/' || req.url === '/dashboard') {
            const filePath = path.join(__dirname, '..', '..', '..', '..', 'out', req.url === '/' ? 'index.html' : 'dashboard.html');
            fs.readFile(filePath, 'utf-8', (err, html) => {
                if (err) {
                    res.statusCode = 500;
                    res.end('Error al cargar la página.');
                    return;
                }
                res.setHeader('Content-Type', 'text/html');
                res.end(html);
            });
            return;
        }

        res.writeHead(404);
        res.end('No encontrado');
    });
});

// ---------------------- Socket.IO
const io = socketIo(server, {
    cors: {
        origin: PUBLIC_URL ? PUBLIC_URL : "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
    },
});

// Guardamos el watcher de QR para poder desactivarlo luego si queremos
const qrPath = join(process.cwd(), `${QR_FILE}.qr.png`);
const qrWatchers = new Set();

// ---------------------- Eventos Socket
io.on('connection', async (socket) => {
    console.log('✅ Socket conectado');

    const STATIC_USERNAME = process.env.STATIC_USERNAME;
    const STATIC_PASSWORD = process.env.STATIC_PASSWORD;
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

    let unsubscribePedidos = null; // Guardar el unsubscribe del snapshot
    let watchingQR = false; // Control de watchers de QR

    // -- Login
    socket.on('login', async (data) => {
        const { username, password } = data;

        if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
            const token = jwt.sign({ username }, JWT_SECRET_KEY, { expiresIn: '15h' });

            socket.emit('login-success', { message: 'Login exitoso', token });

            const pedidosRef = db.collection('pedidos');
            const snapshot = await pedidosRef
                .orderBy('numeroDeOrden', 'desc')
                .limit(30)
                .get();

            const pedidos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            socket.emit('get-orders', pedidos);
        } else {
            socket.emit('login-error', { message: 'Usuario o contraseña incorrectos' });
        }
    });

    // -- Check Auth
    socket.on('check-auth', (data) => {
        const token = data?.token;
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
                if (err) {
                    socket.emit('auth-status', { authenticated: false });
                } else {
                    currentUser = { username: decoded.username };
                    socket.emit('auth-status', { authenticated: true, user: currentUser });
                }
            });
        } else {
            socket.emit('auth-status', { authenticated: false });
        }
    });

    // -- Escuchar pedidos en tiempo real
    const pedidosRef = db.collection('pedidos');

    unsubscribePedidos = pedidosRef
        .orderBy('numeroDeOrden', 'desc')
        .limit(30)
        .onSnapshot(snapshot => {
            const allOrders = snapshot.docs.map(doc => doc.data());
            socket.emit('new-order', allOrders);
        });

    // -- Update pedido
    socket.on('update-order', async (data) => {
        const { orderNumber, newState } = data;

        try {
            const snapshot = await pedidosRef.where('numeroDeOrden', '==', orderNumber).get();
            if (snapshot.empty) {
                console.log('No se encontró pedido con ese número.');
                return;
            }

            snapshot.forEach(async (doc) => {
                await pedidosRef.doc(doc.id).update({ estado: newState });
            });

            socket.emit('order-updated', { orderNumber, newState });
        } catch (error) {
            console.error('Error al actualizar el pedido:', error);
        }
    });

    // -- Ver QR dinámicamente
    if (!watchingQR) {
        const watcher = () => {
            socket.emit('qr-updated');
        };
        watchFile(qrPath, { interval: 100 }, watcher);
        qrWatchers.add(watcher);
        watchingQR = true;
    }

    // -- Desconexión
    socket.on('disconnect', () => {
        console.log('❌ Socket desconectado');

        if (unsubscribePedidos) {
            unsubscribePedidos();
            console.log('🧹 Listener Firebase limpiado.');
        }

        // Limpiar watcher QR
        for (const watcher of qrWatchers) {
            unwatchFile(qrPath, watcher);
            qrWatchers.delete(watcher);
        }
        console.log('🧹 Watcher de QR limpiado.');
    });

});

// ---------------------- Función para levantar server
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
