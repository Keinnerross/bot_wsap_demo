//Imports

const { createBot, createProvider, createFlow, addKeyword,  } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const JsonFileAdapter = require('@bot-whatsapp/database/json')
const { EVENTS } = require('@bot-whatsapp/bot/')

////



const flowDiferentQuestion = addKeyword("2").addAnswer("Esta función estará pronto disponible😸")

const flowForm = addKeyword("1").addAnswer(["Carta:",
    "Selecciona el *número* de la carta de su preferencia",
    "",
    "1️⃣ Fresas con crema tradicionales: $16.000",
    "2️⃣ Fresas con crema (1 topping + 1 salsa): $18.500",
    "3️⃣ Fresas con crema (2 toppings + 1 salsa): $21.500"],
    {

        capture: true,
    },
    async (ctx, { flowDynamic, state, endFlow}) => {
        const articles = {
            1: "Fresas con crema tradicionales",

        };

        if (articles[ctx.body]) {
            await state.update({ article: articles[ctx.body] });
            await state.update({ cuenta: 16000 });
          

            const myState = state.getMyState();
            console.log(myState);
            await flowDynamic(`Súper, ${myState.article} es una buena elección!`);
        } else {
            return endFlow({body: 'Las demás opciones estarán disponibles pronto🔧, salude para reiniciar'});
        }

       
    }
)
    .addAnswer(["Escoje una *salsa*",
        "",
        "1️⃣ Leche condensada",
        "2️⃣ Arequipe",
        "3️⃣ Leche condensada + Arequipe ($3000) Adicional"],
        {
            capture: true,
        },
        async (ctx, { flowDynamic, state }) => {

            const salsas = {
                1: "Leche condensada",
                2: "Arequipe",
                3: "Leche condensada + Arequipe +$3000 Adicional",

            };

            if (salsas[ctx.body]) {
                await state.update({ salsa: salsas[ctx.body] });
                if (ctx.body == 3){
                    const myState = state.getMyState();
                    cuentaActual = myState.cuenta
                    await state.update({ cuenta: cuentaActual + 3000});

                }
                    const myState = state.getMyState();
                    console.log(myState.cuenta);
                await flowDynamic([                
                    `${myState.salsa}, buena elección!!`,
                ]);
            } else {
                await flowDynamic("Las demás opciones estarán disponibles pronto");
            }

        }
    )
    .addAnswer(
        'Porfavor indicanos los datos de entrega: Nombre, celular, dirección (En un solo Mensaje)',
        {
            capture: true,
        },
        async (ctx, { flowDynamic, state }) => {

            await state.update({ datosEntrega: ctx.body });
            const myState = state.getMyState();

            await flowDynamic([`Genial, estos son los datos de entrega: ${myState.datosEntrega}`]);


        }
    )
    .addAnswer(["Opciones de pago",
        "",
        "1️⃣ Efectivo",
        "2️⃣ Nequi",
        "3️⃣ QR del Negocio"],
        {
            capture: true,
        },
        async (ctx, { flowDynamic, state }) => {

            const metodoPago = {
                1: "su pedido llegara aproximadamente en 1 hora, gracias por tu compra te esperamos pronto nuevamente",
                2: "Nequi: 3006723128",
                3: "qr",

            };

            if (ctx.body == 1) {
                await state.update({ pago: metodoPago[ctx.body] });
                const myState = state.getMyState();
                await flowDynamic(["Genial, este es el resumen de su pedido:",
                    `Producto: ${myState.article}`,
                    `Salsa: ${myState.salsa}`,
                    `Datos de Entrega: ${myState.datosEntrega}`,
                    `Forma de pago: Efectivo, ${myState.pago}`,
                    `Total a cancelar:, $${myState.cuenta}`,
                    `Si está todo correcto escriba *pedir* y su pedido quedará agendado`,
                ]);
            } else if (ctx.body == 2) {
                await state.update({ pago: metodoPago[ctx.body] });
                const myState = state.getMyState();
                await flowDynamic(["Genial, este es el resumen de su pedido:",
                    `Producto: ${myState.article}`,
                    `Salsa: ${myState.salsa}`,
                    `Datos de Entrega: ${myState.datosEntrega}`,
                    `Forma de pago: ${myState.pago}`,
                    `Total a cancelar:, $${myState.cuenta}`,
                    `Porfavor envianos el comprobante`,
                ]);
            } else if (ctx.body == 3) {
                await state.update({ pago: metodoPago[ctx.body] });
                const myState = state.getMyState();
                await flowDynamic([
                    {
                        media: 'https://randomqr.com/assets/images/randomqr-256.png',
                    }
                ]);
                await flowDynamic(["Genial, este es el resumen de su pedido:",
                    `Producto: ${myState.article}, Salsa: ${myState.salsa}`,
                    `Datos de Entrega: ${myState.datosEntrega}`,
                    `Forma de pago: ${myState.pago}`,
                    `Total a cancelar: $${myState.cuenta}`,
                    `Porfavor envianos el comprobante`,
                ]);

            }

        }
    )
    .addAnswer(
        ['🍓✨'],
        {
            capture: true,
        },
        async (ctx, { flowDynamic, state }) => {
            const myState = state.getMyState()
            await flowDynamic(`Terminamos ✅ ¡Gracias por preferirnos! su pedido llegará enseguida🚀`)
        }
    )


const flowThanks = addKeyword("gracias").addAnswer("Estoy aquí para ayudarte 🦁")

const flowWelcome = addKeyword(["hola", "holis", "buenas tardes", "buenos dias", "buenas", "buenas noches", "alo", "cotizar", "hola...", "buen", "buenas"])
    .addAnswer(['¡¡Hola!! ¡Bienvenido a Fresata!🍓'])
    .addAnswer(['La magia esta en nuestra crema ✨ Recuerda que los domicilios inician a partir de la 1:00 pm'])
    .addAnswer(['Un gusto atenderte, ¿en que podemos colaborarte?',
        ' ',
        '1️⃣ Ver Menú',
        '2️⃣ Preguntar por un pedido'
    ], {
        delay: 1500
    }, null, [flowForm, flowDiferentQuestion])






const main = async () => {
    const adapterDB = new JsonFileAdapter()
    const adapterFlow = createFlow([flowWelcome, flowThanks])
    const adapterProvider = createProvider(BaileysProvider)


    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
