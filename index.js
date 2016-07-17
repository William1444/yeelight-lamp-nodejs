var util = require('util');

var NobleDevice = require('noble-device');
var SERVICE_UUID = '8e2f0cbd1a664b53ace6b494e25f87bd';
var NOTIFY_UUID = '8f65073d9f574aaaafea397d19d5bbeb';
var CONTROL_UUID = 'aa7d3f342d4f41e0807f52fbf8cf7443';

function toHexString(byteArray,minlength) {
    return byteArray.map(function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
}

const NOTIFY_STATUS = {
    _NOTIFY: '4363',
    NOT_AUTHED: '43631',
    AUTHORIZED_PAIRED: '43632',
    AUTHORIZED_DEVICE: '43634',
    NOT_READY: '43636',
    DISCONNECT_IMMINENT: '43637'
};

const commands = {
    pair: 4367,
    disconnect: 4368,
    power: {
        on: 434001,
        off: 434002
    },
    colorAndBrightness: 4341,
    temperatureAndBrightness: 4341
};
//response will be 01
//press scene button to pair
//then response is 02 if unpaired before and now paired
//04 if paired before

function convertinttohex(int,minLength) {
    minLength = minLength || 2;
    var hex = int.toString(16).toUpperCase();
    return hex.length > minLength ? hex : (Array(minLength+1).join('0') + hex).slice(-minLength);
}

function createwritecommand(command, args) {
    return `${command}${args}000000000000000000000000000000000000`.slice(0, 36);
}

class YeelightLamp extends NobleDevice {
    constructor(peripheral) {
        super(peripheral)
    }

    turnOn(callback) {
        this.writeYeelightStringCharacteristic(CONTROL_UUID, createwritecommand(commands.power.on, ''), callback);
    }

    turnOff(callback) {
        this.writeYeelightStringCharacteristic(CONTROL_UUID, createwritecommand(commands.power.off, ''), callback);
    }

    setColorAndBrightness(red, green, blue, brightness, callback) {
        const args = convertinttohex(red) + convertinttohex(green) + convertinttohex(blue) + convertinttohex(0) + convertinttohex(brightness);
        return this.writeYeelightStringCharacteristic(CONTROL_UUID,
            createwritecommand(commands.colorAndBrightness, args), callback);
    }

    writeYeelightStringCharacteristic(characteristicUuid, string, callback) {
        this.writeDataCharacteristic(SERVICE_UUID, characteristicUuid, new Buffer(string, 'hex'), callback)
    }

    setTemperatureAndBrightness(temp, brightness, callback) {
        const tempMin = 1700, tempMax = 6500;
        temp = temp < tempMin ? tempMin : (temp > tempMax ? tempMax : temp);
        const args = convertinttohex(temp, 4) + convertinttohex(brightness);
        return this.writeYeelightStringCharacteristic(CONTROL_UUID,
            createwritecommand(commands.temperatureAndBrightness, args), callback);
    }

    disconnect(callback) {

        return this.writeYeelightStringCharacteristic(CONTROL_UUID, createwritecommand(commands.disconnect),
            super.disconnect.bind(this, callback))
    }

}

YeelightLamp.is = function (peripheral) {
    var localName = peripheral.advertisement.localName;
    return localName && (localName === 'Yeelight Blu' || localName === 'LightStrips' || /^XMCTD_.*$/.test(localName));
};

YeelightLamp.discoverAndPair = function (client_uuid, callback) {
    console.log('discovering device');
    YeelightLamp.discover(function (yeelightLamp) {
        console.log('found ' + yeelightLamp.uuid);
        yeelightLamp.connectAndSetup(err => {
            if (err) console.error(err);
            console.log('connected.. getting notified of pairing changes')
            var notifyCharacteristic = yeelightLamp._characteristics[SERVICE_UUID][NOTIFY_UUID];
            notifyCharacteristic.on('read', function(data, isNotification) {
                var pairingStatus = toHexString(data);
                if (pairingStatus.substring(0, 4) === NOTIFY_STATUS._NOTIFY) {
                    console.log('pairing notification received')
                    var pairingResponseCode = pairingStatus.substring(0, 5);
                    if (pairingResponseCode === NOTIFY_STATUS.AUTHORIZED_DEVICE) {
                        console.log('already paired, connected and ready to go.');
                        callback(yeelightLamp);
                    } else if (pairingResponseCode === NOTIFY_STATUS.AUTHORIZED_PAIRED) {
                        console.log('device paired successfully')
                        callback(yeelightLamp);
                    } else if (pairingResponseCode === NOTIFY_STATUS.NOT_AUTHED) {
                        console.log('device ready to pair, press the Yeelight lamp\'s scene button.')
                    } else if (pairingResponseCode === NOTIFY_STATUS.NOT_READY) {
                        console.log('device is not yet paired and was not ready... maybe you should turn it on.')
                    } else {
                        console.log('not paired - code was ' + pairingStatus)
                    }
                }
            });
            notifyCharacteristic.notify(true, function(error) {
                console.log('notification of changes to pairing on');
                console.log('start pairing...');
                yeelightLamp.writeYeelightStringCharacteristic(CONTROL_UUID, createwritecommand(commands.pair, client_uuid),
                    err => {
                        if (err) console.error(err);
                        console.log('pair command sent successfully');
                    });
            });

            yeelightLamp.on('disconnect', function () {
                console.log('disconnected!');
                process.exit(0);
            });
        })
    });

};

NobleDevice.Util.inherits(YeelightLamp, NobleDevice);

module.exports = YeelightLamp;