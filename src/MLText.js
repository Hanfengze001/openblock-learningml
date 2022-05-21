const fs = require('fs');
const BrainText = require('brain-text');

const TYPE = 'text';

/**
 * A server to provide local devices resource.
 */
class MLTEXT {

    constructor () {
        this.type = TYPE;
        this.easyml_model = null;
        this.modelStatus = false;
        
        this.brainText = new BrainText('en');
        this.loadTargetModel();
    }

    updateModel (modelJSON) {
        this.modelStatus = false;
        fs.writeFile('./models/textModel.txt', modelJSON, err => {
            if (err) {
                console.log('writeFile textModel.txt failed', err);
            } else {
                console.log('writeFile textModel.txt success');
                this.loadTargetModel();
            }
        });
    }

    loadTargetModel () {
        const filePath = './models/textModel.txt';
        fs.stat(filePath, (err, stat) => {
            // console.log('stat', stat);
            // console.log('isFile', stat.isFile());
            // console.log('err', err);
            if (!stat || !stat.isFile() || err) {
                console.log('No textModel');
                this.datasetStatus = false;
                return;
            }
            fs.readFile(filePath, (error, data) => {
                if (error) {
                    this.modelStatus = false;
                    return console.error('readFile textModel failed', error);
                }
                // console.log('data', data.toString());
                // console.log('data length', data.length);
                if (data.length > 0) {
                    const dataStr = JSON.parse(data.toString());
                    this.easyml_model = dataStr.modelJSON;
                    // console.log('easyml_model', this.easyml_model);
                    this.modelFunction = null;
                    if (this.easyml_model === null) {
                        this.modelStatus = false;
                        console.error('Load textModel failed', error);
                    } else {
                        if (this.modelFunction === null) {
                            console.log('building modelFunction with this model');
                            // console.log(this.easyml_model);
                            this.buildModel(this.easyml_model);
                        }
                        console.log('Load textModel success');
                        this.modelStatus = true;
                    }
                } else {
                    console.log('No textModel');
                    this.modelStatus = false;
                }
            });
        });
    }

    buildModel (modelJSON) {
        console.log('enter buildModel');
        const net = modelJSON.net;
        // console.log('net', net);
        // Atention TRICK: When serialized, if timeout=Infinity, as JSON don't 
        // understand Infinity value is saved as 0 which causes an error when 
        // building net fromJSON. So, this is fixed here (I don't like this solution)
        if (net.trainOpts.timeout !== undefined) {
            net.trainOpts.timeout =
                (net.trainOpts.timeout === 0) ? Infinity : net.trainOpts.timeout;
        }

        this.brainText.fromJSON(modelJSON);

        this.modelFunction = function (entry) {
            console.log('entry', entry);
            const result = this.brainText.run(entry);
            console.log(result);
            return result;
        };
    }

    classifyText (text) {
        let retStr = 'NO MODELS';
        if (this.modelStatus) {
            retStr = this.modelFunction(text).label;
        }
        return retStr;
    }

    confidenceText (text) {
        let retStr = 'NO MODELS';
        if (this.modelStatus) {
            retStr = this.modelFunction(text).confidence;
        }
        return retStr;
    }
}

module.exports = MLTEXT;
