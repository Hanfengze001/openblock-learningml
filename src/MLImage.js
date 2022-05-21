const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');

const TYPE = 'image';

/**
 * A server to provide local devices resource.
 */
class MLImage {

    constructor () {
        this.type = TYPE;
        this.dataset = {
            dataArray: [],
            labels: []
        };
        this.labels = [];
        this.targetModel = null;
        this.modelStatus = false;
        this.datasetStatus = false;

        this.loadTargetModel();
        this.loadDataset();
    }

    updateDataSet (imageLabels, datasetLabels, datasetData) {
        this.buildDataset(datasetLabels, datasetData);
        this.labels = imageLabels;
        const imageModelInfo = {
            imageLabels: this.labels,
            imageDataset: this.dataset
        };
        fs.writeFile('./models/imageModel.txt', JSON.stringify(imageModelInfo), err => {
            if (err) {
                console.log('writeFile imageModel.txt failed', err);
            } else {
                console.log('writeFile imageModel.txt success');
            }
        });
    }

    loadTargetModel () {
        const modelPath = path.join(__dirname, '../models/model.json');
        console.log('path ', modelPath);
        this.modelStatus = false;
        // return tf.loadLayersModel('https://127.0.0.1:20113/models/model.json')
        // return tf.loadLayersModel('file://E:/code/openblock/openblock-learningml/models/model.json')
        return tf.loadLayersModel('file://path/to/models/model.json')
            .then(tm => {
                this.targetModel = tm;
                this.modelStatus = true;
                console.log('Load targeModel');
                return tm;
            });
    }

    loadDataset () {
        // 异步读取
        const filePath = './models/imageModel.txt';
        fs.stat(filePath, (err, stat) => {
            if (!stat || !stat.isFile() || err) {
                console.log('No image dataset');
                this.datasetStatus = false;
                return;
            }
            fs.readFile(filePath, (error, data) => {
                if (error) {
                    this.datasetStatus = false;
                    return console.error('readFile imageModel failed', error);
                }
                // console.log('data', data.toString());
                // console.log('data length', data.length);
                if (data.length > 0) {
                    const modelData = JSON.parse(data.toString());
                    this.labels = modelData.imageLabels;
                    this.buildDataset(modelData.imageDataset.labels,
                        modelData.imageDataset.dataArray);
                    
                    if (this.labels && this.dataset.labels && this.dataset.dataArray) {
                        this.datasetStatus = true;
                        console.log('Load image dataset success');
                    } else {
                        console.log('Load image dataset failed');
                        this.datasetStatus = false;
                    }
                } else {
                    console.log('No image dataset');
                    this.datasetStatus = false;
                }
            });
        });
    }

    buildDataset (labels, dataArray) {
        for (const t of this.dataset.dataArray) {
            t.dispose();
        }

        this.dataset.labels = labels;

        this.dataset.dataArray = [];
        for (const index in dataArray) {
            const f32Arr = Float32Array.from(Object.values(dataArray[index]));
            this.dataset.dataArray.push(tf.tensor(f32Arr));
        }
    }

    _classifyImage (tActivation) {
        const prediction = this.targetModel.predict(tActivation);

        const predictions = prediction.dataSync();
        const arrPredictions = Array.from(predictions);
        const results = [];
        for (let i = 0; i < arrPredictions.length; i++) {
            results.push([this.labels[i], arrPredictions[i]]);
        }
        results.sort((a, b) => b[1] - a[1]);
        tActivation.dispose();
        console.log('results', results);
        return results;
    }

    classifyImage (image) {
        let retStr = 'NO MODELS';
        if (this.modelStatus && this.datasetStatus) {
            retStr = this._classifyImage(image).then(r => r[0][0], e => e);
        }
        return retStr;
    }

    confidenceImage (image) {
        let retStr = 'NO MODELS';
        if (this.modelStatus && this.datasetStatus) {
            retStr = this._classifyImage(image).then(r => r[0][1], e => e);
        }
        return retStr;
    }
}

module.exports = MLImage;
