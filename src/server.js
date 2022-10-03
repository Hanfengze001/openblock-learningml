const express = require('express');
const Emitter = require('events');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const https = require('https');
const clc = require('cli-color');

const LMLServer = require('./websocket');

const exarttemp = require('express-art-template');

const { resolve } = require('path');

/**
 * Configuration the default host.
 * @readonly
 */
const DEFAULT_HOST = '0.0.0.0';

/**
 * Configuration the default port.
 * @readonly
 */
const DEFAULT_PORT = 20113;

/**
 * Server name, ues in root path.
 * @readonly
 */
const SERVER_NAME = 'openblock-learningml-server';

/**
 * The time interval for retrying to open the port after the port is occupied by another openblock-learningml server.
 * @readonly
 */
const REOPEN_INTERVAL = 1000 * 1;

/**
 * A server to provide local resource.
 */
class MLServer extends Emitter{

    /**
     * Construct a OpenBlock resource server object.
     * @param {string} mlPath - the path of learningml.
     */
    constructor (mlPath) {
        super();

        this._mlPath = mlPath;
        this._host = DEFAULT_HOST;
        this._port = DEFAULT_PORT;

        this.webServer = new LMLServer();
    }

    isSameServer (host, port) {
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        return new Promise((resolve, reject) => {
            fetch(`https://${host}:${port}`, {agent})
                .then(res => res.text())
                .then(text => {
                    if (text === SERVER_NAME) {
                        return resolve(true);
                    }
                    return resolve(false);
                })
                .catch(err => reject(err));
        });
    }

    classifyFromLml(operation, src) {
        let result = 'No Model';
        if (this.webServer.getState() !== 1) {
            operation = 'No Model';
        }
        if (operation !== 'No Model') {
            return new Promise(resolve => {
                this.webServer.lmlRequest(operation, [src], result => {
                    console.log('result', result);
                    resolve(result);
                });
            });
        }
        return Promise.resolve(result);
    }

    /**
     * Start a server listening for connections.
     * @param {number} port - the port to listen.
     * @param {number} host - the host to listen.
     */
    listen (port, host) {
        if (port) {
            this._port = port;
        }
        if (host) {
            this._host = host;
        }

        this._app = express();
        this._server = https.createServer({
            cert: fs.readFileSync(path.resolve(__dirname, '../certificates/cert.pem'), 'utf8'),
            key: fs.readFileSync(path.resolve(__dirname, '../certificates/key.pem'), 'utf8')
        },
        this._app);
        
        this._app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
        
        console.log('_mlPath', this._mlPath);
        this._app.use(express.json({limit: '50mb'}));
        this._app.use(express.static(`${this._mlPath}`));
        this._app.engine('html', exarttemp);

        this._app.get('/', (req, res) => {
            res.send(SERVER_NAME);
        });
        
        // 执行分析算法
        this._app.post('/get/:type/:reqtype', (req, res) => {
            console.log('post /get/:type/:reqtype');
            console.log('params', req.params);
            const type = req.params.type; // image or text
            const reqtype = req.params.reqtype; // 1:classify 2:confidence

            if (type === 'image') {
                const src = req.body.pic;
                let operation = 'No Model';
                if (reqtype === '1') {
                    operation = 'classify_image';
                } else if (reqtype === '2') {
                    operation = 'confidence_image';
                }
                this.classifyFromLml(operation, src)
                    .then(resType => {
                        const result = {
                            type: resType
                        };
                        console.log('result 1', result);
                        res.send(JSON.stringify(result));
                    })
            } else if (type === 'text') {
                const text = req.body.text;

                let operation = 'No Model';
                if (reqtype === '1') {
                    operation = 'classify_text';
                } else if (reqtype === '2') {
                    operation = 'confidence_text';
                }
                this.classifyFromLml(operation, text)
                    .then(resType => {
                        const result = {
                            type: resType
                        };
                        console.log('result 1', result);
                        res.send(JSON.stringify(result));
                    })
            }
        });

        this._server.listen(this._port, this._host, () => {
            console.log(clc.green(`Learningml server start successfully, socket listen on: https://${this._host}:${this._port}`));
            this.emit('ready');
        })
            .on('error', err => {
                this.isSameServer('127.0.0.1', this._port).then(isSame => {
                    if (isSame) {
                        console.log(`Port is already used by other openblock-learningml server, will try reopening after ${REOPEN_INTERVAL} ms`); // eslint-disable-line max-len
                        setTimeout(() => {
                            this._server.close();
                            this._server.listen(this._port, this._host);
                        }, REOPEN_INTERVAL);
                        this.emit('port-in-use');
                    } else {
                        const info = `ERR!: error while trying to listen port ${this._port}: ${err}`;
                        console.error(clc.red(info));
                        this.emit('error', info);
                    }
                });
            });
    }
}

module.exports = MLServer;
