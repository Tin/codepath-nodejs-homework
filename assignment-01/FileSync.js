let path = require('path')
let fs = require('fs')
let helper = require('./helper')
let debug = helper.debug
let assert = require('assert')
let mkdirp = require('mkdirp')
let rimraf = require('rimraf')
let Insync = require('insync')
let Promise = require('bluebird')

require('songbird')

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
        this.supportedActions = ['create', 'update', 'delete']
        let self = this
        this.clientOperations = Insync.priorityQueue(function(payload, callback) {
            let method = 'on' + helper.capitalize(payload.action)
            self[method](payload)
            .then(() => {
                debug(`[${payload.updated}] ${payload.action} ${payload.type} ${payload.path} done`)
                callback()
            }, (error) => {
                debug(`[${payload.updated}] ${payload.action} ${payload.type} ${payload.path}, ${error.message ? error.message : error}`)
                callback()
            })
        }, 1) // run in series
        this.clientOperations.drain = () => {
            console.log('client operations queue is empty, waiting more')
        }
    }

    // server
    post(socket, path, type, contents) {
        return createContext(socket, 'create', this.rootDir, path, type, contents)
        .then(assertType)
        .then(getTargetFrom)
        .then(sendMessage)
    }

    // server
    put(socket, path, type, contents) {
        return createContext(socket, 'update', this.rootDir, path, type, contents)
        .then(assertType)
        .then(getTargetFrom)
        .then(sendMessage)
    }

    // server
    delete(socket, path, type) {
        return createContext(socket, 'delete', this.rootDir, path, type)
        .then(assertType)
        .then(getTargetFrom)
        .then(sendMessage)
    }

    // client
    onCreate(payload) {
        let p = new Promise((resolve, reject) => {
            fs.promise.stat(payload.path)
            .then((stat) => {
                reject(new Error(`File ${payload.path} already exist`))
            }, () => {
                if (payload.type === 'file') {
                    mkdirp.promise(path.dirname(payload.path))
                    .then(() => {
                        let ws = fs.createWriteStream(payload.path)
                        if (payload.contents) {
                            ws.write(payload.contents)
                        }
                        ws.end()
                        resolve()
                    }, reject)
                } else {
                    mkdirp.promise(path.dirname(payload.path)).then(resolve, reject)
                }
            })
        })
        return p
    }

    // client
    onUpdate(payload) {
        return new Promise((resolve, reject) => {
            fs.promise.stat(payload.path)
            .then((stat) => {
                if (stat.isDirectory() && payload.type === 'dir') {
                    reject(new Error(`Can\'t update directory ${payload.path}`))
                } else if (payload.type === 'file') {
                    fs.promise.truncate(payload.path, 0)
                    .then(() => {
                        let ws = fs.createWriteStream(payload.path)
                        if (payload.contents) {
                            ws.write(payload.contents)
                        }
                        ws.end()
                        resolve()
                    })
                    .catch((error) => {
                        reject(error)
                    })
                } else {
                    reject(new Error(`File type of ${payload.path} doesn\'t match ${payload.type}`))
                }
            }, () => {
                reject(new Error(`File ${payload.path} doesn\'t exist`))
            })
        })
    }

    // client
    onDelete(payload) {
        return new Promise((resolve, reject) => {
            fs.promise.stat(payload.path)
            .then((stat) => {
                if (stat.isDirectory()) {
                    return rimraf.promise(payload.path).then(resolve)
                } else {
                    return fs.promise.unlink(payload.path).then(resolve)
                }
            }, () => {
                reject(new Error(`File ${payload.path} doesn\'t exist`))
            })
        })
    }

    // client
    onMessage(payload) {
        assert(this.supportedActions.indexOf(payload.action) !== -1,
            `only support actions ${JSON.stringify(this.supportedActions)}, get ${payload.action}`)
        console.log('push', payload.action, payload.type, payload.path)
        return this.clientOperations.push(payload, payload.updated)
    }
}

module.exports = FileSync
