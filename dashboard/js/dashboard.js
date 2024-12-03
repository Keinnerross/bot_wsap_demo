document.addEventListener('DOMContentLoaded', () => {
    const showQR = document.querySelector(".showQR");

    // Establecer conexión con el servidor Socket.io
    const socket = io(); // Asegúrate de tener Socket.io configurado en tu frontend

    console.log("Conexión establecida con el servidor WebSocket");

    // Escuchar el evento 'qr-generated' desde el servidor
    socket.on('qr-generated', (data) => {
        console.log("Evento 'qr-generated' recibido:", data); // Verifica si se recibe la información correcta

        // Verificar que el campo `qrFilePath` existe
        if (data && data.qrFilePath) {
            console.log("Ruta del archivo QR:", data.qrFilePath); // Imprimir la ruta del archivo QR

            showQR.addEventListener('click', () => {
                Swal.fire({
                    title: 'Código QR',
                    text: 'Este es el código QR generado.',
                    icon: 'info',
                    html: `
                        <img src="${data.qrFilePath}" alt="QR Code" style="max-width: 100%; height: auto;" />
                    `,
                    confirmButtonText: 'Entendido'
                });
            });
        } else {
            console.error("No se ha recibido la ruta del archivo QR desde el servidor");
        }
    });

    // Opcional: Verifica si el servidor está enviando datos
    socket.on('connect_error', (err) => {
        console.error("Error de conexión con WebSocket:", err);
    });

});
