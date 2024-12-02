// Conectar con el servidor WebSocket
const socket = io(); // Conexión al servidor WebSocket

// Escuchar el evento 'new-order' que el servidor emite
socket.on('new-order', (order) => {
    console.log('Nuevo pedido recibido:', order);

    // Mostrar alerta con SweetAlert
    Swal.fire({
        title: '¡Nuevo Pedido!',
        text: `Producto: ${order.producto}\nEstado: ${order.estado}`,
        icon: 'info',
        timer: 5000, // Tiempo en milisegundos (5 segundos)
        timerProgressBar: true,
        showConfirmButton: false, // Eliminar el botón de confirmar
    });

    // Agregar el nuevo pedido a la lista en el DOM
    const ordersList = document.getElementById('orders-list');
    const listItem = document.createElement('li');
    listItem.textContent = `Pedido ID: ${order.estado}, Producto: ${order.producto}`;
    ordersList.appendChild(listItem);
});
