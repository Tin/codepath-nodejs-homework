let net = require('net')
let JsonSocket = require('json-socket')
let helper = require('./helper')
let FileSync = require('./FileSync')

let server = net.createServer()
server.listen(helper.PORT)
console.log('Server is listening on port', helper.PORT)
let fileSync = new FileSync(helper.ROOT_DIR)

server.on('connection', (socket) => {
    socket = new JsonSocket(socket)

    fileSync.post(socket, 'foo/bar.txt', 'file', '123')
    .then(() => {
        fileSync.post(socket, 'foo/barz', 'dir')
    })
    .then(() => {
        fileSync.put(socket, 'foo/bar.txt', 'file', '234')
    })
    .then(() => {
        fileSync.delete(socket, 'foo', 'dir')
    })
    .then(() => {
        socket.sendMessage('bye')
    })

    socket.on('message', (message) => {
        console.log('server receive client message', message)
    })
    socket.on('error', console.error)
})
