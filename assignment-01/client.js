let net = require('net')
let JsonSocket = require('json-socket')
let Promise = require('bluebird')
let helper = require('./helper')

let socket = new JsonSocket(new net.Socket())
socket.connect(helper.PORT, helper.HOST)

socket.on('connect', () => {
    socket.on('message', (message) => {
        switch (message) {
            case 'bye':
                socket.sendEndMessage('bye')
                break;
            default:
                socket.sendMessage(`ack ${JSON.stringify(message)}`)
                break;
        }
    })
})
