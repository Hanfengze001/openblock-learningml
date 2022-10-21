// Built-in Dependencies
const Emitter = require('events');
const { json } = require('express');
const ws = require('nodejs-websocket');
const clc = require('cli-color');

const SERVER_PORT = 20114;

/**
 * The time interval for retrying to open the port after the port is occupied by another openblock-learningml server.
 * @readonly
 */
 const REOPEN_INTERVAL = 1000 * 1;

class LMLWebSocket extends Emitter {
    constructor () {
        super();
        this.messageId = null;
        this.connection = null;
        this.server = ws.createServer(connection => {
            this.connection = connection;
            connection.on('text', str => {
                console.log('recv text', str);
                const recvData = JSON.parse(str);
                if (recvData.message_id === this.messageId){
                    this.emit(this.messageId, recvData.result);
                }
            });
            connection.on('close', err => {
                console.log('connection close', err);
            });

            connection.on('error', err => {
                console.log('connection err', err);
            });
        });
        this.server.on('error', err => {
            console.log('listen 20114 err', err);
            setTimeout(() => {
                this.server.close();
                this.server.listen(SERVER_PORT);
            }, REOPEN_INTERVAL);
            this.emit('port-in-use');
        });
        this.server.listen(SERVER_PORT, '0.0.0.0', () => {
            this.emit('ready');
            console.info(clc.green(`Learningml websocker server start successfully, socket listen on: ws://0.0.0.0:${SERVER_PORT}`));
        });
    }

    uuidv4 () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : ((r & 0x3) | 0x8);
            return v.toString(16);
        });
    }

    lmlRequest (operation, args, callback) {
        const messageId = this.uuidv4();
    
        const message = {
            message_id: messageId,
            operation: operation,
            args: args
        };
        this.connection.send(JSON.stringify(message));
        this.messageId = messageId;
        this.removeAllListeners(messageId);
        this.once(messageId, callback);
    }

    getState() {
        if (this.connection === null){
            return 'CLOSED';
        }
        console.log(this.connection.readyState);
        return this.connection.readyState;
    }

}

module.exports = LMLWebSocket;
