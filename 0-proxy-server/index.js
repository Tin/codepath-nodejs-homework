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
    let options = {
        headers: req.headers,
        url: `http://${destinationUrl}${req.url}`,
        method: req.method
    }
    req.pipe(request(options)).pipe(res)
})
.listen(8001)