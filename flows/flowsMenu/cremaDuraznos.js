const { addKeyword, addAnswer } = require('@bot-whatsapp/bot');

///CREMA Y DURAZNOS
const menu = require('../flowsData/menuData.js');
const adicionales = require('../flowsData/adicionales.js');
const menuChossed = menu[4 - 1];
const db = require('../../firebase.js');
const { adicionalesAnswer, adicionalesLogic, pedirAnswer, pedirLogic } = require('../adicionalesFlow.js');
const { datosEntrega, metodosPago, validacionComprobante, generarPedido } = require('../payflow.js')
const restState = require('../utils/restState.js');



const salsas = [
    "Leche condensada",
    "Arequipe",
    "Chocolate Blanco",
    "Chocolate Negro"
]


const cremaDuraznos = addKeyword("4").addAnswer([`${menuChossed.producto} es una buena elección!`,
    "",
    "Escoje una *salsa gratis*",
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
        await state.update({ salsas: salsas[ctx.body - 1] });

        const myState = state.getMyState();

        await flowDynamic([`${myState.salsas} buena elección!!`]);
    })
    .addAnswer(adicionalesAnswer, { capture: true, }, adicionalesLogic)
    .addAnswer(pedirAnswer, { capture: true }, pedirLogic)
    .addAnswer(datosEntrega.answer, { capture: true }, datosEntrega.logic)
    .addAnswer(metodosPago.answer, { capture: true }, metodosPago.logic)
    .addAnswer(validacionComprobante.answer, { capture: true }, validacionComprobante.logic)
    .addAnswer(generarPedido.answer, null, generarPedido.logic)







module.exports = cremaDuraznos;


