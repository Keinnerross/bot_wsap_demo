///BubolFresa

//Imports
const { addKeyword, addAnswer } = require('@bot-whatsapp/bot');
const menu = require('../../flowsData/menuData.js');
const db = require('../../../firebase.js');
const { pedirAnswer, pedirLogic } = require('../../adicionalesFlow.js');
const { datosEntrega, metodosPago, validacionComprobante, generarPedido } = require('../../payflow.js')
const restState = require('../../utils/restState.js');

//variables
const bodyEntry = 6; // entrada del usuario, es decir, la opción que elige.
const menuChossed = menu[bodyEntry - 1];




const dubaiCream = addKeyword(bodyEntry.toString()).addAnswer([`Dubai cream pistacho es una buena elección!`], null,
    async (ctx, { flowDynamic, state }) => {

        const keys = ["producto", "salsas", "toppings", "extras", "cuenta"] //Valores al rest, se agregan más si es necesario
        await restState(state, keys) //Reseteamos el estado pra que no guarde valores de otras conversaciones


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
    .addAnswer(pedirAnswer, { capture: true }, pedirLogic)
    .addAnswer(datosEntrega.answer, { capture: true }, datosEntrega.logic)
    .addAnswer(metodosPago.answer, { capture: true }, metodosPago.logic)
    .addAnswer(validacionComprobante.answer, { capture: true }, validacionComprobante.logic)
    .addAnswer(generarPedido.answer, null, generarPedido.logic)



    module.exports = dubaiCream;
