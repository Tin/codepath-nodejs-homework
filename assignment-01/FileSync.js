let path = require('path')
let helper = require('./helper')
let debug = helper.debug
let assert = require('assert')

function createContext(socket, action, rootDir, path, type='file', contents) {
    let ctx = {
        path: path,
        type: type,
        contents: contents,
        action: action,
        rootDir: rootDir,
        socket: socket
    }
    return Promise.resolve(ctx)
}

function assertType(ctx) {
    assert(['file', 'dir'].indexOf(ctx.type) !== -1, 'type should be "file" or "dir"')
    return Promise.resolve(ctx)
}

function getTargetFrom(ctx) {
    ctx.target = path.join(ctx.rootDir, ctx.path)
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
        ctx.socket.sendMessage(message, () => resolve(ctx))
    })
}

class FileSync {
    constructor(rootDir) {
        this.rootDir = rootDir
    }

    post(socket, path, type, contents) {
        return createContext(socket, 'create', this.rootDir, path, type, contents)
        .then(assertType)
        .then(getTargetFrom)
        .then(sendMessage)
    }

    put(socket, path, type, contents) {
        return createContext(socket, 'update', this.rootDir, path, type, contents)
        .then(assertType)
        .then(getTargetFrom)
        .then(sendMessage)
    }

    delete(socket, path, type) {
        return createContext(socket, 'delete', this.rootDir, path, type)
        .then(assertType)
        .then(getTargetFrom)
        .then(sendMessage)
    }
}

module.exports = FileSync
