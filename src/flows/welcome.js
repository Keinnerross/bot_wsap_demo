const { addKeyword } = require('@bot-whatsapp/bot');


const menu = require('./flowsData/menuData.js');
const tradicionales = require('./flowsMenu/tradicionales.js');
const cremaDuraznos = require('./flowsMenu/CremaDuraznos.js');
const chocolate = require('./flowsMenu/chocolate.js');
const bubolFresa = require('./flowsMenu/bubolFresa');
const unToppingUnaSalsa = require('./flowsMenu/unToppingUnaSalsa');
const dosToppingsUnaSalsa = require('./flowsMenu/dosToppingsUnaSalsa.js');


const flowWelcome = addKeyword(["hola", "holis", "hoa", "buenas tardes", "buenos dias", "buenas", "buenas noches", "alo", "cotizar", "hola...", "buen", "buenas"])
    .addAnswer(['¡¡Hola hola!! ¡Bienvenidos a Fresata! La magia esta en nuestra crema', ' Recuerda que los domicilios inician a partir de la 1:00 pm.', 'Un gusto atenderte, ¿en que podemos colaborarte?'])
    .addAnswer(["Nuestra carta:",
        "Selecciona el *número* de su preferencia",
        "",
        ...menu.map((item, index) => `*${index + 1}️⃣* ${item.producto} - $${item.precio.toLocaleString()}`)
    ], {
        delay: 1500
    }, null, [tradicionales, cremaDuraznos, chocolate, bubolFresa, unToppingUnaSalsa, dosToppingsUnaSalsa]);



module.exports = flowWelcome;


