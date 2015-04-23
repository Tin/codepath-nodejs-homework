let http = require('http')
let request = require('request')

http
.createServer((req, res) => {
    console.log(`Request received at: ${req.url}`)
    for (let header in req.headers) {
        res.setHeader(header, req.headers[header])
    }
    req.pipe(res)
})
.listen(8000)

http
.createServer((req, res) => {
    let destinationUrl = '127.0.0.1:8000'
    console.log(`Proxying request to: ${destinationUrl + req.url}`)

    req.pipe(process.stdout)
    let options = {
        headers: req.headers,
        url: `http://${destinationUrl}${req.url}`,
        method: req.method
    }
    let downstreamResponse = req.pipe(request(options))
    process.stdout.write('\n\n\n' + JSON.stringify(downstreamResponse.headers))
    downstreamResponse.pipe(process.stdout)
    downstreamResponse.pipe(res)
})
.listen(8001)
