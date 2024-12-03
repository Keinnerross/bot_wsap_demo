async function restState(state, keys) {
    for (let key of keys) {
        await state.update({ [key]: false });
    }
}

module.exports = restState;