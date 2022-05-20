const express = require('express');
const Emitter = require('events');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const https = require('https');
const clc = require('cli-color');
const multiparty = require('multiparty');

const MLImage = require('./image');

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

        this.image = new MLImage();
        // this._formatMessage = {};
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
        
        this._app.use(express.json({limit: '50mb'}));
        this._app.use(express.static(`${this._mlPath}`));

        this._app.get('/', (req, res) => {
            res.send(SERVER_NAME);
        });

        // 执行分析算法
        this._app.post('/get/:type/:reqtype', (req, res) => {
            const type = req.params.type; // image or text
            const reqtype = req.params.reqtype; // 1:classify 2:confidence
            const src = req.body.pic;
            console.log('type', type);
            console.log('reqtype', reqtype);

            let resStr;
            if (type === this.image.type) {
                if (reqtype === '1') {
                    resStr = this.image.classifyImage(src);
                } else if (reqtype === '2') {
                    resStr = this.image.confidenceImage(src);
                } else {
                    resStr = 'COMMAND ERROR';
                }
                console.log('resStr', resStr);
                res.send(resStr);
            // } else if (type === this.devices.type) {
            //     this.generate18nCache(locale);
            //     res.send(this.deviceIndexData[`${locale}`]);
            // }
            }
        });

        // 上传model文件
        this._app.post('/upload', async (req, res) => {
            /* 生成multiparty对象，并配置上传目标路径 */
            const form = new multiparty.Form();
            form.encoding = 'utf-8';
            form.uploadDir = './models';
            // 设置文件大小限制
            // form.maxFilesSize = 1 * 1024 * 1024;
            form.parse(req, (err, fields, files) => {
                try {
                    if (err) {
                        console.log(err);
                        res.send('failed');
                    }
                    const jsonFile = files['model.json'][0];
                    let newPath = `${form.uploadDir}/${jsonFile.originalFilename}`;
                    // 同步重命名文件名 fs.renameSync(oldPath, newPath)
                    // oldPath  不得作更改，使用默认上传路径就好
                    fs.renameSync(jsonFile.path, newPath);
                    console.log('path', newPath);
                    const binFile = files['model.weights.bin'][0];
                    newPath = `${form.uploadDir}/${binFile.originalFilename}`;
                    // 同步重命名文件名 fs.renameSync(oldPath, newPath)
                    // oldPath  不得作更改，使用默认上传路径就好
                    fs.renameSync(binFile.path, newPath);
                    res.send('ok');
                    this.image.loadTargetModel();
                } catch (e) {
                    console.log(e);
                    res.send('failed');
                }
            });
        });

        // 上传label和dataset
        this._app.post('/save/:reqtype', (req, res) => {
            const reqtype = req.params.reqtype; // image or text
            res.send('ok');
            if (reqtype === 'image') {
                // this.image.updaeDataSet(req.body.imageDataset);
                const dataSet = JSON.parse(req.body.imageDataset);
                this.image.updaeDataSet(JSON.parse(req.body.imageLabels),
                    dataSet.labels, dataSet.dataArray);
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
