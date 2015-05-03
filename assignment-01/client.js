let net = require('net')
let assert = require('assert')
let path = require('path')
let JsonSocket = require('json-socket')
let helper = require('./helper')
let Promise = require('bluebird')

var socket = new JsonSocket(new net.Socket())
socket.connect(helper.PORT, helper.HOST)

function debug() {
    console.log.apply(null, arguments)
}

function createContext(action, path, type='file', contents) {
    let ctx = {
        path: path,
        type: type,
        contents: contents,
        action: action
    }
    return Promise.resolve(ctx)
}

function assertType(ctx) {
    assert(['file', 'dir'].indexOf(ctx.type) !== -1, 'type should be "file" or "dir"')
    return Promise.resolve(ctx)
}

function getTargetFrom(ctx) {
    ctx.target = path.join(helper.ROOT_DIR, ctx.path)
    debug(ctx.action, ctx.target)
    return Promise.resolve(ctx)
}

function sendMessage(ctx) {
    let message = {
        action: ctx.action,
        path: ctx.target,
        type: ctx.type,
        contents: ctx.contents, // TODO: base64,
        updated: new Date().getTime()
    }
    debug('send message', message)
    return new Promise((resolve) => {
        socket.sendMessage(message, () => resolve(ctx))
    })
}

function post(path, type, contents) {
    return createContext('create', ...arguments)
    .then(assertType)
    .then(getTargetFrom)
    .then(sendMessage)
}

function put(path, type, contents) {
    return createContext('update', ...arguments)
    .then(assertType)
    .then(getTargetFrom)
    .then(sendMessage)
}

socket.on('connect', () => {
    post('foo/bar.txt')
    .then(() => {
        put('foot/bar.txt')
    })
    .then(() => {
        socket.sendMessage('bye')
    })
    socket.on('message', (message) => {
        console.log(message)
    })
})
