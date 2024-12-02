const { addKeyword, addAnswer } = require('@bot-whatsapp/bot');
const menu = require('../flowsData/menuData.js');
const adicionales = require('../flowsData/adicionales.js');
const menuChossed = menu[1 - 1];
const db = require('../../firebase.js');



///TRADICIONALES



const tradicionales = addKeyword("1").addAnswer([`${menuChossed.producto} es una buena elección!`,
    "",
    "Escoje una *salsa*",
    "",
    "1️⃣ Leche condensada",
    "2️⃣ Arequipe",
    "3️⃣ Leche condensada + Arequipe ($3000) Adicional"],
    {
        capture: true,
    },
    async (ctx, { flowDynamic, state, fallBack }) => {

        const salsas = {
            1: "Leche condensada",
            2: "Arequipe",
            3: "Leche condensada + Arequipe +$3000 Adicional",

        };

        //Guarda producto seleccionado y el precio en la cuenta del flujo anterior por ahora manual
        await state.update({ producto: menuChossed.producto });
        await state.update({ cuenta: menuChossed.precio });


        if (salsas[ctx.body]) {
            await state.update({ salsa: salsas[ctx.body] }); // Guarda salsa seleccionada

            if (ctx.body == 3) {
                const myState = state.getMyState();
                cuentaActual = myState.cuenta
                await state.update({ cuenta: cuentaActual + 3000 }); //Si es que la salsa tiene costo extra hace la suma

            }
            const myState = state.getMyState();
            console.log(myState.cuenta);
            await flowDynamic([
                `${myState.salsa} buena elección!!`,
            ]);

        } else {
            return fallBack();
        }

    }
).addAnswer(["*Adicionales:*",
    "¿Quieres mas salsas o toppings por un costo adicional?",
    "",
    "*Salsas:*",
    ...adicionales.salsas.map((item, index) => `${index + 1}️.- ${item.salsa} - $${item.precio.toLocaleString()}`),
    "",
    "*Toppings clasicos: $3.000*",
    //El valor del 5 es definido por la cantidad de salsas que hay es decir salsa.lenght, ahora es manual.
    ...adicionales.toppingsClasicos.map((item, index) => `${index + 5}️.- ${item.topping}`),
    "",
    "*Toppings Premium: $4.000*",
    ...adicionales.toppingsPremiums.map((item, index) => `${index + 16}️.- ${item.topping}`),
    "",
    "0.- No gracias",



], {
    capture: true,
}, async (ctx, { flowDynamic, state, fallBack }) => {

    //ctx.body <= 4 Quiere decir que eligió como adicional salsas
    if (ctx.body >= 1 && ctx.body <= 4) {
        const myState = state.getMyState();
        const cuentaActual = myState.cuenta;
        const adicionalChossed = adicionales.salsas[ctx.body - 1]; // hacemos a resta pq estamos filtrando por indice no por lenght y el usuario escribe numeros desde le 1
        //

        await state.update({ adicional: adicionalChossed.salsa }); // Guarda salsa seleccionada
        await state.update({ cuenta: cuentaActual + adicionalChossed.precio }); //Si es que la salsa tiene costo extra hace la suma
        console.log("mi cuenta: " + myState.cuenta)


    }

    //ctx.body <= 4 Quiere decir que eligió como adicional Toppings clasicos
    else if (ctx.body >= 5 && ctx.body <= 15) {
        const myState = state.getMyState();
        const cuentaActual = myState.cuenta;
        const adicionalChossed = adicionales.toppingsClasicos[ctx.body - 5]; // hacemos a resta pq estamos filtrando por indice no por lenght y el usuario escribe numeros desde le 1
        //


        await state.update({ adicional: adicionalChossed.topping }); // Guarda topping seleccionada
        await state.update({ cuenta: cuentaActual + 3000 }); //Si es que la topping tiene costo extra hace la suma







    }
    else if (ctx.body >= 16 && ctx.body <= 24) {
        const myState = state.getMyState();
        const cuentaActual = myState.cuenta;
        const adicionalChossed = adicionales.toppingsPremiums[ctx.body - 16]; // hacemos a resta pq estamos filtrando por indice no por 


        await state.update({ adicional: adicionalChossed.topping }); // Guarda topping seleccionada
        await state.update({ cuenta: cuentaActual + 4000 }); //Si es que la topping tiene costo extra hace la suma


    } else {
        if (ctx.body != 0) {
            return fallBack();
        }
    }

    const myState = state.getMyState();

    let resume = [
        "Este es el *resumen del pedido:*",
        "",
        `*Producto*: ${myState.producto}`,
        `*Salsas*: ${myState.salsa}`,
        `*Extras*: ${myState.adicional ? myState.adicional : "Sin extras"}`,
        `*Total a cancelar:* $${myState.cuenta.toLocaleString()}`,

    ]


    await flowDynamic(resume.join('\n'));

}).addAnswer("Si está todo correcto escriba *pedir* para hacer su pedido", {
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
            2: "Nequi: 3006723128",
            3: "QR",

        };

        if (ctx.body == 1) {
            await state.update({ metodoPago: metodoPago[ctx.body] });
            const myState = state.getMyState();
            await flowDynamic(["Forma de pago: Efectivo"])



        } else if (ctx.body == 2) {
            await state.update({ metodoPago: metodoPago[ctx.body] });
            const myState = state.getMyState();
            await flowDynamic([`Forma de pago: ${myState.pago}, Por favor envianos el comprobante`,

            ]);
        } else if (ctx.body == 3) {
            await state.update({ metodoPago: metodoPago[ctx.body] });
            const myState = state.getMyState();
            await flowDynamic("Código QR", { media: "https://randomqr.com/assets/images/randomqr-256.png" })


        }

    }
)
    .addAnswer(
        ['Por favor envíanos el comprobante o indique con cuanto cancela en efectivo'], { capture: true }

    ).addAnswer("Procesando...🍓", null, async (ctx, { state }) => {

        await state.update({ comprobante: ctx.body });

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
            salsas: myState.salsa,
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






module.exports = tradicionales;


