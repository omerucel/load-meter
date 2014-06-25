var Task = require('../task');

Task.prototype.sendRequest = function (index) {
    process.send({name: this.settings.name, index: index});
};

new Task();