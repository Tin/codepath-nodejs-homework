let http = require('http')

http
    .createServer((req, res) => {
        console.log(`Request received at: ${req.url}`)
        for (let header in req.headers) {
            res.setHeader(header, req.headers[header])
        }
        req.pipe(res)
    })
    .listen(8000)
