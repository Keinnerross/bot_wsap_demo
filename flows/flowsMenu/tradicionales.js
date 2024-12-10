const { addKeyword, addAnswer } = require('@bot-whatsapp/bot');
const menu = require('../flowsData/menuData.js');
const adicionales = require('../flowsData/adicionales.js');
const menuChossed = menu[1 - 1];
const db = require('../../firebase.js');
const { adicionalesAnswer, adicionalesLogic, pedirAnswer, pedirLogic } = require('../adicionalesFlow.js');
const { datosEntrega, metodosPago, validacionComprobante, generarPedido } = require('../payflow.js');
const restState = require('../utils/restState.js');

///TRADICIONALES


const salsas = [
    "Leche Condensada",
    "Arequipe",
    "Leche Condensada y Arequipe + $(3.000)",
]






const tradicionales = addKeyword("1").addAnswer([`${menuChossed.producto} es una buena elección!`,
    "",
    "Escoge una *salsa*",
    "",
...salsas.map((salsa, index) => `${index + 1}\u20E3 ${salsa}`)],
    {
        capture: true,
    },
    async (ctx, { flowDynamic, state, fallBack }) => {

        const keys = ["producto", "salsas", "toppings", "extras", "cuenta"]
        await restState(state, keys) //Reseteamos el estado pra que no guarde valores de otras conversaciones
        await state.update({ producto: menuChossed.producto });
        await state.update({ cuenta: menuChossed.precio });


        if (salsas[ctx.body - 1]) {

            const salsaChosed = ctx.body == 3 ? "Leche Condensada y Arequipe" : salsas[ctx.body - 1]

            await state.update({ salsas: salsaChosed }); // Guarda salsa seleccionada

            if (ctx.body == 3) {
                await state.update({ salsas: salsaChosed }); // Guarda salsa seleccionada

                const myState = state.getMyState();
                cuentaActual = myState.cuenta
                await state.update({ cuenta: cuentaActual + 3000 }); //Si es que la salsa tiene costo extra hace la suma

            }
            const myState = state.getMyState();
            await flowDynamic([
                `${salsaChosed} buena elección!!`,
            ]);

        } else {
            return fallBack();
        }

    }
)
    .addAnswer(adicionalesAnswer, { capture: true, }, adicionalesLogic)
    .addAnswer(pedirAnswer, { capture: true }, pedirLogic)
    .addAnswer(datosEntrega.answer, { capture: true }, datosEntrega.logic)
    .addAnswer(metodosPago.answer, { capture: true }, metodosPago.logic)
    .addAnswer(validacionComprobante.answer, { capture: true }, validacionComprobante.logic)
    .addAnswer(generarPedido.answer, null, generarPedido.logic)







module.exports = tradicionales;


