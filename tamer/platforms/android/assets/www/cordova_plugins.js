cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/com.lovearthstudio.applist/www/AppList.js",
        "id": "com.lovearthstudio.applist.AppList",
        "clobbers": [
            "AppList"
        ]
    },
    {
        "file": "plugins/com.lovearthstudio.cells/www/cells.js",
        "id": "com.lovearthstudio.cells.cells",
        "clobbers": [
            "Cells"
        ]
    },
    {
        "file": "plugins/com.phonegap.plugins.nativesettingsopener/www/settings.js",
        "id": "com.phonegap.plugins.nativesettingsopener.Settings",
        "clobbers": [
            "cordova.plugins.settings"
        ]
    },
    {
        "file": "plugins/com.pylonproducts.wifiwizard/www/WifiWizard.js",
        "id": "com.pylonproducts.wifiwizard.WifiWizard",
        "clobbers": [
            "window.WifiWizard"
        ]
    },
    {
        "file": "plugins/cordova-plugin-app-version/www/AppVersionPlugin.js",
        "id": "cordova-plugin-app-version.AppVersionPlugin",
        "clobbers": [
            "cordova.getAppVersion"
        ]
    },
    {
        "file": "plugins/cordova-plugin-ble-central/www/ble.js",
        "id": "cordova-plugin-ble-central.ble",
        "clobbers": [
            "ble"
        ]
    },
    {
        "file": "plugins/cordova-plugin-device/www/device.js",
        "id": "cordova-plugin-device.device",
        "clobbers": [
            "device"
        ]
    },
    {
        "file": "plugins/cordova-plugin-geolocation/www/android/geolocation.js",
        "id": "cordova-plugin-geolocation.geolocation",
        "clobbers": [
            "navigator.geolocation"
        ]
    },
    {
        "file": "plugins/cordova-plugin-geolocation/www/PositionError.js",
        "id": "cordova-plugin-geolocation.PositionError",
        "runs": true
    },
    {
        "file": "plugins/cordova-plugin-network-information/www/network.js",
        "id": "cordova-plugin-network-information.network",
        "clobbers": [
            "navigator.connection",
            "navigator.network.connection"
        ]
    },
    {
        "file": "plugins/cordova-plugin-network-information/www/Connection.js",
        "id": "cordova-plugin-network-information.Connection",
        "clobbers": [
            "Connection"
        ]
    },
    {
        "file": "plugins/cordova-plugin-splashscreen/www/splashscreen.js",
        "id": "cordova-plugin-splashscreen.SplashScreen",
        "clobbers": [
            "navigator.splashscreen"
        ]
    },
    {
        "file": "plugins/cordova-plugin-whitelist/whitelist.js",
        "id": "cordova-plugin-whitelist.whitelist",
        "runs": true
    },
    {
        "file": "plugins/cordova-sqlite-storage/www/SQLitePlugin.js",
        "id": "cordova-sqlite-storage.SQLitePlugin",
        "clobbers": [
            "SQLitePlugin"
        ]
    },
    {
        "file": "plugins/cordova-plugin-ubilib/www/UbilibPlugin.js",
        "id": "cordova-plugin-ubilib.UbilibPlugin",
        "clobbers": [
            "UbilibPlugin"
        ]
    },
    {
        "file": "plugins/cordova-plugin-device-motion/www/Acceleration.js",
        "id": "cordova-plugin-device-motion.Acceleration",
        "clobbers": [
            "Acceleration"
        ]
    },
    {
        "file": "plugins/cordova-plugin-device-motion/www/accelerometer.js",
        "id": "cordova-plugin-device-motion.accelerometer",
        "clobbers": [
            "navigator.accelerometer"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "com.lovearthstudio.applist": "0.0.1",
    "com.lovearthstudio.cells": "0.0.1",
    "com.phonegap.plugins.nativesettingsopener": "1.0",
    "com.pylonproducts.wifiwizard": "0.2.11",
    "cordova-plugin-app-version": "0.1.8",
    "cordova-plugin-ble-central": "1.0.4",
    "cordova-plugin-device": "1.1.1",
    "cordova-plugin-geolocation": "2.1.0",
    "cordova-plugin-network-information": "1.2.0",
    "cordova-plugin-splashscreen": "3.1.0",
    "cordova-plugin-whitelist": "1.2.1",
    "cordova-sqlite-storage": "0.8.4-dev",
    "cordova-plugin-ubilib": "0.0.1",
    "cordova-plugin-device-motion": "1.2.1"
}
// BOTTOM OF METADATA
});