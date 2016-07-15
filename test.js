var async = require('async');

var YeelightLamp = require('./index');

YeelightLamp.discoverAndPair(yeelightLamp => {
    function lightSequence(doneCallback) {
        async.series([
            function (callback) {
                console.log('turnOn');
                yeelightLamp.turnOn(function () {
                    console.log('\tdelay');
                    setTimeout(callback, 5000);
                });
            },
            function (callback) {
                console.log('setColorAndBrightness - red');
                yeelightLamp.setColorAndBrightness(255, 0, 0, 100, function () {
                    console.log('\tdelay');
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
            console.log('disconnect');
            yeelightLamp.disconnect(callback);
        }
    ]);
});