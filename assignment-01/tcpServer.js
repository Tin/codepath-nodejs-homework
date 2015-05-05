let net = require('net')
let JsonSocket = require('json-socket')
let helper = require('./helper')
let FileSync = require('./FileSync')

function createServer() {
    let server = net.createServer()
    server.listen(helper.TCP_PORT)
    console.log('TCP server is listening on port', helper.TCP_PORT)
    let fileSync = new FileSync(helper.ROOT_DIR)

    server.on('connection', (socket) => {
        socket = new JsonSocket(socket)

        // Simulate file changes, TODO: hook to fs.watch
        fileSync.post(socket, 'foo', 'dir')
        .then(() => {
            fileSync.post(socket, 'foo/bar.txt', 'file', '123')
        })
        .then(() => {
            return fileSync.post(socket, 'foo/barz', 'dir')
        })
        .then(() => {
            return fileSync.put(socket, 'foo/bar.txt', 'file', '234')
        })
        // .then(() => {
        //     return fileSync.delete(socket, 'foo', 'dir')
        // })
        .then(() => {
            return socket.sendMessage('bye')
        })

        socket.on('message', (message) => {
            console.log('server receive client message', message)
        })
        socket.on('error', console.error)
    })

    return server
}

module.exports = createServer
