//在我们的架构中，controllers.js这个文件只写一次，它的依赖都在这里写好。然后再Index.html中置顶include.
//注意，其它controller.**.js一定不要再写依赖。否则会出现无关错误。
angular.module('duac.controllers').controller('TrainCtrl',TrainCtrl);

function TrainCtrl($scope, $http, $cordovaDeviceMotion, $state, $cordovaSQLite, $cordovaDevice, DUA, $ionicPopup, Subjects, $cordovaGeolocation) {
    $scope.$on("$ionicView.enter", function () {
        $scope.subjects = Subjects.all();
        var len = $scope.subjects.length;
        $scope.trainUser = $scope.subjects[len - 1];

        var gps= localStorage.getItem("gps");
        if (gps != null) {
            gps = JSON.parse(gps);
            var now=new Date().getTime();
            if (now - gps.time > 5*60*1000) {
                $scope.updateGps();
            }
            $scope.location.lon = gps.lon;
            $scope.location.lat = gps.lat;
            $scope.location.alt = gps.alt;
            $scope.location.acc = gps.acc;
            $scope.location.time = gps.time;
            $scope.location.timeStr = gps.timeStr;
        }
        if ($scope.location.lon == undefined && $scope.location.lat == undefined && $scope.location.alt == undefined) {
            $scope.gpsGot = false;
            $scope.location.lon = 0;
            $scope.location.lat = 0;
            $scope.location.alt = 0;
        } else {
            $scope.gpsGot = true;
        }
    });

    $scope.gpsGot = false;
    $scope.location = {};
    $scope.updateGps = function () {
        $cordovaGeolocation.getCurrentPosition({ timeout: 5000 }).then(function (obj) {
            $scope.location.lon = obj.coords.longitude;
            $scope.location.lat = obj.coords.latitude;
            $scope.location.alt = obj.coords.altitude;
            $scope.location.acc = obj.coords.accuracy;
            $scope.location.time = obj.timestamp;
            $scope.location.timeStr = new Date(obj.timestamp).toLocaleString();
            //console.info(JSON.stringify($scope.location));
            $scope.gpsGot = true;
            localStorage.setItem("gps", JSON.stringify($scope.location));
        }, function (reason) {
            //$scope.gpsGot = false;
            alert("无法自动获取当前gps信息，请手动更新gps");
        }, null)
    }






    $scope.states = [
    { id: "Unknown", name: "未知" },
    { id: "Jogging",name:"慢跑" },
    { id: "Still", name: "静止" },
    { id: "Petty action", name: "小动作" },
    { id: "Walking", name: "走路" },
    { id: "Running", name: "跑步" },
    { id: "Climbing up stairs", name: "爬楼梯" },
    { id: "Climbing down stairs", name: "下楼梯" },
    { id: "Riding up escalator", name: "乘扶梯上" },
    { id: "Riding down escalator", name: "乘扶梯下" },
    { id: "Riding up elevator", name: "乘电梯上" },
    { id: "Riding down elevator", name: "乘电梯下" },
    { id: "Sitting & relaxing", name: "坐着休息" },
    { id: "WatchingTV", name: "看电视" },
    { id: "Stretching", name: "伸展" },
    { id: "Scrubbing", name: "擦洗" },
    { id: "Folding laundry", name: "叠衣服" },
    { id: "Brushing teeth", name: "刷牙" },
    { id: "Strength-training", name: "伸展训练" },
    { id: "Vacuuming", name: "用吸尘机扫地" },
    { id: "Lying down & relaxing", name: "躺着休息" },
    { id: "Sit-ups", name: "仰卧起坐" }
    ];
    $scope.positions = [
        { id: "Unknown", name: "未知" },
        { id: "Hand Fixed", name: "手固定" },
        { id: "Hand Swing", name: "手摆动" },
        { id: "Pant Pocket", name: "裤兜" },
        { id: "Back Pocket", name: "屁股兜" },
        { id: "Coat Pocket"  , name: "衣兜" },
        { id: "Cheset Pocket", name: "胸兜" },
        { id: "Shoulder Bag"  , name: "肩包" },
        { id: "Arm Bag", name: "挎包" },
        { id: "Hand Bag", name: "提包" },
        { id: "Waist Bag", name: "腰包" },
        { id: "Back Bag", name: "背包" },
    ];
    
    $scope.curState = $scope.states[4];
    $scope.curPosition = $scope.positions[2];
    $scope.switch = { isOn: false };

    $scope.settings = {
        time4seconds: 100,
        note: "",
        delay:5,
        hz:64,
        windowLength: 4,
        windowSize:256
    };
    
    var watchPromise = null;
    var watchTask = null;//settimeout的id.
    var accList = [];
    var start_time;
    var db;
    var dua_id = 0;
    var sc = 0;
    var sp = 0;
    initDB();
    //每次进入这个页面的时候，都要给dua_id赋值
    $scope.$on("$ionicView.enter", function (scopes, states) {
        dua_id = DUA.getCurrentDuaid();
        var delay = localStorage.getItem("delay");
        if (delay != null) {
            $scope.settings.delay = parseInt(delay);
        }
        var hz = localStorage.getItem("hz");
        if (hz != null) {
            $scope.settings.hz=parseInt(hz);
        }
        var windowLength = localStorage.getItem("windowLength");
        if (windowLength != null) {
            $scope.settings.windowLength = parseInt(windowLength);
        }

        var windowSize = localStorage.getItem("windowSize");
        if (windowSize != null) {
            $scope.settings.windowSize = parseInt(windowSize);
        }

    });

    //此时，value is updated value for isOn
    $scope.onSwitchChange = function () {      
        if ($scope.switch.isOn) {//由关闭到打开
            if (watchTask)
            {
                clearTimeout(watchTask);
            }
            if (watchPromise)
            {
                watchPromise.clearWatch();
            }
            $scope.result = $scope.settings.delay + "秒后开始采集加速度";
            var frequency = 1000 / $scope.settings.hz;
            var options = { frequency: frequency };
            watchTask = setTimeout(function () {
                $scope.result = "开始采集加速度";
                watchPromise = $cordovaDeviceMotion.watchAcceleration(options);
                watchPromise.then(null, err, accGot);
            }, $scope.settings.delay * 1000);
        } else {//由打开到关闭
            if (watchTask) {
                clearTimeout(watchTask);
            }
            if (watchPromise) {
                watchPromise.clearWatch();
            }
            accList.length = 0;
            sp = 0;
            $scope.result = "";
            $scope.error = "";
        }
    }



    function accGot(acc) {
        if (accList.length == 0) start_time = new Date().getTime();
        accList.push(acc);
        if (accList.length == $scope.settings.windowSize) {
            var accArray = angular.copy(accList);
            //根据accList计算出它的fft
            UbilibPlugin.getParams(paramsGot, gotError, accArray);
            function paramsGot(ja)
            {
                var params = angular.toJson(ja[0]);
                var data = angular.toJson(ja[1]);
                var fft = angular.toJson(ja[2]);
                var data2 = angular.toJson(ja[3]);
                var fft2 = angular.toJson(ja[4]);
                var model = $cordovaDevice.getModel();
                if (model == "") model = "Unknown";
                var frequency = 1000 / $scope.settings.hz;

                var query = "INSERT INTO accRec (dua_id, name,sex,age,height,weight,interval,time,\
                             act,position,source,data,fft,params,uploaded,data2,fft2,note,lon,lat,alt,acc,md5) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
                $cordovaSQLite.execute(db, query, [dua_id, $scope.trainUser.data.name, $scope.trainUser.data.sex, $scope.trainUser.data.age,
                            $scope.trainUser.data.height, $scope.trainUser.data.weight, frequency, start_time, $scope.curState.id,
                            $scope.curPosition.id, model, data, fft, params, 0, data2, fft2, $scope.settings.note,
                            $scope.location.lon, $scope.location.lat, $scope.location.alt, $scope.location.acc,$scope.trainUser.md5]).then(null, err);
                accList.length = 0;
                $scope.result = "已采集" + (++sp) +"*"+$scope.settings.windowLength+ "*"+$scope.settings.hz+"个加速度";
                console.info($scope.result);
                if (sp == $scope.settings.time4seconds) {
                    sp = 0;
                    $scope.result = "第" + (++sc) + "次采样完成(已存储)，请点击右上方进入编辑界面";
                    clearWatch();
                }
            }
            function gotError(reason) {
                console.error(angular.toJson(reason));
            }



            

        }
    }
    function err(reason) {
        $scope.error = angular.toJson(reason);
    }

    //var inTop = true;
    //$scope.scroll = function () {
    //    if (inTop) {
    //        $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom();
    //        inTop = false;
    //    } else {
    //        $ionicScrollDelegate.$getByHandle('mainScroll').scrollTop();
    //        inTop = true;
    //    }
    //}
    $scope.back = function () {
        $state.go('login');
    }

    function initDB() {
        if (db != null) { return };
        db = $cordovaSQLite.openDB({ name: 'healthyun.db' });
        //$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS accRec");
        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS accRec (id integer primary key autoincrement, \
                    dua_id integer,name string,sex string,age integer,height double,weight double,interval double,\
                    time integer,act string,position string,source string,data text,fft text,params text,uploaded integer,data2 text,fft2 text,note text,lon double,lat double,alt double,acc double,md5 text)");
    }
    $scope.getAccRec=function() {
        $state.go('edit');
    }
    $scope.showInfo = false;
    $scope.toggleInfo = function () {
        $scope.showInfo = !$scope.showInfo;
    };
    $scope.addOrSave = false;
    $scope.addSubject = function () {
        if ($scope.addOrSave) {    //保存，更改下拉列表名字
            if ($scope.trainUser.data.name == null || $scope.trainUser.data.sex == null||
                $scope.trainUser.data.age == null || $scope.trainUser.data.height == null||
                $scope.trainUser.data.weight == null) {
                var confirmPopup = $ionicPopup.confirm({
                    title: '信息不完整',
                    template: '请完整填写信息或放弃添加',
                    buttons: [{text: '放弃添加',
                        onTap: function (e) {
                            $scope.subjects.pop();
                            var len = $scope.subjects.length;
                            $scope.trainUser = $scope.subjects[len - 1];
                            $scope.showInfo = false;
                            $scope.addOrSave = false;
                        }
                    }, { text: '继续填写', type: 'button-positive' }]
                });

                //confirmPopup.then(function (res) {
                //    if (res) {
                //        console.log('You are sure');
                //    } else {
                //        console.log('You are not sure');
                //    }
                //});
                return;
            } else {
                $scope.trainUser.name = $scope.trainUser.data.name;
                $scope.showInfo = false;
                alert("信息保存成功，祝你使用愉快");
            }
        } else { 
            var len = $scope.subjects.push({ name: "姓名", data: {} });
            $scope.trainUser = $scope.subjects[len-1];
            $scope.showInfo = true;
        }
        $scope.addOrSave = !$scope.addOrSave;
    }
}