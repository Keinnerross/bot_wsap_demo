module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
    },
    parserOptions: {
        ecmaVersion: 2023, // Asegúrate de que la versión de ECMAScript esté actualizada
        sourceType: 'module', // Esto es clave para que ESLint entienda los imports y exports
    },
    plugins: ['bot-whatsapp'],
    extends: ['plugin:bot-whatsapp/recommended'],
}
