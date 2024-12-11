const adicionales = require('./flowsData/adicionales');


// Answer:
const adicionalesAnswer = ["*Adicionales:*",
    "¿Quieres mas salsas o toppings por un costo adicional?",
    "",
    "*Salsas: $3.000*",
    ...adicionales.salsas.map((item, index) => `${index + 1} *.-* _${item.salsa}_`),
    "",
    "*Toppings clasicos: $3.000*",
    //El valor del 5 es definido por la cantidad de salsas que hay es decir salsa.lenght, ahora es manual.
    ...adicionales.toppingsClasicos.map((item, index) => `${index + 5} *.-* _${item.topping}_`),
    "",
    "*Toppings Premium: $4.000*",
    ...adicionales.toppingsPremiums.map((item, index) => `${index + 16} *.-* _${item.topping}_`),
    "",
    "0.- No gracias"
]


const pedirAnswer = "Si está todo correcto escriba *pedir* para hacer su pedido";



//LogicValidation
const adicionalesLogic = async (ctx, { flowDynamic, state, fallBack }) => {

    //ctx.body <= 4 Quiere decir que eligió como adicional salsas
    if (ctx.body >= 1 && ctx.body <= 4) {
        const myState = state.getMyState();
        const cuentaActual = myState.cuenta;
        const adicionalChossed = adicionales.salsas[ctx.body - 1]; // hacemos a resta pq estamos filtrando por indice no por lenght y el usuario escribe numeros desde le 1
        //

        await state.update({ extras: adicionalChossed.salsa }); // Guarda salsa seleccionada
        await state.update({ cuenta: cuentaActual + adicionalChossed.precio }); //Si es que la salsa tiene costo extra hace la suma
        console.log("mi cuenta: " + myState.cuenta)


    }

    //ctx.body <= 4 Quiere decir que eligió como adicional Toppings clasicos
    else if (ctx.body >= 5 && ctx.body <= 15) {
        const myState = state.getMyState();
        const cuentaActual = myState.cuenta;
        const adicionalChossed = adicionales.toppingsClasicos[ctx.body - 5]; // hacemos a resta pq estamos filtrando por indice no por lenght y el usuario escribe numeros desde le 1
        //


        await state.update({ extras: adicionalChossed.topping }); // Guarda topping seleccionada
        await state.update({ cuenta: cuentaActual + 3000 }); //Si es que la topping tiene costo extra hace la suma



    }
    else if (ctx.body >= 16 && ctx.body <= 24) {
        const myState = state.getMyState();
        const cuentaActual = myState.cuenta;
        const adicionalChossed = adicionales.toppingsPremiums[ctx.body - 16]; // hacemos a resta pq estamos filtrando por indice no por 


        await state.update({ extras: adicionalChossed.topping }); // Guarda topping seleccionada
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
        myState.producto && `*Producto:* ${myState.producto}`,
        myState.salsas && `*Salsas:* ${myState.salsas}`,
        myState.toppings && `*Toppings:* ${myState.toppings}`,
        myState.extras && `*Extras:* ${myState.extras}`,
        `*Total a cancelar:* $${myState.cuenta.toLocaleString()}`,


    ].filter(Boolean);


    await flowDynamic(resume.join('\n'));

}

const pedirLogic = (ctx, { fallBack }) => {
    if (ctx.body.toLowerCase() != "pedir") {
        return fallBack()
    }
}


module.exports = { adicionalesAnswer, adicionalesLogic, pedirAnswer, pedirLogic };