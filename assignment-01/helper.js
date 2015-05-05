let yargv = require('yargs')
let argv = yargv
    .default('dir', process.cwd())
    .default('port', 8000)
    .default('host', '127.0.0.1')
    .default('tcp', 6666)
    .argv


module.exports = {
    PORT: argv.port,
    HOST: argv.host,
    TCP_PORT: argv.tcp,
    ROOT_DIR: argv.dir,
    debug: function debug() {
        console.log.apply(null, arguments)
    },
    capitalize: function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
    }
}
