'use strict';

const { join } = require('path');
const { createReadStream, existsSync, watchFile } = require('fs');
const { bgYellow, cyan, yellow } = require('kleur');
const pug = require('pug');
const http = require('http');
const socketIo = require('socket.io');
const serveStatic = require('serve-static');
const db = require('../../../../firebase.js'); // Asegúrate de que db esté inicializado correctamente
const jwt = require('jsonwebtoken'); // Importar jsonwebtoken
const cookieParser = require('cookie-parser'); // Importar cookie-parser

const HTTP_PORT = process.env.PORT || 4000;
const QR_FILE = process.env.QR_FILE ?? 'bot';
const PUBLIC_URL = process.env.PUBLIC_URL ?? process.env.RAILWAY_STATIC_URL ?? 'http://localhost';

const dir = [join(__dirname, 'dashboard'), join(__dirname, '..', '..', '..', '..', 'dashboard')].find((i) =>
    existsSync(i)
);
const serve = serveStatic(dir);

let currentUser = null; // Variable para almacenar al usuario autenticado

// Inicializar el servidor HTTP y Socket.IO al cargar el módulo
const server = http.createServer((req, res) => {
    // Usar cookie-parser
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

        if (req.url === '/') {
            const html = pug.renderFile(join(__dirname, '..', '..', '..', '..', 'dashboard', 'index.pug'));
            res.end(html);
            return;
        }

        res.writeHead(404);
        res.end('No encontrado');
    });
});

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", //Direccion front
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
    },
});

// Configurar eventos de Socket.IO
io.on('connection', async (socket) => {
    console.log('Socket conectado');





    const STATIC_USERNAME = 'admin';
    const STATIC_PASSWORD = '123456';

    socket.on('login', async (data) => {
        const { username, password } = data;

        if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
            // Generar un token JWT
            const token = jwt.sign({ username }, 'your-secret-key', { expiresIn: '15h' });

            // Enviar el token como una cookie
            socket.emit('login-success', { message: 'Login exitoso', token });

            const pedidosRef = db.collection('pedidos');
            const snapshot = await pedidosRef.orderBy('fecha', 'desc').get();
            const pedidos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            socket.emit('get-orders', pedidos);


        } else {
            socket.emit('login-error', { message: 'Usuario o contraseña incorrectos' });
        }
    });

    socket.on('check-auth', (data) => {
        const token = data ? data.token : false; // Recibir token desde el cliente

        if (token) {
            // Verificar el token
            jwt.verify(token, 'your-secret-key', (err, decoded) => {
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


    const pedidosRef = db.collection('pedidos');
    const snapshot = await pedidosRef.orderBy('fecha', 'desc').get();
    const pedidos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    socket.emit('get-orders', pedidos);

    pedidosRef
        .orderBy('fecha', 'desc') // Ordena los pedidos por fecha, en orden descendente (más recientes primero)
        .onSnapshot(snapshot => {
            const updatedOrders = snapshot.docs.map(doc => doc.data());
            io.emit('new-order', updatedOrders); // Emite las órdenes actualizadas a todos los clientes
        });



    socket.on('update-order', async (data) => {
        const { orderNumber, newState } = data;

        try {
            const snapshot = await pedidosRef.where('numeroDeOrden', '==', orderNumber).get();

            if (snapshot.empty) {
                console.log('No se encontró ningún  pedido con ese número de orden.');
                return;
            }

            // Actualiza el campo estado del documento encontrado
            snapshot.forEach(async (doc) => {
                await pedidosRef.doc(doc.id).update({
                    estado: newState,
                });
                console.log(`Estado actualizado a "${newState}" para el pedido con número de orden ${orderNumber}.`);
            });

            // Emitir una notificación para informar a los clientes que la orden ha sido actualizada
            io.emit('order-updated', { orderNumber, newState });

        } catch (error) {
            console.error('Error al actualizar el pedido:', error);
        }
    });



    socket.on('disconnect', () => {
        console.log('Socket desconectado');
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
