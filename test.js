var async = require('async');

var YeelightLamp = require('./index');
var clientId = '7207d94ecb9e4ec5be6eafa46ed1c07f';
var events = require('events')

var pairer = YeelightLamp.discoverAndPair(clientId, yeelightLamp => {
    yeelightLamp.on('user-disconnect',function(){
        console.info('user disconnect occurred!');
        process.exit(0)
    });
    yeelightLamp.on('disconnect',function(){
        console.info('unexpected disconnect!');
    });
    function lightSequence(doneCallback) {
        async.series([
            function (callback) {
                console.log('turnOn');
                yeelightLamp.turnOn(function () {
                    console.log('\tdelay');
                    setTimeout(callback, 1000);
                });
            },
            function (callback) {
                console.log('setColorAndBrightness - red');
                yeelightLamp.setColorAndBrightness(255, 0, 0, 100, function () {
                    console.log('\tdelay');
                    setTimeout(callback, 1000);
                });
            },
            function (callback) {
                console.log('setTemperatureAndBrightness cold');
                yeelightLamp.setTemperatureAndBrightness(1700,100, err => {
                    console.log('\tdelay - temp set');
                    setTimeout(callback, 5000);
                });
            },
            function (callback) {
                console.log('setTemperatureAndBrightness warm');
                yeelightLamp.setTemperatureAndBrightness(6500,100, err => {
                    console.log('\tdelay - temp set');
                    setTimeout(callback, 5000);
                });
            },
            function (callback) {
                console.log('setColorAndBrightness - green');
                yeelightLamp.setColorAndBrightness(0, 255, 0, 100, function () {
                    console.log('\tdelay');
                    setTimeout(callback, 5000);
                });
            },
            function (callback) {
                console.log('setColorAndBrightness - blue');
                yeelightLamp.setColorAndBrightness(0, 0, 255, 100, function () {
                    console.log('\tdelay');
                    setTimeout(callback, 5000);
                });
            },
            function (callback) {
                console.log('setColorAndBrightness - white + dim');
                yeelightLamp.setColorAndBrightness(255, 255, 255, 50, function () {
                    console.log('\tdelay');
                    setTimeout(callback, 5000);
                });
            },
            function (callback) {
                console.log('turnOff');
                yeelightLamp.turnOff(function () {
                    callback();
                });
            },
            function () {
                doneCallback();
            }
        ]);
    }

    async.series([
        function (callback) {
            lightSequence(callback);
        },
        function (callback) {
            lightSequence(callback);
        },
        function (callback) {
            console.log('disconnecting..');
            yeelightLamp.disconnect(callback);
        },
    ]);
});

pairer.on('paired',function(){
    console.info('I am showing you that I can tell you when stuff has happened!')
});