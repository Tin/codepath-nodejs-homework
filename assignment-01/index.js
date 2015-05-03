let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
let mkdirp = require('mkdirp')
let rimraf = require('rimraf')
let yargv = require('yargs')

let argv = yargv
    .default('dir', process.cwd())
    .argv

require('longjohn')
require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = argv.dir

let loadFsContents = (req, res, next) => {
    nodeify(async ()=> {
        if (req.stat.isDirectory()) {
            let files = await fs.promise.readdir(req.filePath)
            res.body = JSON.stringify(files)
            res.setHeader('Content-Length', res.body.length)
            res.setHeader('Content-Type', 'application/json')
            return
        } else {
            res.setHeader('Content-Length', req.stat.size)
            let contentType = mime.contentType(path.extname(req.filePath))
            res.setHeader('Content-Type', contentType)
        }
    }(), next)
}

let setFileMeta = (req, res, next) => {
    req.filePath = path.resolve(path.join(ROOT_DIR, req.url))
    if (!req.filePath.startsWith(ROOT_DIR)) {
        res.status(400).send('Invalid path')
        return
    }
    console.log('request', req.filePath)
    fs.promise.stat(req.filePath)
        .then((stat) => {
            req.stat = stat
        }, () => {
            req.stat = null
        })
        .nodeify(next)
}

let setDirDetails = (req, res, next) => {
    let endsWithSlash = req.filePath.endsWith(path.sep)
    let hasExt = (path.extname(req.filePath) !== '')
    req.isDir = (endsWithSlash || !hasExt)
    req.dirPath = req.isDir ? req.filePath : path.dirname(req.filePath)
    next()
}

let app = express()

if (NODE_ENV === 'devlopment') {
    app.use(morgan('dev'))
}

app.listen(PORT, () => {
    console.log(`listening at http://127.0.0.1:${PORT}`)
})

app.get('*', setFileMeta, loadFsContents, (req, res) => {
    if(res.body) {
        res.json(res.body)
        return
    } else {
        fs.createReadStream(req.filePath).pipe(res)
    }
})

app.head('*', setFileMeta, loadFsContents, (req, res) => {
    res.end()
})

app.delete('*', setFileMeta, (req, res, next) => {
    nodeify(async () => {
        if (req.stat === null) {
            return res.status(400).send('Invalid Path [Delete]')
        }
        if (req.stat.isDirectory()) {
            await rimraf.promise(req.filePath)
        } else {
            await fs.promise.unlink(req.filePath)
        }
        res.end()
    }(), next)
})

app.put('*', setFileMeta, setDirDetails, (req, res, next) => {
    async () => {
        if (req.stat) {
            return res.status(405).send('File exists')
        }
        await mkdirp.promise(req.dirPath)
        if (!req.isDir) {
            req.pipe(fs.createWriteStream(req.filePath))
        }
        res.end()
    }().catch(next)
})

app.post('*', setFileMeta, setDirDetails, (req, res, next) => {
    async () => {
        if (req.stat === null) {
            return res.status(405).send('File does not exist')
        } else if (req.isDir) {
            return res.status(405).send('Path is a directory')
        }

        await fs.promise.truncate(req.filePath, 0)
        if (!req.isDir) {
            req.pipe(fs.createWriteStream(req.filePath))
        }
        res.end()
    }().catch(next)
})
