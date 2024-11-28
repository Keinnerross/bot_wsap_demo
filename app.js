

const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const JsonFileAdapter = require('@bot-whatsapp/database/json')
const { EVENTS } = require('@bot-whatsapp/bot/')




const flowDiferentQuestion = addKeyword("2").addAnswer("Perfecto, deja tu mensaje y enseguida uno de nuestros artistas se comunicará contigo 😸")

const flowForm = addKeyword("1").addAnswer("¿Cómo te llamas?",
    {
        capture: true,
    },
    async (ctx, { flowDynamic, state }) => {
        await state.update({ name: ctx.body })
        const myState = state.getMyState()
        await flowDynamic(`Un gusto conocerte ${myState.name}!`)
    }
)
    .addAnswer(
        '¿Cómo nos conociste?',
        {
            capture: true,
        },
        async (ctx, { flowDynamic, }) => {
            await flowDynamic(`Genial!`)
        }
    )
    .addAnswer(
        'Cuentame ¿qué te gustaría tatuarte?',
        {
            capture: true,
        },
        async (ctx, { flowDynamic }) => {
            await flowDynamic("Suena bien!")
        }
    )
    .addAnswer(
        '¿Tienes alguna referencia? *Envía una foto o Imagen*',
        {
            capture: true,
        },
        async (ctx, { flowDynamic, fallBack }) => {
            if (!ctx.body.includes("media_")) {
                return fallBack()
            } else {
                await flowDynamic("Súper!")
            }


        }
    ).addAnswer(
        '¿En que área te gustaría tatuarlo?',
        {
            capture: true,
        }, null
    )
    .addAnswer(
        '¿Algún tamaño estimado en centímetros? (Esta bien si no tienes un tamaño especifico)',
        {
            capture: true,
        },
        null
    )
    .addAnswer(
        'Cuando te gustaría tatuarte?',
        {
            capture: true,
        },
        null
    )
    .addAnswer(
        ['En algunas ocasiones es necesario realizar una evaluación presencial, en caso de necesitarla ¿tendrías disponibilidad para asistir?'],
        {
            capture: true,
        },
        async (ctx, { flowDynamic, state }) => {
            const myState = state.getMyState()
            await flowDynamic(`Terminamos ✅ ¡Gracias ${myState.name} por responder las preguntas, en breve uno de nuestros artistas estará comunicandose contigo`, { media: "https://i.pinimg.com/564x/0b/21/0f/0b210f89a127b83ffa68ca830bd5f1c3.jpg" })
        }
    )


const flowThanks = addKeyword("gracias").addAnswer("Estoy aquí para ayudarte 🦁")

const flowWelcome = addKeyword(["hola", "holis", "buenas tardes", "buenos dias", "buenas", "buenas noches", "alo", "cotizar", "hola...", "buen", "buenas"])
    .addAnswer(['¡Hola!👋 Bienvenido/a Redlion Tattoo Studio. Soy Lion 🦁, su asistente virtual.'])
    .addAnswer(['Para cotizar con cualquiera de nuestros artistas debes responder las siguientes preguntas👀', " ", "1️⃣ ¡Si Comencemos!", "2️⃣ No gracias, Tengo una consulta diferente🤔"], {
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
