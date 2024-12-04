document.addEventListener('DOMContentLoaded', () => {

    const showQR = document.querySelector(".showQR");

    showQR.addEventListener('click', () => {
        Swal.fire({
            title: 'Código QR',
            text: 'Este es un ejemplo de alerta usando SweetAlert2.',
            icon: 'info',
            html: `
            <img id="qr-img" src="/qr.png" />
            `,
            confirmButtonText: 'Entendido'
        });
    });

    // Aquí escuchas el evento de Socket.IO para actualizar la imagen cuando el servidor emite el evento 'qr-updated'
    const socket = io(); // Asumiendo que tu servidor ya está emitiendo eventos

    socket.on('qr-updated', () => {
        const qrImg = document.getElementById('qr-img');

        qrImg.src = "/qr.png";
    });

    socket.on('conectado-front', () => {
        const conectadoContainer = document.querySelector('.conectado-container');
        conectadoContainer.innerHTML = '<p>Conectado</p>';

    });

    socket.on('desconectado-front', () => {
        const conectadoContainer = document.querySelector('.conectado-container');
        conectadoContainer.innerHTML = '<p>Desconectado</p>';
    });





});
