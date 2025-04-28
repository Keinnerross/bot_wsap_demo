const { addKeyword } = require('@bot-whatsapp/bot');

const menu = require('./flowsData/menuData.js');
const tradicionales = require('./flowsMenu/tradicionales.js');
const cremaDuraznos = require('./flowsMenu/cremaDuraznos.js');
const chocolate = require('./flowsMenu/chocolate.js');
const bubolFresa = require('./flowsMenu/bubolFresa');
const unToppingUnaSalsa = require('./flowsMenu/unToppingUnaSalsa');
const dosToppingsUnaSalsa = require('./flowsMenu/dosToppingsUnaSalsa');
const dubaiCream = require('./flowsMenu/OtrosProductos/dubaiCream.js');
const agua = require('./flowsMenu/OtrosProductos/agua.js');
const dubaiChocolat = require('./flowsMenu/OtrosProductos/dubaiChocolat.js');

// Este flujo muestra el menú:
const flowWelcome = addKeyword([
    "hola", "holis", "hoa", "buenas tardes", "buenos dias", "buenas noches", "alo", "cotizar", "hola..."
])
    .addAnswer([
        '¡¡Hola hola!! ¡Bienvenidos a Fresata! La magia está en nuestra crema 🍦✨',
        'Recuerda que los domicilios inician a partir de la 1:00 pm.',
        'Un gusto atenderte, ¿en qué podemos colaborarte?'
    ])
    .addAnswer([
        "Nuestra carta:",
        "Selecciona el *número* de tu preferencia 👇",
        "",
        ...menu.map((item, index) => `*${index + 1}️⃣* ${item.producto} - $${item.precio.toLocaleString()}`)
    ], {
        capture: true  // ⚡ Aquí capturamos la respuesta
    },
        async (ctx, { fallBack, gotoFlow }) => {
            const input = ctx.body.trim();

            if (["1", "2", "3", "4", "5", "6","7","8"].includes(input)) {
                // Si el input es válido, no hacemos nada aquí (los subflujos se activarán automáticamente)
                return;
            } else {
                // 🚨 Si no es válido, mandamos fallback bonito:
                return fallBack([
                    "🤔 Ups... Esa opción no es válida.",
                    "Por favor, elige un número del *1* al *5* de nuestro menú para continuar."
                ]);
            }
        },
        [
            tradicionales,
            cremaDuraznos,
            chocolate,
            unToppingUnaSalsa,
            dosToppingsUnaSalsa,
            dubaiCream,
            dubaiChocolat,
            agua
        ]
    );

module.exports = flowWelcome;
