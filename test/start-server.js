const LearningMLServer = require('../index');
// const clc = require('cli-color');

const mlServer = new LearningMLServer();

mlServer.listen();

mlServer.on('error', err => {
    console.error(err);
});
