const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
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
        fs.writeFile('./learningml/imageModel.txt', JSON.stringify(imageModelInfo), err => {
            if (err) {
                console.log('writeFile imageModel.txt failed', err);
                this.datasetStatus = false;
            } else {
                console.log('writeFile imageModel.txt success');
                this.datasetStatus = true;
            }
        });
    }

    loadTargetModel () {
        this.modelStatus = false;
        const filePath = './learningml/model.json';
        fs.stat(filePath, (err, stat) => {
            if (!stat || !stat.isFile() || err) {
                console.log('Load targeModel failed, No image model');
                return;
            }
            tf.loadLayersModel('file://learningml/model.json')
                .then(tm => {
                    console.log('targetModel', tm);
                    this.targetModel = tm;
                    this.modelStatus = true;
                    console.log('Load targeModel');
                    return tm;
                });
        });
    }

    loadDataset () {
        this.datasetStatus = false;
        // 异步读取
        const filePath = './learningml/imageModel.txt';
        fs.stat(filePath, (err, stat) => {
            if (!stat || !stat.isFile() || err) {
                console.log('No image dataset');
                return;
            }
            fs.readFile(filePath, (error, data) => {
                if (error) {
                    return console.error('readFile imageModel failed', error);
                }
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
                    }
                } else {
                    console.log('No image dataset');
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

}

module.exports = MLImage;
