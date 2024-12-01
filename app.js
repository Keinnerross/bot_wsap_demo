//Imports

const { createBot, createProvider, createFlow, addKeyword, } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const JsonFileAdapter = require('@bot-whatsapp/database/json')
const { EVENTS } = require('@bot-whatsapp/bot/')

////


const flowWelcome = require('./src/flows/welcome.js');
const flowThanks = addKeyword("gracias").addAnswer("Estoy aquí para ayudarte 🦁")






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
