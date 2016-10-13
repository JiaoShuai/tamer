var cordova = require('cordova');

var UbilibPlugin = function() {};

UbilibPlugin.prototype.getParams = function (success, error, arg) {
    cordova.exec(success, error, 'UbilibPlugin', 'getParams', [arg]);
};
UbilibPlugin.prototype.fft = function (success, error, arg) {
    cordova.exec(success, error, 'UbilibPlugin', 'fft', [arg]);
};

var ubilibPlugin = new UbilibPlugin();
module.exports = ubilibPlugin;