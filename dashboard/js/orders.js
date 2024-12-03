const socket = io(); // Conexión al servidor WebSocket

// Recuperar los pedidos ya recibidos desde localStorage al iniciar

// Escuchar el evento 'new-order' que el servidor emite
socket.on('new-order', (order) => {
    // Comprobar si el pedido ya ha sido recibido


    // Guardar la lista actualizada en localStorage

    if (order.estado == "En proceso") {
        Swal.fire({
            title: '¡Nuevo Pedido!',
            text: `Producto: ${order.producto}\nEstado: ${order.estado}`,
            icon: 'info',
            timer: 5000, // Tiempo en milisegundos (5 segundos)
            timerProgressBar: true,
            showConfirmButton: false, // Eliminar el botón de confirmar
        });
    }


    // Agregar el nuevo pedido al principio de la lista en el DOM
    const ordersList = document.getElementById('orders-list');
    const listItem = document.createElement('li');
    listItem.textContent = `
    ${order.producto}, 
    ${order.salsas && `Salsas: ${order.salsas}`}, 
    ${order.toppings && `Toppings: ${order.toppings}`}, 
    ${order.extras && `Extras: ${order.extras}`},
    Fecha: ${order.fecha}, 
    Estado: ${order.estado}`;

    // Insertar el nuevo elemento al inicio de la lista
    if (ordersList.firstChild) {
        ordersList.insertBefore(listItem, ordersList.firstChild);
    } else {
        ordersList.appendChild(listItem); // Si la lista está vacía, agregar el elemento normalmente
    }
});
