let net = require('net')
let JsonSocket = require('json-socket')
let helper = require('./helper')

var socket = new JsonSocket(new net.Socket())
socket.connect(helper.PORT, helper.HOST)
socket.on('connect', () => {
    socket.sendMessage({
        a: 5,
        b: 7
    })
    socket.on('message', (message) => {
        console.log('The result is: '+message.result)
    })
})
