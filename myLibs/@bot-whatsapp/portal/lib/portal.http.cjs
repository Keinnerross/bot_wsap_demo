'use strict';

const { join } = require('path');
const { createReadStream, existsSync, watchFile, } = require('fs');
const fs = require('fs');
const path = require('path');
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

const dir = [join(__dirname, 'out'), join(__dirname, '..', '..', '..', '..', 'out')].find((i) =>
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
            const filePath = path.join(__dirname, '..', '..', '..', '..', 'out', 'index.html');

            // Leer el archivo HTML y enviarlo como respuesta
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

        if (req.url === '/dashboard') {
            const filePath = path.join(__dirname, '..', '..', '..', '..', 'out', 'dashboard.html');

            // Leer el archivo HTML para el dashboard y enviarlo como respuesta
            fs.readFile(filePath, 'utf-8', (err, html) => {
                if (err) {
                    res.statusCode = 500;
                    res.end('Error al cargar el dashboard.');
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

const io = socketIo(server, {
    cors: {
        origin: PUBLIC_URL,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
    },
});


// Configurar eventos de Socket.IO
io.on('connection', async (socket) => {
    console.log('Socket conectado');



    const STATIC_USERNAME = process.env.STATIC_USERNAME;
    const STATIC_PASSWORD = process.env.STATIC_PASSWORD;
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;


    socket.on('login', async (data) => {
        const { username, password } = data;

        if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
            // Generar un token JWT usando el valor del archivo .env
            const token = jwt.sign({ username }, JWT_SECRET_KEY, { expiresIn: '15h' });

            // Enviar el token como una cookie
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

    socket.on('check-auth', (data) => {
        const token = data ? data.token : false; // Recibir token desde el cliente

        if (token) {
            // Verificar el token
            jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
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
    const snapshot = await pedidosRef
        .orderBy('numeroDeOrden', 'desc')
        .limit(30)
        .get();

    const pedidos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    socket.emit('get-orders', pedidos);






    let lastDocumentSnapshot = null; // Variable para guardar el último snapshot procesado necesario para el new-order

    pedidosRef
        .orderBy('numeroDeOrden', 'desc')  // Ordena por 'numeroDeOrden' de forma descendente
        .limit(30)  // Limita la consulta a los primeros 30 documentos
        .onSnapshot(snapshot => {
            if (!lastDocumentSnapshot) {
                // Si es la primera vez, emitir los primeros 30 documentos
                const allOrders = snapshot.docs.map(doc => doc.data());
                socket.emit('new-order', allOrders);
                lastDocumentSnapshot = snapshot;
                return;
            }

            // Detecta si hay nuevos documentos comparando con el snapshot anterior
            const hasNewDocs = snapshot.docs.some(
                doc => !lastDocumentSnapshot.docs.some(prevDoc => prevDoc.id === doc.id)
            );

            if (hasNewDocs) {
                const allOrders = snapshot.docs.map(doc => doc.data());
                socket.emit('new-order', allOrders);
            }

            lastDocumentSnapshot = snapshot;
        });



    socket.on('update-order', async (data) => {
        const { orderNumber, newState } = data;

        try {
            const snapshot = await pedidosRef.where('numeroDeOrden', '==', orderNumber).get();

            if (snapshot.empty) {
                console.log('No se encontró ningún  pedido con ese número de orden.');
                return;
            }

            snapshot.forEach(async (doc) => {
                await pedidosRef.doc(doc.id).update({
                    estado: newState,
                });

            });

            socket.emit('order-updated', { orderNumber, newState });

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
