var fs          = require('fs');
var _           = require('underscore');
var restify     = require('restify');
var Distributor = require('./distributor');
var argv        = require('minimist')(process.argv.slice(2));

var Master = function(argv){
    if (argv["tasks-file"] == undefined) {
        throw new Error('--tasks-file required');
    }

    this.argv = argv;
    this.tasks = JSON.parse(fs.readFileSync(argv['tasks-file']));
    this.isStarted = false;
    this.slaves = {};
    this.stats = {};
};

Master.prototype.start = function() {
    if (this.isStarted) {
        console.log("Still running..");
        return;
    }

    this.isStarted = true;

    var distributor = new Distributor(this);
    distributor.start();
};

Master.prototype.stop = function() {
    _.each(this.slaves, function (socket){
        socket.emit("clear-threads");
    });
    this.isStarted = false;
};

Master.prototype.serve = function() {
    var currentObject = this;

    this.io = require('socket.io')(this.argv.port);
    this.io.on('connection', function(socket){
        socket.on("disconnect", function() {
            // Soket eğer köle ise listeden çıkart.
            if (currentObject.slaves.hasOwnProperty(socket.id)) {
                delete currentObject.slaves[socket.id];
                console.log("Slave (%s) unregistered.", socket.id);
            }
        });

        socket.on("slave-register", function(data) {
            // Soket köle olarak tanıtılır.
            currentObject.slaves[socket.id] = socket;
            socket.emit("slave-registered", {});
            console.log("Slave (%s) registered.", socket.id);
        });
    });

    this.io.on("error", function(e) {
        console.log("Error : ", e);
    });

    var restServer = restify.createServer();
    restServer.get('/start', function (req, res, next) {
        currentObject.start();
        res.send('OK');
        next();
    });

    restServer.get('/stop', function (req, res, next) {
        currentObject.stop();
        res.send('OK');
        next();
    });

    restServer.listen(argv['api-port'], function () {
        console.log('opened api on %s', restServer.url);
    });
};

var master = new Master(argv);
master.serve();