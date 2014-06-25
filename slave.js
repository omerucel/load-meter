var childProcess    = require('child_process');
var _               = require('underscore');
var argv            = require('minimist')(process.argv.slice(2));

var Slave = function(argv){
    this.argv = argv;
    this.io = require('socket.io-client')(this.argv['master-host']);
    this.childs = [];
};

Slave.prototype.serve = function(){
    var currentObject = this;
    this.io.on("connect", function() {
        console.log("Registering to the master server...");
        currentObject.io.emit("slave-register", {});
    });

    this.io.on("disconnect", function() {
        console.log("Closed the master server connection.");
    });

    this.io.on("slave-registered", function () {
        console.log("Registered!");
    });

    this.io.on("clear-threads", function() {
        console.log('Cleaned Threads..');
        _.each(currentObject.childs, function (item) {
            item.thread.kill('SIGTERM');
        });

        currentObject.childs = [];
    });

    this.io.on("new-thread", function(data) {
        var thread = childProcess.fork(data.script);

        currentObject.childs.push({
            thread: thread,
            name: data.name,
            targetRps: data.targetRps
        });

        console.log("Added new child :", data.name);
    });

    this.io.on("start-threads", function() {
        console.log("Started childs.");
        _.each(currentObject.childs, function (item) {
            item.thread.on('message', function (m) {
                console.log(m);
            });

            item.thread.send({ cmd: "start", name: item.name, targetRps: item.targetRps});
        });
    });
};

var slave = new Slave(argv);
slave.serve();