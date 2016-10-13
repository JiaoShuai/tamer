/*!
 * dua-sdk for ionic
 * 1.0.0
 * Copyright 2015 Drifty Co. http://www.xdua.org/
 * See LICENSE in this repository for license information
 */


/*
 * dua-sdk在localstorage上会建立一个叫duaLocalStorage的Key
 * 它是一个JSON.string.包含
 *  1：initime   APP第一次打开时的时间戳，毫秒
 *  2：lastime   APP最近一次打开时的时间戳，毫秒
 *  3：anonymousDuaid 匿名dua_id
 *  4：currentDuaid 当前使用APP的dua_id.这个变量在登录和退出账号的时候会发生变化
 *  5：lastclose APP最近exit/pause的时间
 *  6：lastStart APP最近start/resume的时间
 *  每次active结算的时候的dua_id，都以当时的currentDuaid来结算。不管它这个active启动的时候是匿名还是其它dua_id. 
 *  举例：你打开app,以匿名用户玩了10分钟，然后登录玩了2分钟，然后pause,这个时候结算，是以新的dua_id结算。这里面的active统计误差我们忽略掉。
 *  
*/
angular.module('dua-sdk', ['ngCordova'])
.run(function ($ionicPlatform, $rootScope, DUA) {
    $ionicPlatform.ready(function () {
        console.info("dua-sdk module run!");
        document.addEventListener("deviceready", onDeviceReady, false);
    });
    /*!
     * deviceready:   当cordova完全加载，可以调用cordova API接口 支持平台：Amazon、Fire OS、Android、BlackBerry 10、iOS、Tizen、Windows Phone 8、Windows 8   
     *   pause:       app切换到后台运行时监听的事件，如打开其它应用。  支持平台：Amazon Fire OS、Android、BlackBerry 10、iOS、Windows Phone 8、Windows 8
     *   resume：     app从后台运行时重新获取监听的事件支持平台：Amazon Fire OS、Android、BlackBerry 10、iOS、Windows Phone 8、Windows 8   ios下当app切换到前台时，resume事件执行的函数需以setTimeout（fn,0）包裹，否则app会被挂起。    
     *   backbutton： 按下手机返回按钮时监听的事件    支持平台：Amazon Fire OS、Android、BlackBerry 10、Windows Phone 8  
     *   menubutton： 按下手机上菜单按钮时监听的事件  支持平台：Amazon Fire OS、Android、BlackBerry 10                  
     ***/
    function onDeviceReady() {
        onStart();
        document.addEventListener("pause", onPause);
        document.addEventListener("resume", onResume);
        document.addEventListener("exit", onExit);
    }
    function onStart() {
        console.info("onStart() is called " + new Date().getTime());
        DUA.OnAwake();
    }
    function onPause() {
        console.info("onPause() is called " + new Date().getTime());
        DUA.OnSleep();
    }
    function onResume() {
        console.info("onResume() is called " + new Date().getTime());
        DUA.OnAwake();
    }
    function onExit() {
        console.info("onExit() is called " + new Date().getTime());
        DUA.OnSleep();
    }
})
.config(function (DUAProvider) {
    DUAProvider.setServerUrl("http://api.xdua.org");
})
.provider('DUA', function () {
    this.serverUrl = "";
    this.setServerUrl = function (newUrl) {
        this.serverUrl = newUrl;
    }
    this.$get = function ($http, $cordovaDevice, $cordovaSQLite, $cordovaNetwork, $q, $cordovaAppVersion, $cordovaBLE, $timeout, $cordovaGeolocation) {
        var self = this;
        var duaLocalStorage = null;
        var curUser;
        var location = { lon: 0, lat: 0, alt: 0, acc: 0 };
        var gpsTask=null;


        var service = {
            getGps:function(){
                return location;
            },
            OnAwake: function () {
                /*  
                    判断duaLocalStorage本地存储是否存在，如果不存在
                    1： 本app在本设备的第一次打开，
                    2： 本app本地存储被清洗掉
                    那么要在Localstorage生成一个新的key:duaLocalStorage
                */
                //if (gpsTask == null) {
                //    gpsTask = setInterval(watchGps, 5000);
                //}
                duaLocalStorage_load();
                date = new Date();
                duaLocalStorage.lastime = date.getTime();
                duaLocalStorage.awaketime = date.getTime();
                duaLocalStorage.sleeptime = date.getTime();
                duaLocalStorage_save();

                /*
                 上传本app的活跃记录
                */
                if ($cordovaNetwork.isOnline()) {
                    console.info("Network is online. Try to collect info");
                    getCurrentDuaid().then(onSuccess, function () { console.error("cant get current dua_id"); });
                    function onSuccess(dua_id) {
                        uploadEvents();
                        uploadApps();
                        uploadAppStats();
                        uploadWlds();
                        function uploadEvents() {
                            var msg = {};
                            msg.dua_id = dua_id;
                            msg.action = "dua_active";
                            msg.model = $cordovaDevice.getModel();
                            msg.os = $cordovaDevice.getPlatform();
                            msg.channel = "Google Android app shop";
                            msg.version = "1.1.1";
                            var event = {};
                            event.dua_id = dua_id;
                            event.t = duaLocalStorage.awaketime;
                            event.d = duaLocalStorage.sleeptime - duaLocalStorage.awaketime;
                            event.c = duaLocalStorage.activecnt;
                            event.gmt = date.getTimeZoneGMT();
                            msg.event = [event];
                            $http.post(self.serverUrl + "/duas", msg).then(postSuccess, postError);
                            function postSuccess(response) {
                                //如果是$http.post的话，不需要response.data.status.直接response.status就可以了
                                if (response.data.status == 0) {
                                    console.info("Upload actlist success!");
                                } else {
                                    console.error("Upload actlist error:" + angular.toJson(response));
                                }
                            }
                            function postError(response) {
                                console.info("Upload actlist error:" + angular.toJson(response));
                            }
                        }
                        function uploadApps() {
                            //择机扫描本机的applist并且上传
                            var curTime = new Date().getTime() / 1000;
                            if (curTime - duaLocalStorage.lastApplistUploadTime >= 3600 * 24 * 7) {
                                AppList.getAppList(suc, err);
                                function suc(list) {
                                    //console.info(list);
                                    var msg = {};
                                    msg.action = "add_rats";
                                    msg.dua_id = dua_id;
                                    msg.data = list;
                                    $http({
                                        method: 'POST',
                                        url: self.serverUrl + "/apps",
                                        data: msg,
                                        timeout: 10000,
                                    }).then(onSuccess, onErr);
                                    function onSuccess(res) {
                                        if (res.data.status == 0) {
                                            console.info("app list 上传成功");
                                            duaLocalStorage.lastApplistUploadTime = curTime;
                                            duaLocalStorage_save();
                                        }
                                        else {
                                            onErr(res.data)
                                        }
                                    }
                                    function onErr(reason) {
                                        console.error("上传失败 " + JSON.stringify(reason));
                                    }
                                }
                                function err(reason) {
                                    deferred.reject("获取安装应用列表失败：" + JSON.stringify(reason));
                                }
                            }
                        }
                        function uploadAppStats() {
                            //择机扫描本机的applist并且上传

                            var lastTime = duaLocalStorage.lastAppstatUploadTime;//UTC 以秒为单位
                            var curTime = new Date().getTime() / 1000;           //UTC 以秒为单位
                            var difTime = curTime - lastTime;

                            /*
                                http://blog.csdn.net/andoop/article/details/50593699

                                系统会统计应用的使用情况并保存起来，然后按照这些保存起来的信息的时间长短进行划分。

                                划分级别有4个：
                                1.日长短级别数据：Daily data
                                最长7天内的数据
                                2.星期长短级别数据：Weekly data
                                最长4个星期内的数据
                                3.月长短级别数据： Monthly data
                                最长6个月内的数据
                                4.年长短级别数据： Yearly data
                                最长2年内的数据，也就是说，数据最长保存2年                                                                                 
                            */

                            var endTime = new Date().getTime();
                            var stats = [];
                            var curDate = new Date();
                            if (difTime > 3600 * 24 * 7) {
                                var startTime = curDate.setFullYear(curDate.getFullYear() - 3);//3年之内

                                $q.all([
                                    scanAppStats(startTime, endTime, 1).then(suc, err),
                                    scanAppStats(startTime, endTime, 2).then(suc, err),
                                    scanAppStats(startTime, endTime, 3).then(suc, err),
                                    scanAppStats(startTime, endTime, 4).then(suc, err),
                                ]).then(allSuc, err);

                            } else if (difTime >= 3600 * 24 * 1 && difTime >= 3600 * 24 * 7) {

                                var startTime = curDate.setDate(curDate.getDate() - 7);

                                $q.all([
                                    scanAppStats(startTime, endTime, 1).then(suc, err),
                                    scanAppStats(startTime, endTime, 2).then(suc, err),
                                ]).then(allSuc, err);

                            } else {
                                console.info("No appstas uploading because of difTime:" + difTime);
                            }

                            function allSuc() {
                                if (stats.length == 0) return;//如果返回空数组 直接return.
                                var msg = {};
                                msg.action = "dev_stat";
                                msg.dua_id = dua_id;
                                msg.data = stats;
                                $http({
                                    method: 'POST',
                                    url: self.serverUrl + "/duas",
                                    data: msg,
                                    timeout: 10000,
                                }).then(onSuccess, onErr);
                                function onSuccess(res) {
                                    if (res.data.status == 0) {
                                        console.info("app stats 上传成功");
                                        duaLocalStorage.lastAppstatUploadTime = endTime / 1000;//UTC以秒为单位
                                        duaLocalStorage_save();
                                    }
                                    else {
                                        onErr(res.data)
                                    }
                                }
                                function onErr(reason) {
                                    console.error("上传失败 " + JSON.stringify(reason));
                                }
                             }
                            function suc(list) {
                                stats = stats.concat(list);
                            }
                            function err(reason) {
                                //console.error(reason);
                            }
                        }
                        function uploadWlds() {
                            //择机扫描本机的wldList并且上传
                            var wlds = [];
                            var pos = null;
                            var time = new Date().getTime();

                            $q.all([
                                scanCell().then(function (cells) { wlds = wlds.concat(cells); }, err, null),
                                scanWifi().then(function (wifis) { wlds = wlds.concat(wifis); }, err, null),
                                scanBlue().then(function (blues) { wlds = wlds.concat(blues); }, err, null),
                                //读取gps必须加timeout,否则$q.all没法结束. 感觉$cordovaGeolocation的默认timout无限长.
                                //如果gps关闭了，这个地方仍旧会执行，不会说什么，但会走error
                                $cordovaGeolocation.getCurrentPosition({ timeout: 5000 }).then(function (obj) { pos = obj.coords; }, err, null)
                            ]).then(postAll, err, null);
                            function postAll() {
                                //是否判断pos
                                var msg = {};
                                msg.dua_id = dua_id;
                                msg.action = 'add_wlds';
                                if (pos == null || pos == undefined) {
                                    if (location.lon == 0 && location.lat == 0 && location.acc == 0) {
                                        msg.gps = 0;
                                        msg.lon = 0;
                                        msg.lat = 0;
                                        msg.acc = 0;
                                    } else {
                                        msg.gps = 1;
                                        msg.lon = location.lon;
                                        msg.lat = location.lat;
                                        msg.acc = location.acc;
                                    }
                                } else {
                                    msg.gps = 1;
                                    msg.lon = pos.longitude;
                                    msg.lat = pos.latitude;
                                    msg.acc = pos.accuracy;
                                }

                                //这里是以毫秒为单位
                                msg.time = new Date().getTime() - time;
                                //msg.wlds = JSON.stringify(wlds);
                                msg.wlds = wlds;
                                msg.gmt = date.getTimeZoneGMT();
                                $http({
                                    method: 'POST',
                                    url: self.serverUrl + "/wlds",
                                    data: msg,
                                    timeout: 2000,
                                }).then(function (res) {
                                    if (res.data.status == 0) {
                                        console.info("wld list 上传成功");
                                    } else {
                                        console.error(JSON.stringify(res.data));
                                    }
                                }, function (reason) {
                                    console.error(reason);
                                    //console.error("WLD上传失败，" + JSON.stringify(reason))
                                });
                            }

                            function err(reason) {
                                console.error(reason);
                            }
                        }
                    }
                } else {
                    console.info("Network is offline");
                }
            },
            //注意,cordova在onPause的时候，默认情况下，里面的代码不会在pause的时候执行
            //而是在resume的时候执行。所以这个lastClose永远获得的是resume的时间戳。
            //需要在config.xml里让ionic程序保持后台运行，就可以在pause的时候执行函数里代码。
            OnSleep: function () {
                duaLocalStorage.sleeptime = new Date().getTime();
                var curActiveLot = duaLocalStorage.sleeptime - duaLocalStorage.awaketime;
                duaLocalStorage.activelot += curActiveLot;
                duaLocalStorage.activecnt++;
                duaLocalStorage_save();
            },

            /*
                获取dua_id的接口，获取操作手机的当前dua_id,优先获取注册用户的dua_id，然后是匿名用户。
            */
            getCurrentDuaid: function () {
                if (duaLocalStorage.currentDuaid != null) {                    
                    return duaLocalStorage.currentDuaid;
                }
                else if (duaLocalStorage.anonymousDuaid != null) {                    
                    return duaLocalStorage.anonymousDuaid;
                }
                else {
                    return 0;
                }
            },
            /*
             这个函数于dua本质没有什么关联，但是有用，你可以用它直接方便的操作localStorage
            */
            getProps: function (item, names) {
                var itemStr = localStorage.getItem(item);
                if (itemStr == null) {
                    return null;
                }
                var itemObj = JSON.parse(itemStr);
                var params = [];
                for (var i = 0; i < names.length; i++) {
                    params[i] = itemObj[names[i]];
                }
                return params;
            },
            /*
            这个地方tamer调用了，但是于dua无关，希望将来换成setLocalOjbect
            */
            setItem: function (item, obj) {
                localStorage.setItem(item, angular.toJson(obj));
            },
            /*
            这个地方tamer调用了，但是于dua无关，希望将来换成setLocalOjbect
            */
            getItem: function (item) {
                return localStorage.getItem(item);
            },

            registerApp: function (regApp) {
                var deferred = $q.defer();
                $http.post(self.serverUrl + '/apps', regApp).success(function (response) { deferred.resolve(response); }).error(function (error) { deferred.reject(error); });
                return deferred.promise;
            },
            loginUser: function (loginUser) {
                var deferred = $q.defer();
                //如果本地没有匿名用户dua_id，那么就要触发born.触发born后login动作退出，希望用户下一次继续点击.
                getCurrentDuaid().then(got, err);
                function got(dua_id) {
                    //如果本地有匿名dua_id,那么直接发送注册
                    console.info("dua_id exist. go to login() with dua_id " + dua_id);
                    var user = angular.copy(loginUser);
                    user.dua_id = dua_id;
                    user.pwd = md5(loginUser.pwd);
                    $http.post(self.serverUrl + "/users", user)
                        .success(function (response) {
                            /*登陆成功的动作*/
                            console.info(JSON.stringify(response));
                            if (response.status == 0) {
                                duaLocalStorage.currentDuaid = response.dua_id;
                                duaLocalStorage.currentUtel = loginUser.tel;
                                duaLocalStorage.currentUpwd = loginUser.pwd;
                                duaLocalStorage.currentZone = loginUser.zone;
                                duaLocalStorage_save();
                                deferred.resolve(response);
                            } else {
                                deferred.reject(response);
                            }

                        }).error(function (error) { deferred.reject(error); });
                }
                function err(reason) { deferred.reject(reason) }
                return deferred.promise;
            },
            registerUser: function (regUser) {
                var deferred = $q.defer();
                //如果本地没有匿名用户dua_id，那么就要触发born.触发born后login动作退出，希望用户下一次继续点击.
                getCurrentDuaid().then(got, err);
                function got(dua_id){
                    //如果本地有匿名dua_id,那么直接发送注册
                    regUser.dua_id = dua_id;
                    regUser.pwd = md5(regUser.pwd);
                    $http.post(self.serverUrl + "/users", regUser)
                        .success(function (response) {
                            /*登陆成功的动作*/
                            if (response.status == 0) {
                                duaLocalStorage.currentDuaid = response.dua_id;
                                duaLocalStorage_save();
                                deferred.resolve(response);
                            } else {
                                deferred.reject(response);
                            }
                        }).error(function (error) { deferred.reject(error); });
                }
                function err(reason) { deferred.reject(reason) }
                return deferred.promise;
            },


            /*
            根据本地存储的currentDuaid去服务器上查看有没有rule的权限
            或者服务器不在登录状态，那么就返回失败
            */
            auth: function (rule) {
                var deferred = $q.defer();
                //如果本地没有匿名用户dua_id，那么就要触发born.触发born后login动作退出，希望用户下一次继续点击.
                getCurrentDuaid().then(got, err);
                function got(dua_id) {
                    //如果本地有curretnDuaid,那么直接验证
                    var msg = {};
                    msg.dua_id = dua_id;
                    msg.action = "dua_auth";
                    var selectedRole = localStorage.getItem("selectedRole");
                    if (selectedRole == null) {
                        selectedRole = { value: "all", name: "所有权限" };
                    } else {
                        selectedRole = JSON.parse(selectedRole);
                    }
                    msg.role = selectedRole.value;
                    msg.rule = rule;
                    console.info(JSON.stringify(msg));
                    $http.post(self.serverUrl + "/auth", msg)
                        .success(function (result) {
                            if (result.status == 0) {
                                deferred.resolve(result);
                            } else {//{status="no",reason="***"}
                                deferred.reject(JSON.stringify(result));
                            }
                        }).error(function (reason) { deferred.reject(reason); });
                }
                function err(reason) { deferred.reject(reason) }
                return deferred.promise;
            },

            getVfCode: function (ustr) {
                var deferred = $q.defer();
                getCurrentDuaid().then(
                    //born resolve function 
                    function (dua_id) {
                        var msg = {};
                        msg.dua_id = dua_id;
                        msg.ustr = ustr;
                        msg.action = 'get_vfcode';
                        $http({
                            method: 'POST',
                            url: self.serverUrl + "/auth",
                            data: msg,
                            timeout: 5000,
                        }).then(onSuccess, err);
                        function onSuccess(result) {
                            if (result.data.status == 0) {
                                deferred.resolve(result.data);
                            } else {//{status="no",reason="***"}
                                deferred.reject(JSON.stringify(result));
                            }
                        }
                        function err(reason) { deferred.reject(reason); }
                    },
                    //born reject function
                    function (reason) {
                        deferred.reject(reason);
                    });
                return deferred.promise;
            },
            getStorage: function (key) {
                var deferred = $q.defer();
                getCurrentDuaid().then(onSuccess, onError);
                function onSuccess(dua_id) {
                    var msg = {};
                    msg.dua_id = dua_id;
                    msg.action = "get";
                    msg.key = key;
                    $http.post(self.serverUrl + "/uas", msg)
                    .success(function (result) {
                        if (result.status == 0) {
                            deferred.resolve(result.result);
                        } else {
                            deferred.reject(result.reason);
                        }
                    }).error(function (reason) { deferred.reject(reason); });
                }
                function onError() {
                    deferred.reject(reason);
                }
                return deferred.promise;
            },
            setStorage: function (key, data) {
                var deferred = $q.defer();
                getCurrentDuaid().then(onSuccess, onError);
                function onSuccess(dua_id) {
                    var msg = {};
                    msg.dua_id = dua_id;
                    msg.action = "set";
                    msg.key = key;
                    msg.data = data;
                    $http.post(self.serverUrl + "/uas", msg)
                    .success(function (result) {
                        if (result.status == 0) {
                            deferred.resolve(result);
                        } else {//{status="no",reason="***"}
                            deferred.reject(result.reason);
                        }
                    }).error(function (reason) { deferred.reject(reason); });
                }
                function onError() {
                    deferred.reject(reason);
                }

                return deferred.promise;
            },
            getCurUser: function () {
                if (!curUser) {
                    service.getStorage("userProfile").then(suc, null);
                    function suc(data) {
                        curUser = data;
                    }
                }
                return curUser;
            },
        }
        return service;
        function scanCell() {
            var q = $q.defer();
            Cells.getNCI(function (cellList) {
                var cells = [];
                for (var i = 0; i < cellList.length; i++) {
                    var cell = cellList[i];
                    var type = 'T';/*type:CELL*/
                    var id = cell.mcc + ":" + cell.mnc + ":" + cell.lac + ":" + cell.cid;/*id:string*/
                    var name = "N/A";
                    var dbm = cell.dbm;
                    var reg = cell.reg;
                    cells.push(new wld(type, id, name, dbm, reg));
                }
                q.resolve(cells)
            }, function (reason) { q.reject(reason) });
            return q.promise;
        }
        //目前还不判断WIFI是否链接上
        function scanWifi() {
            var q = $q.defer();
            WifiWizard.getScanResults(function (wifiList) {
                var wifis = [];
                for (var i = 0; i < wifiList.length; i++) {
                    var wifi = wifiList[i];
                    var type = 'F';/*type:WIFI*/
                    var id = wifi.BSSID;/*id:string*/
                    var name = wifi.SSID;
                    var dbm = wifi.level;
                    var reg = 0;
                    wifis.push(new wld(type, id, name, dbm, reg));
                }
                q.resolve(wifis);
                //WifiWizard.getCurrentBSSID(succ, fail);
            }, function (reason) { q.reject(reason) });
            return q.promise;
        }
        function scanBlue() {
            var q = $q.defer();
            var blues = [];
            $cordovaBLE.scan([], 6/*6 seconds*/).then(success, err, notify);
            function success() {
                q.resolve(blues);
            }
            function err(reason) {
                q.reject(reason);
            }
            function notify(ble) {
                if (!ble.hasOwnProperty("name")) ble.name = "N/A";
                var type = 'B';/*type:BLE*/
                var id = ble.id;/*id:string*/
                var name = ble.name;
                var dbm = ble.rssi;
                var reg = 0;//FIXME:增加reg判断

                blues.push(new wld(type, id, name, dbm, reg));
            }
            return q.promise;
        }

        function scanAppStats(startTime, endTime, type) {
            var q = $q.defer();
            AppList.getAppStats(suc, err, startTime, endTime, type);
            function suc(list) {
                var data = [];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].ttf > 0) {
                        list[i].type = type;
                        list[i].ttf = list[i].ttf / 1000;
                        switch (type) {  //判断方法有待改进
                            case 1: {
                                list[i].date = parseInt(new Date(list[i].fts).Format('yyyyMMdd'));
                                break;
                            }
                            case 2: {
                                var fd = parseInt(new Date(list[i].fts).Format('yyyyMMdd'));
                                var ld = parseInt(new Date(list[i].lts).Format('yyyyMMdd'));

                                var d = fd % 100;
                                var month = parseInt(fd / 100);
                                var week;
                                if (d <= 7) {
                                    week = 1;
                                } else if (7 < d <= 14) {
                                    week = 2;
                                } else if (14 < d <= 21) {
                                    week = 3;
                                } else {
                                    week = 4;
                                }
                                list[i].date = month * 100 + week;
                                break;
                            }
                            case 3: {
                                var fd = parseInt(new Date(list[i].fts).Format('yyyyMMdd'));
                                var ld = parseInt(new Date(list[i].lts).Format('yyyyMMdd'));
                                var fd_day = fd % 100;
                                var ld_day = ld % 100;
                                var fd_mon = parseInt(fd / 100);
                                var ld_mon = parseInt(ld / 100);

                                if (fd_mon == ld_mon) {
                                    list[i].date = fd_mon;//201503

                                } else {
                                    fd_day_diff = 31 - fd_day;//上一个月剩多少天
                                    ld_day_diff = ld_day; //这个月过了多少天
                                    if (fd_day_diff > ld_day_diff) {
                                        list[i].date = fd_mon;//201503
                                    } else {
                                        list[i].date = ld_mon;//201503  
                                    }
                                }

                                break;
                            }
                            case 4: {
                                var fd = parseInt(new Date(list[i].fts).Format('yyyyMMdd'));
                                var ld = parseInt(new Date(list[i].lts).Format('yyyyMMdd'));
                                var fd_year = parseInt(fd / 10000);
                                var ld_year = parseInt(ld / 10000);
                                //201409  201507
                                if (fd_year == ld_year) {
                                    list[i].date = fd_year;//2015
                                } else {
                                    var fd_mon_diff = 12 - parseInt(fd / 100) % 100;
                                    var ld_mon_diff = parseInt(ld / 100) % 100;

                                    if (fd_mon_diff > ld_mon_diff) {
                                        list[i].date = fd_year;//2014
                                    } else {
                                        list[i].date = ld_year;//2015  
                                    }
                                }
                                break;
                            }
                        }

                        data.push(list[i]);
                    }

                }
                q.resolve(data);
            }
            function err(reason) {
                q.reject(reason);
            }
            return q.promise;
        }

        function watchGps() {
            console.error("gps is watched");
            var options = { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true };

            $cordovaGeolocation.watchPosition(options).then(null, function (reason) {
                gpsTask = null;
                console.error(JSON.stringify(reason));
            }, function (obj) {
                location.lon = obj.coords.longitude;
                location.lat = obj.coords.latitude;
                location.alt = obj.coords.altitude;
                location.acc = obj.coords.accuracy;
                alert(JSON.stringify(location));
                location.time = new Date().getTime();

                clearInterval(gpsTask);//任务停止但并不是为null
            })
        }

        function wld(type, id, name, dbm, reg) {
            this.type = type;
            this.id = id;
            this.name = name;
            this.dbm = dbm;
            this.reg = reg;
        }


        function duaLocalStorage_isnull() {
            if (localStorage.getItem("duaLocalStorage_0d82839cf42a298708e70c1f5a9f5872") == null)
                return true;
            else
                return false;
        }
        function duaLocalStorage_load() {
            var tmp = localStorage.getItem("duaLocalStorage_0d82839cf42a298708e70c1f5a9f5872");
            if (tmp == null) {
                duaLocalStorage = {};
                duaLocalStorage.initime = new Date().getTime();//dua在本设备的初始化时间
                duaLocalStorage.lastime = new Date().getTime();//dua在本设备的最近一次触发时间
                duaLocalStorage.awaketime = new Date().getTime();
                duaLocalStorage.sleeptime = new Date().getTime();
                duaLocalStorage.lastApplistUploadTime = 0;
                duaLocalStorage.lastAppstatUploadTime = 0;
                duaLocalStorage.activelot = 0;
                duaLocalStorage.activecnt = 0;
                duaLocalStorage.anonymousDuaid = null;
                duaLocalStorage.currentDuaid = null;
                localStorage.setItem("duaLocalStorage_0d82839cf42a298708e70c1f5a9f5872", JSON.stringify(duaLocalStorage));
            } else {
                duaLocalStorage = JSON.parse(tmp);
            }
            return duaLocalStorage;
        }
        function duaLocalStorage_save() {
            localStorage.setItem("duaLocalStorage_0d82839cf42a298708e70c1f5a9f5872", JSON.stringify(duaLocalStorage));
        }

        // 发Born消息
        function getCurrentDuaid() {
            var deferred = $q.defer();
            //如果发现dua_born已经成功过，那么立即返回！
            if (duaLocalStorage.currentDuaid != null) {
                deferred.resolve(duaLocalStorage.currentDuaid);
                return deferred.promise;
            }
            if (duaLocalStorage.anonymousDuaid != null) {
                deferred.resolve(duaLocalStorage.anonymousDuaid);
                return deferred.promise;
            }
            var borninfo = {};


            $q.all([
                    $cordovaAppVersion.getVersionNumber().then(function (version) { borninfo.avn = version; }),
                    $cordovaAppVersion.getVersionCode().then(function (build) { borninfo.avc = build; }),
                    $cordovaAppVersion.getAppName().then(function (name) { borninfo.aname = name; }),
                    $cordovaAppVersion.getPackageName().then(function (str) { borninfo.pname = str; })
            ]).then(postALL, onErr);

            function postALL() {
                borninfo.dsn = $cordovaDevice.getUUID();
                borninfo.model = $cordovaDevice.getModel();
                borninfo.os = $cordovaDevice.getPlatform() + " " + $cordovaDevice.getVersion();
                borninfo.man = $cordovaDevice.getManufacturer();//生产商manufacturer
                if (borninfo.model == null)
                    borninfo.model = "Unknown";
                if (borninfo.avn == null)
                    borninfo.avn = "1.1.1";
                if (borninfo.avc == null)
                    borninfo.avc = "111";
                if (borninfo.aname == null)
                    borninfo.aname = "unknown";
                if (borninfo.pname == null)
                    borninfo.pname = "com.lovearthstudio.unknown";
                if (borninfo.model == null)
                    borninfo.model = "Unknown";
                borninfo.key = "797b75b683162604191d22dba892dfa2";
                borninfo.channel = "Debug";
                borninfo.action = "dua_born";
                borninfo.initime = new Date().getTime() - parseInt(duaLocalStorage.initime);
                borninfo.lastime = new Date().getTime() - parseInt(duaLocalStorage.lastime);
                borninfo.initime = borninfo.initime / 1000;
                borninfo.lastime = borninfo.lastime / 1000;

                $http({
                    method: 'POST',
                    url: self.serverUrl + "/duas",
                    data: borninfo,
                    timeout: 2000,
                }).then(msgSuc, onErr);
                function msgSuc(response) {
                    console.info("dua_born response: " + JSON.stringify(response));
                    if (response.data.status == 0) {
                        duaLocalStorage.anonymousDuaid = response.data.result;
                        duaLocalStorage_save();
                        deferred.resolve(response.data.result);
                    } else {
                        console.error("dua_born response: " + JSON.stringify(response));
                        deferred.reject(response);
                    }
                }
            }
            function onErr(error) {
                console.error("dua_born response: " + JSON.stringify(error));
                deferred.reject(error);
            }
            return deferred.promise;
        }

    }
})