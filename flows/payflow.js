const db = require('../firebase');
const formatDate = require('./utils/formatDate');


// Datos Entrega

const datosEntrega = {
    answer: 'Por favor, indícanos los datos de entrega: Nombre, celular, dirección (En un solo mensaje)',
    logic: async (ctx, { state, flowDynamic }) => {
        await state.update({ datosEntrega: ctx.body });
        const myState = state.getMyState();
        await flowDynamic([`Genial, estos son los datos de entrega: ${myState.datosEntrega}`]);


    }
}



// Metodos Pago


const metodosDisponibles = ["Efectivo", "Nequi: 3006723128", "Código QR"]

const metodosPago = {
    answer: ["Opciones de pago",
        "",
        ...metodosDisponibles.map((metodo, i) => `${i + 1}\u20E3 ${metodo}`)
    ],
    logic: async (ctx, { state, flowDynamic, fallBack }) => {

        if (ctx.body == 1) {
            await state.update({ metodoPago: metodosDisponibles[ctx.body - 1] });
            const myState = state.getMyState();
            await flowDynamic(["Forma de pago: Efectivo"]);
        }
        else if (ctx.body == 2) {
            await state.update({ metodoPago: metodosDisponibles[ctx.body - 1] });
            const myState = state.getMyState();
            await flowDynamic([`Forma de pago: ${myState.metodoPago}`]);
        }
        else if (ctx.body == 3) {
            await state.update({ metodoPago: metodosDisponibles[ctx.body - 1] });
            const myState = state.getMyState();
            await flowDynamic("Enviando QR...🚀")
            await flowDynamic(`${myState.metodoPago}`, { media: "https://randomqr.com/assets/images/randomqr-256.png" });
        } else {
            return fallBack()
        }
    }

}



// validacion Pago

const validacionComprobante = {
    answer: 'Por favor envíanos el comprobante o indica con cuánto cancelas en efectivo',
    logic: async (ctx, { state }) => {
        await state.update({ comprobante: ctx.body })
    }
}



// Generar Pedido
const generarPedido = {
    answer: 'Procesando...🍓',
    logic: async (ctx, { state, flowDynamic }) => {
        const myState = state.getMyState();

        const pedido = {
            producto: myState.producto,
            salsas: myState.salsas ? myState.salsas : "No aplica",
            toppings: myState.toppings ? myState.toppings : "No aplica",
            extras: myState.extras ? myState.extras : "Sin extras",
            metodoPago: myState.metodoPago,
            comprobante: myState.comprobante,
            fecha: formatDate(new Date()),
            estado: "En proceso",
            cuenta: `$${myState.cuenta.toLocaleString()}`,
        };

        async function enviarPedido() {
            const docRef = db.collection('pedidos').doc();
            await docRef.set(pedido);  // Guarda el pedido en la base de datos
            

        }




        setTimeout(async () => {
            await enviarPedido();
            await flowDynamic(["🍓 Terminamos ✅ ¡Gracias por preferirnos! Tu pedido llegará enseguida🚀✨"])
        }, 1500)
    }
}



module.exports = { datosEntrega, metodosPago, validacionComprobante, generarPedido };







// .addAnswer("Procesando...🍓", null,
// })

// .addAnswer("", { delay: 2000 });


