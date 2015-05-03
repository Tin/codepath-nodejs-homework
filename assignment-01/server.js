let net = require('net')
let JsonSocket = require('json-socket')
let helper = require('./helper')

let server = net.createServer()
server.listen(helper.PORT)
console.log('Server is listening on port', helper.PORT)

server.on('connection', (socket) => {
    socket = new JsonSocket(socket)
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
    socket.on('error', console.error)
})
