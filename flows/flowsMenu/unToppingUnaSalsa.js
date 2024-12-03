///BubolFresa

//Imports
const { addKeyword, addAnswer } = require('@bot-whatsapp/bot');
const menu = require('../flowsData/menuData.js');
const adicionales = require('../flowsData/adicionales.js');
const db = require('../../firebase.js');
const { adicionalesAnswer, adicionalesLogic, pedirAnswer, pedirLogic } = require('../adicionalesFlow.js');
const { datosEntrega, metodosPago, validacionComprobante, generarPedido } = require('../payflow.js')
const restState = require('../utils/restState.js');


//variables
const bodyEntry = 2; // entrada del usuario, es decir, la opción que elige.
const menuChossed = menu[bodyEntry - 1];



const salsas = [
    "Leche Condensada",
    "Arequipe",
    "Chocolate Blanco",
    "Chocolate Negro",
]


const unToppingUnaSalsa = addKeyword(bodyEntry.toString()).addAnswer([`${menuChossed.producto} es una buena elección!`,
    "",
    "Escoje una *salsa* gratis",
    "",
...salsas.map((salsa, index) => `${index + 1}\u20E3 ${salsa}`)
],
    {
        capture: true,
    },
    async (ctx, { flowDynamic, state, fallBack }) => {


        const keys = ["producto", "salsas", "toppings", "extras", "cuenta"] //Valores al rest, se agregan más si es necesario
        await restState(state, keys) //Reseteamos el estado pra que no guarde valores de otras conversaciones
        await state.update({ producto: menuChossed.producto });
        await state.update({ cuenta: menuChossed.precio });

        if (salsas[ctx.body - 1]) {

            await state.update({ salsas: salsas[ctx.body - 1] });

            const myState = state.getMyState();
            await flowDynamic([
                `${myState.salsas} buena elección!!`,
            ]);

        } else {
            return fallBack();
        }

    }
).addAnswer(["Escoje una *segunda salsa* gratis"],
    {
        capture: true,
    },
    async (ctx, { flowDynamic, state, fallBack }) => {



        if (salsas[ctx.body - 1]) {
            const myStateBefore = state.getMyState();

            const currentSalsa = myStateBefore.salsas
            await state.update({ salsas: currentSalsa + ", " + salsas[ctx.body - 1] }); // Guarda salsa seleccionada

            const myStateAfter = state.getMyState();

            await flowDynamic([
                `Salsas elegidas: ${myStateAfter.salsas}`,
            ]);

        } else {
            return fallBack();
        }

    }
).addAnswer(["*Escoge un Topping:*",
    ...adicionales.toppingsClasicos.map((item, index) => `${index + 1} *.-* _${item.topping}_`),
], {
    capture: true
}, async (ctx, { flowDynamic, state, fallBack }) => {


    if (ctx.body >= 1 && ctx.body <= adicionales.toppingsClasicos.length) {
        const toppingChoosed = adicionales.toppingsClasicos[ctx.body - 1].topping;

        await state.update({ toppings: toppingChoosed });
        const myState = state.getMyState();


        await flowDynamic(`${myState.toppings} ¡Genial!`)
    } else {
        return fallBack();
    }



})
    .addAnswer(adicionalesAnswer, { capture: true, }, adicionalesLogic)
    .addAnswer(pedirAnswer, { capture: true }, pedirLogic)
    .addAnswer(datosEntrega.answer, { capture: true }, datosEntrega.logic)
    .addAnswer(metodosPago.answer, { capture: true }, metodosPago.logic)
    .addAnswer(validacionComprobante.answer, { capture: true }, validacionComprobante.logic)
    .addAnswer(generarPedido.answer, null, generarPedido.logic)







module.exports = unToppingUnaSalsa;


