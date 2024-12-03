///BubolFresa

//Imports
const { addKeyword, addAnswer } = require('@bot-whatsapp/bot');
const menu = require('../flowsData/menuData.js');
const db = require('../../firebase.js');

//variables
const bodyEntry = 6; // entrada del usuario, es decir, la opción que elige.
const menuChossed = menu[bodyEntry - 1];






const bubolFresa = addKeyword(bodyEntry.toString()).addAnswer([`${menuChossed.producto} es una buena elección!`], null,
    async (ctx, { flowDynamic, state }) => {


        await state.update({ producto: menuChossed.producto });
        await state.update({ cuenta: menuChossed.precio });

        const myState = state.getMyState();

        const resume = [
            "Este es el *resumen del pedido:*",
            "",
            `*Producto*: ${myState.producto}`,
            `*Total a cancelar:* $${myState.cuenta.toLocaleString()}`,
        ]

        await flowDynamic(resume.join('\n'));



    })
    .addAnswer("Si está todo correcto escriba *pedir* para hacer su pedido", {
        capture: true
    }, (ctx, { fallBack }) => {
        if (ctx.body.toLowerCase() != "pedir") {
            return fallBack()
        }


    }).addAnswer(
        'Porfavor indicanos los datos de entrega: Nombre, celular, dirección (En un solo Mensaje)',
        {
            capture: true,
        },
        async (ctx, { flowDynamic, state }) => {

            await state.update({ datosEntrega: ctx.body });
            const myState = state.getMyState();

            await flowDynamic([`Genial, estos son los datos de entrega: ${myState.datosEntrega}`]);


        }
    ).addAnswer(["Opciones de pago",
        "",
        "1️⃣ Efectivo",
        "2️⃣ Nequi",
        "3️⃣ QR del Negocio"],
        {
            capture: true,
        },
        async (ctx, { flowDynamic, state }) => {

            const metodoPago = {
                1: "Efectivo",
                2: "Nequi 3006723128",
                3: "QR",

            };

            if (ctx.body == 1) {
                await state.update({ pago: metodoPago[ctx.body] });
                const myState = state.getMyState();
                await flowDynamic(["Forma de pago: Efectivo"])



            } else if (ctx.body == 2) {
                await state.update({ pago: metodoPago[ctx.body] });
                const myState = state.getMyState();
                await flowDynamic([`Forma de pago: ${myState.pago}`]);


            } else if (ctx.body == 3) {
                await state.update({ pago: metodoPago[ctx.body] });
                const myState = state.getMyState();
                await flowDynamic("Código QR", { media: "https://randomqr.com/assets/images/randomqr-256.png" })


            }

        }
    )
    .addAnswer(
        ['Por favor envíanos el comprobante o indique con cuanto cancela en efectivo'], { capture: true }, async (ctx, { state }) => {
            await state.update({ comprobante: ctx.body });
        })
    .addAnswer("Procesando...🍓", null, async (ctx, { state }) => {
    
    
        const myState = state.getMyState();
    
        function formatDate(date) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');  // Los meses en JavaScript comienzan en 0 (enero es 0)
            const year = String(date.getFullYear()).slice(-2);  // Obtiene los dos últimos dígitos del año
    
            return `${hours}:${minutes} ${month} ${day} ${year}`;
        }
    
        const pedido = {
            producto: myState.producto,
            salsas: myState.salsa ?  myState.salsa : "Sin Salsa",
            extras: myState.adicional ? myState.adicional : "Sin extras",
            metodoPago: myState.metodoPago,
            comprobante: myState.comprobante,
            fecha: formatDate(new Date()),  // Usa la función para formatear la fecha
            estado: "En proceso",
            total: `$${myState.cuenta.toLocaleString()}`,
        };
    
        async function enviarPedido() {
            const docRef = db.collection('pedidos').doc();  // Crea un documento con ID autogenerado
            await docRef.set(pedido);  // Envía el objeto como documento
    
            console.log('Pedido enviado a la base de datos.');
        }
    
        enviarPedido();
    
    
    },)
    .addAnswer("🍓Terminamos ✅ ¡Gracias por preferirnos! su pedido llegará enseguida🚀`✨", {
        delay: 2000
    })






module.exports = bubolFresa;


