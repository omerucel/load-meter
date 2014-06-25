var _ = require('underscore');

var Distributor = function (master) {
    this.master = master;
    this.slaveIndex = 0;
    this.slaveNames = _.keys(this.master.slaves);

};

Distributor.prototype.nextSlaveName = function () {
    if (this.slaveIndex >= this.slaveNames.length) {
        this.slaveIndex = 0;
    }

    var selectedName = this.slaveNames[this.slaveIndex];
    this.slaveIndex++;
    return selectedName;
};

Distributor.prototype.start = function() {
    var currentObject = this;

    _.each(this.master.slaves, function (socket){
        socket.emit("clear-threads");
    });

    _.each(_.keys(this.master.tasks), function(taskName) {
        var task = currentObject.master.tasks[taskName];
        for (i = 0; i < task.numUsers; i++) {
            currentObject.master.slaves[currentObject.nextSlaveName()].emit("new-thread", {
                name: taskName,
                script: task.script,
                targetRps: task.targetRps
            });
        }
    });

    _.each(this.master.slaves, function (socket){
        socket.emit("start-threads");
    });
};

module.exports = Distributor;