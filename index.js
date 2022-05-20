const Emitter = require('events');
const path = require('path');

const MLServer = require('./src/server');

/**
 * The path of default user data directory.
 * @readonly
 */
const DEFAULT_ML_PATH = path.join(__dirname, '../');

class LearningMLServer extends Emitter{
    constructor (mlPath) {
        super();

        if (mlPath) {
            this._mlPath = mlPath;
        } else {
            this._mlPath = DEFAULT_ML_PATH;
        }

    }

    listen (port = null) {
        const server = new MLServer(this._mlPath);

        server.on('error', e => {
            this.emit('error', e);
        });
        server.on('ready', () => {
            this.emit('ready');
        });
        server.on('port-in-use', () => {
            this.emit('port-in-use');
        });

        server.listen(port);
    }
}

module.exports = LearningMLServer;
