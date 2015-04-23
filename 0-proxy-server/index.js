let http = require('http')
let request = require('request')
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv
let scheme = 'http://'
let port = argv.port || argv.host === '127.0.0.1' ? 8000 : 80
let outputStream = argv.log ? fs.createWriteStream(argv.log) : process.stdout

let log = (message) => console.log(message)

let startEchoServer = (onPort) => {
    http
    .createServer((req, res) => {
        log(`Request received at: ${req.url}`)
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
        let destinationUrl = req.headers['x-desination-url'] ||
            argv.url ||
            `${scheme}${argv.host}:${port}`

        log(`Proxying request to: ${destinationUrl + req.url}`)

        req.pipe(process.stdout)
        let options = {
            headers: req.headers,
            url: `http://${destinationUrl}${req.url}`,
            method: req.method
        }
        let downstreamResponse = req.pipe(request(options))
        log('\n\n\n' + JSON.stringify(downstreamResponse.headers))
        downstreamResponse.pipe(outputStream)
        downstreamResponse.pipe(res)
    })
    .listen(onPort)
    log(`Proxy server is listening on ${onPort}`)
}

startEchoServer(8000)
startEchoServer(8001)
