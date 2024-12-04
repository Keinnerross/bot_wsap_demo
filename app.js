//Imports

const { createBot, createProvider, createFlow, addKeyword, } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('./myLibs/@bot-whatsapp/portal/lib/portal.http.cjs')
// const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('./myLibs/@bot-whatsapp/provider/lib/baileys/index.cjs')
const JsonFileAdapter = require('@bot-whatsapp/database/json')

////


const flowWelcome = require('./flows/welcome.js');
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
