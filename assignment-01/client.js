let net = require('net')
let fs = require('fs')
let path = require('path')
let JsonSocket = require('json-socket')
let Promise = require('bluebird')
let request = require('request')
let helper = require('./helper')
let FileSync = require('./FileSync')
let mkdirp = require('mkdirp')

let ServerURL = `http://${helper.HOST}:${helper.PORT}`
function pathAt(path) {
    return `${ServerURL}${path}`
}

function localPath(relativePath) {
    return path.join(helper.ROOT_DIR, relativePath)
}

async function syncAllFromServer() {
    console.log('Client sync all content from server')
    return await fetch('/')
}

async function fetch(filePath) {
    console.log('fetching', filePath)
    if (/^\./i.test(filePath)) {
        console.log('ignore, won\'t fetch', filePath)
        return Promise.resolve()
    }
    return new Promise((resolve, reject) => {
        request.promise.get(pathAt(filePath)).then((responses) => {
            async () => {
                let res = responses[0]
                if (res.statusCode === 200) {
                    let contentType = res.headers['content-type']
                    if (contentType.startsWith('application/json')) {
                        let files = JSON.parse(JSON.parse(res.body))
                        console.log('create folder', localPath(filePath))
                        await mkdirp.promise(localPath(filePath))
                        for (let index = 0; index < files.length; ++index) {
                            let subPath = files[index]
                            if (!/^\./i.test(subPath)) {
                                let fullPath = path.join(filePath, subPath)
                                await fetch(fullPath)
                            }
                        }
                    } else {
                        // it's a file
                        res.pipe(fs.createWriteStream(localPath(filePath)))
                        console.log('save', contentType, 'to', localPath(filePath))
                    }
                    resolve(res)
                } else {
                    reject(res)
                }
            }()
        })
    })
}

async function listenForChanges() {
    console.log('Client start listening changes')
    let socket = new JsonSocket(new net.Socket())
    socket.connect(helper.TCP_PORT, helper.HOST)
    console.log(`dir is ${helper.ROOT_DIR}`)
    let fileSync = new FileSync(helper.ROOT_DIR)

    function sendMessage(message) {
        console.log(message)
        socket.sendMessage(message)
    }

    socket.on('connect', () => {
        console.log(`connect to server at ${helper.HOST}${helper.TCP_PORT}`)
        socket.on('message', (message) => {
            switch (message) {
                case 'bye':
                    sendMessage('bye')
                    break;
                default:
                    fileSync.onMessage(message)
                    break;
            }
        })
    })
}

async () => {
    await listenForChanges()
    await syncAllFromServer()
}()
