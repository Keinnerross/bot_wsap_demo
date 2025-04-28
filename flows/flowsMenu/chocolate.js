const { addKeyword, addAnswer } = require('@bot-whatsapp/bot');

///CREMA Y DURAZNOS
const menu = require('../flowsData/menuData.js');
const adicionales = require('../flowsData/adicionales.js');
const menuChossed = menu[5 - 1];
const db = require('../../firebase.js');
const { adicionalesAnswer, adicionalesLogic, pedirAnswer, pedirLogic } = require('../adicionalesFlow.js');
const { datosEntrega, metodosPago, validacionComprobante, generarPedido } = require('../payflow.js')
const restState = require('../utils/restState.js');



const salsas = [
    "Chocolate Blanco",
    "Chocolate Negro",
    "Combinado"
]

const chocolate = addKeyword("5").addAnswer([`${menuChossed.producto} es una buena elección!`,
    "",
    "Escoge una *salsa gratis*",
    "",
...salsas.map((salsa, index) => `${index + 1}\u20E3 ${salsa}`)
],
    {
        capture: true,
    },
    async (ctx, { flowDynamic, state }) => {

        const keys = ["producto", "salsas", "toppings", "extras", "cuenta"] //Valores al rest, se agregan más si es necesario
        await restState(state, keys) //Reseteamos el estado pra que no guarde valores de otras conversaciones


        //Guarda producto seleccionado y el precio en la cuenta del flujo anterior por ahora manual
        await state.update({ producto: menuChossed.producto });
        await state.update({ cuenta: menuChossed.precio });
        await state.update({ salsas: salsas[ctx.body - 1] }); // Guarda salsa seleccionada

        const myState = state.getMyState();

        await flowDynamic([`${myState.salsas} buena elección!!`]);
    })
    .addAnswer(adicionalesAnswer, { capture: true, }, adicionalesLogic)
    .addAnswer(pedirAnswer, { capture: true }, pedirLogic)
    .addAnswer(datosEntrega.answer, { capture: true }, datosEntrega.logic)
    .addAnswer(metodosPago.answer, { capture: true }, metodosPago.logic)
    .addAnswer(validacionComprobante.answer, { capture: true }, validacionComprobante.logic)
    .addAnswer(generarPedido.answer, null, generarPedido.logic)






module.exports = chocolate;


