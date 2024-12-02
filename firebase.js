require('dotenv').config(); // Carga el archivo .env
const admin = require('firebase-admin');
const path = require('path');

// Verifica que la variable FIREBASE_KEY_PATH esté cargada correctamente
if (!process.env.FIREBASE_KEY_PATH) {
    throw new Error('La variable FIREBASE_KEY_PATH no está definida en el archivo .env');
}

console.log('Ruta del archivo de credenciales:', process.env.FIREBASE_KEY_PATH);

// Convierte la ruta relativa a una ruta absoluta
const serviceAccountPath = path.resolve(process.env.FIREBASE_KEY_PATH);

// Asegúrate de que la ruta es correcta y que el archivo existe
const fs = require('fs');
if (!fs.existsSync(serviceAccountPath)) {
    throw new Error('El archivo de credenciales no existe en la ruta especificada: ' + serviceAccountPath);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = db;