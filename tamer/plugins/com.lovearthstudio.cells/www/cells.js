var cordova = require('cordova');

var Cells = function() {};

Cells.prototype.getNCI = function (success, error) {
    cordova.exec(success, error, 'Cells', 'getNCI', []);
};

var cells = new Cells();
module.exports = cells;