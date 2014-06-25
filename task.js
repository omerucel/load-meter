var Task = function() {
    this.settings = {};
    var currentObject = this;

    process.on('message', function (message) {
        if (message.cmd == 'start') {
            currentObject.settings = {
                name: message.name,
                targetRps: message.targetRps
            };

            setInterval(function () {
                for (i = 0; i < currentObject.settings.targetRps; i++) {
                    currentObject.sendRequest(i);
                }
            }, 1000);
        }
    });
};

Task.prototype.sendRequest = function (index){};

module.exports = Task;