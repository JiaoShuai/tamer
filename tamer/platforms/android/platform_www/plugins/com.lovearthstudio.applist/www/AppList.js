cordova.define("com.lovearthstudio.applist.AppList", function(require, exports, module) { var cordova = require('cordova');

var AppList = function() {};

AppList.prototype.getAppList = function (success, error) {
    cordova.exec(success, error, 'AppList', 'getAppList', []);
}
AppList.prototype.getAppStats = function (success, error,arg1,arg2,arg3) {
    cordova.exec(success, error, 'AppList', 'getAppStats', [arg1,arg2,arg3]);
};

var AppList = new AppList();
module.exports = AppList;

});
