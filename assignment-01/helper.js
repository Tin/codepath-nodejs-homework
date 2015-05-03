let yargv = require('yargs')
let argv = yargv
    .default('dir', process.cwd())
    .default('port', 6666)
    .default('host', '127.0.0.1')
    .argv


module.exports = {
    PORT: argv.port,
    HOST: argv.host,
    ROOT_DIR: argv.dir
}
