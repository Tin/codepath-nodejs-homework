let net = require('net')
let JsonSocket = require('json-socket')
let helper = require('./helper')

let server = net.createServer()
server.listen(helper.PORT)
console.log('Server is listening on port', helper.PORT)

server.on('connection', (socket) => {
    socket = new JsonSocket(socket)
    socket.on('message', (message) => {
        var result = message.a + message.b;
        socket.sendEndMessage({result: result});
    })
})
