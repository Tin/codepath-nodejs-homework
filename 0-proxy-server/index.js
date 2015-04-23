// imports
let http = require('http')
let fs = require('fs')
let request = require('request')
let yargv = require('yargs')

let argv = yargv
    .default('host', '127.0.0.1')
    .argv

const scheme = 'http://'

let port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80)

let initializeWriteStream = (_argv) => {
    let writeStream = process.stdout
    if (_argv.log) {
        console.log(`output to ${_argv.log}`)
        writeStream = fs.createWriteStream(_argv.log)
    }

    writeStream.on('error', (err) => {
        console.log(err)
    })

    writeStream.on('close', (err) => {
        console.log('close', err)
    })

    return [writeStream,
        (message) => {
            writeStream.write(`\n\n${message}`)
        }
    ]
}

let [outputStream, log] = initializeWriteStream(argv)

let startEchoServer = (onPort) => {
    http
    .createServer((req, res) => {
        log(`Request received at: ${req.url}`)
        log(JSON.stringify(req.headers))
        req.pipe(outputStream, { end: false })

        for (let header in req.headers) {
            res.setHeader(header, req.headers[header])
        }
        req.pipe(res)
    })
    .listen(onPort)

    log(`Echo server is listening on ${onPort}`)
}


let startProxyServer = (onPort) => {
    http
    .createServer((req, res) => {
        let downstreamDomain = argv.url || `${scheme}${argv.host}:${port}`
        let downstreamUrl = req.headers['x-desination-url'] || `${downstreamDomain}${req.url}`

        log(`Proxying request to: ${downstreamUrl}`)
        log(JSON.stringify(req.headers))
        req.pipe(outputStream, { end: false })

        let options = {
            headers: req.headers,
            url: downstreamUrl,
            method: req.method
        }

        let downstreamResponse = req.pipe(request(options))

        log(`Proxy request to ${downstreamUrl} ${JSON.stringify(downstreamResponse.headers)}`)
        downstreamResponse.pipe(outputStream, { end: false })
        downstreamResponse.pipe(res)
    })
    .listen(onPort)
    log(`Proxy server is listening on ${onPort}`)
}

startEchoServer(8000)
startProxyServer(8001)
