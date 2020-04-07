const generateMessage = (text, username) => {
    return {
        text,
        createdAt: new Date().getTime(),
        createdFrom: username
    }
}

const generateLocationMessage = (location, username) => {
    return {
        location,
        createdAt: new Date().getTime(),
        createdFrom: username
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}