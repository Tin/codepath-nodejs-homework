let net = require('net')
let JsonSocket = require('json-socket')
let Promise = require('bluebird')
let helper = require('./helper')
let FileSync = require('./FileSync')

let socket = new JsonSocket(new net.Socket())
socket.connect(helper.PORT, helper.HOST)
let fileSync = new FileSync(helper.ROOT_DIR)

function sendMessage(message) {
    console.log(message)
    socket.sendMessage(message)
}

socket.on('connect', () => {
    socket.on('message', (message) => {
        switch (message) {
            case 'bye':
                sendMessage('bye')
                break;
            default:
                fileSync.onMessage(message)
                .then(() => {
                    sendMessage(`${message.action} ${message.path} done`)
                })
                .catch((error) => {
                    sendMessage(`${message.action} ${message.path}, ${error.message ? error.message : error}`)
                })
                break;
        }
    })
})
