'use strict';

var require$$0 = require('path');
var require$$1 = require('fs');
var require$$2 = require('kleur');
var require$$3 = require('polka');
var require$$4 = require('serve-static');
var http = require('http');  // Importamos el módulo http
var socketIo = require('socket.io');  // Importamos socket.io

const { join } = require$$0;
const { createReadStream, existsSync } = require$$1;
const { bgYellow, cyan, yellow } = require$$2;
const polka = require$$3;

const HTTP_PORT = process.env.PORT || 3000;
const QR_FILE = process.env.QR_FILE ?? 'bot';
const PUBLIC_URL = process.env.PUBLIC_URL ?? process.env.RAILWAY_STATIC_URL ?? 'http://localhost';

const dir = [join(__dirname, 'dist'), join(__dirname, '..', 'dist')].find((i) => existsSync(i));
const serve = require$$4(dir);

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
        // Pasamos el manejo de las rutas a Polka
        polka()
            .use(serve)
            .get('qr.png', (_, res) => {
                const qrSource = [
                    join(process.cwd(), `${name}.qr.png`),
                    join(__dirname, '..', `${name}.qr.png`),
                    join(__dirname, `${name}.qr.png`),
                ].find((i) => existsSync(i));

                const qrMark = [
                    join(__dirname, 'dist', 'water-mark.png'),
                    join(__dirname, '..', 'dist', 'water-mark.png'),
                ].find((i) => existsSync(i));
                const fileStream = createReadStream(qrSource ?? qrMark);

                res.writeHead(200, { 'Content-Type': 'image/png' });
                fileStream.pipe(res);
            })
            .handler(req, res);  // Llamamos a handler de Polka para responder la petición
    });

    // Pasamos el servidor HTTP a Socket.io
    const io = socketIo(server);  // Ahora Socket.io se maneja con el servidor HTTP

    // Conexión de cliente WebSocket
    io.on('connection', (socket) => {
        console.log('Nuevo cliente conectado');
        
        // Simulación de nuevo pedido en la base de datos
        setInterval(() => {
            const newOrder = { id: Math.random(), item: 'Producto X' };
            socket.emit('new-order', newOrder);  // Enviar el pedido a todos los clientes conectados
        }, 5000); // Enviar un nuevo pedido cada 5 segundos
    });

    server.listen(port, () => banner());
};

var portal_http = start;

module.exports = portal_http;
