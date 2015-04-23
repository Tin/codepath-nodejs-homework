# codepath-nodejs-homework

## Home work 0

### Run server with nodemon

```
npm install -g eslint babel babel-eslint nodemon
npm install
npm start
```

### Run proxy server with options

```
--host upstream host name, default 127.0.0.1
--port upstream port, default 8000 for 127.0.0.1, default 80 for others
--url upstream host:port, this will override --host and --port value
--log logfile path
```

```
babel-node -- index.js --host 127.0.0.1 --port 8000
curl -v http://127.0.0.1:8001/path -d "hello proxy"
```

