angular.module('duac.services')
.provider('AR', function () {
    this.serverUrl = "http://localhost:8080/HealthYun/step/updateStep";
    this.setServerUrl = function (newUrl) {
        this.serverUrl = newUrl;
    }
    var self = this;
    this.$get = function ($http, $cordovaDeviceMotion, $cordovaSQLite) {
        var db;
        var watch = null;
        var options = { frequency: 250 };
        var smode = 0;
        var AccList = [];
        var RecList = [];
        var list_start;
        var curActivity=-1 ;
        var curActivityTimeSpan=0;
        var curActivityStepCount = 0;
        var totalStepCount = 0;
        var tag="没有开启加速度监控";
        var dua_id = 0;
        var curRec = {//全局变量
            time: 0,
            lot: 0,
            act: 'Still',
            position:"Unknown"
        };
        var states = {
            "Unknown": "未知", "Jogging": "慢跑", "Still": "静止", "Walking": "走路", "Running": "跑步", "Climbing up stairs": "爬楼梯", "Climbing down stairs": "下楼梯", "Petty action": "小动作","Sit-ups": "仰卧起坐",
            "Riding up escalator": "乘扶梯上", "Riding down escalator": "乘扶梯下", "Riding up elevator": "乘电梯上", "Riding down elevator": "乘电梯下", "Sitting & relaxing": "坐着休息", "WatchingTV": "看电视",
            "Stretching": "伸展","Scrubbing": "擦洗","Folding laundry": "叠衣服","Brushing teeth": "刷牙","Strength-training": "伸展训练","Vacuuming": "用吸尘机扫地","Lying down & relaxing": "躺着休息" };
        var positions = { "Unknown": "未知", "Hand Fixed": "手固定", "Hand Swing": "手摆动", "Pant Pocket": "裤兜", "Back Pocket": "屁股兜", "Coat Pocket": "衣兜", "Arm Bag": "挎包" };
        var service = {            
            stop : function () {
                if (!watch) {
                    tag="no need to stop";
                    return;
                }
                watch.clearWatch();
                watch = null;
                AccList = [];
                tag="AR service stop";
            },
            start: function (mode) {
                //初始化当前rec的字段
                curRec.time = new Date().getTime();
                curRec.lot = 0;
                curRec.act = 'Still';

                if (mode == 0) {
                    tag = "开始低功耗监控加速度变化 " + new Date().toLocaleTimeString();
                } else {
                    tag = "开始高频率监控加速度变化 " + new Date().toLocaleTimeString();
                }
                var fq = mode == 0 ? 250 : 1000 / 32;
                var options = { frequency: fq };
                if (!watch) {
                    watch = $cordovaDeviceMotion.watchAcceleration(options);
                    watch.then(null, err, success);
                }
                function success(acc) {
                    if (AccList.length == 0) {
                        list_start = new Date().getTime();
                    }
                    AccList.push(acc);     

                    if (mode == 0)//低功耗模式
                    {
                        //低功耗模式下，采集一个数就得判断一次
                        if (AccList.length >= 3)
                        {
                            //下面的判断来自于ubicom文章：Sleep Hunter: Towards Fine Grained Sleep Stage Tracking with Smartphones
                            var acc0 = AccList[0];
                            var acc1 = AccList[1];
                            var acc2 = AccList[2];

                            var a0 = Math.sqrt(acc0.x * acc0.x + acc0.y * acc0.y + acc0.z * acc0.z);
                            var a1 = Math.sqrt(acc1.x * acc1.x + acc1.y * acc1.y + acc1.z * acc1.z);
                            var a2 = Math.sqrt(acc2.x * acc2.x + acc2.y * acc2.y + acc2.z * acc2.z);

                            var v0 = a1 - a0;
                            var v1 = a2 - a1;
                            var dif = v1 - v0;
                            AccList.shift();
                            //如果低功耗模式持续超过1秒，记录下来
                            if (new Date().getTime() - curRec.time > 1000)
                            {
                                curRec.lot = new Date().getTime() - curRec.time;
                                curRec.time = new Date().getTime();
                                curRec.act = "Still";
                                service.addRec(curRec.time, curRec.lot, curRec.act, curRec.position, 0);
                            }
                            //如果遇到加速度剧烈变化，开启高频率模式
                            if (dif > 0.1) {//切换mode
                                watch.clearWatch();
                                watch = null;
                                tag = "检测到加速度剧烈变化，开启高频率模式" + new Date().toLocaleTimeString();
                                AccList = [];
                                //这个地方要把这次的静止记录给结算一下，算出持续时间lot,赋值act为0，然后add进去
                                curRec.lot = new Date().getTime() - curRec.time;
                                curRec.act = "Still";
                                service.addRec(curRec.time,curRec.lot,curRec.act,curRec.position,0);
                                service.start(1);  //这里应该通知函数退出。
                                return;
                            }                            
                        }
                    } else {//高精度模式
                        if (AccList.length >= 128) {                            
                            //var data = mAcc(angular.copy(AccList));
                            //console.info(data);
                            UbilibPlugin.getParams(featuresGot, gotError, angular.copy(AccList));
                            AccList = [];
                            function featuresGot(ja) {
                                var now=new Date().Format("hh:mm:ss");
                                tag = "开始识别行为 " + now;
                                var features = ja[0];
                                console.info(features);
                                service.rec(features,now);
                                if (features.dev < 0.5) {
                                    watch.clearWatch();
                                    watch = null;
                                    tag = "检测到加速度趋于平缓，返回低功耗模式 " + new Date().toLocaleTimeString();
                                    service.start(0);  //这里应该通知函数退出。
                                    return;
                                }
                            }
                            function gotError(reason) {
                                
                            }
                        }
                    }
                }
            },
            addRec: function (time, lot, act,position, mode) {
                var oneRec = {};
                oneRec.time = time;
                oneRec.lot = lot;
                oneRec.act = act;
                oneRec.actName = states[act];
                oneRec.position = position;
                oneRec.positionName = positions[position];
                //首先拿到Reclist的最后一条记录,如果没有一条，那么push进去curRec
                //如果两条记录性质相同并且时间相差不远，那么合并。
                if (RecList.length < 1) {
                    oneRec.mode = 0;
                    RecList.push(oneRec);
                } else {
                    var lastRec = RecList[RecList.length - 1];
                    if (oneRec.act == lastRec.act && oneRec.position == lastRec.position && oneRec.time - lastRec.time < 300000)
                    {
                        lastRec.lot += oneRec.lot;
                    } else {
                        if (RecList.length >= 6) {
                            RecList.shift();
                        }
                        oneRec.mode = mode;
                        RecList.push(oneRec);                    
                    }
                }              
            },
            //StepCounter.countStep(onSuccess, err, accList, start_time%1000);
            //把加速度数据发到服务器上识别
            rec: function (features,time) {
                features.app_key = "ABC";
                features.dua_id = dua_id;
                //features.data = data;
                //console.info(features,new Date().toLocaleString());
                $http({
                    method: 'POST',
                    url: "http://api.xdua.org/ivita/compute/ActivityRecognizer",
                    data: features,
                    timeout: 5000,
                    headers: {
                        'Content-Type': 'text/html'
                    },
                }).then(onSuccess, recErr);
                function onSuccess(res) {
                    if (res.data.status != "ok") {
                        tag = "服务器无法识别 " + time+" 的数据：" + JSON.stringify(res.data);
                        return;
                    }
                    //console.info(JSON.stringify(res.data));
                    service.addRec(new Date().getTime(), 4000,res.data.act,res.data.position,1);
                    //function random(min, max) {
                    //    return Math.floor(Math.random() * (max - min + 1) + min);
                    //}

                    //var at = new Date().Format('yyyyMMdd');
                    //storP(dua_id, at, start_time, res.data.fm, res.data.fstd, res.data.fspp, res.data.fmcr);
                    //if (curActivity == res.data.act) {
                    //    curActivityTimeSpan += 4;
                    //    curActivityStepCount += res.data.step;
                    //} else {
                    //    if (curActivity != -1) {
                    //        var act = new Activity(dua_id, at, start_time, curActivity, curActivityStepCount, curActivityTimeSpan, 0);
                    //        postMSG(act);
                    //        storeDB(dua_id, at, start_time, curActivity, curActivityStepCount, curActivityTimeSpan, 0, 0, 0);
                    //        //console.info(start_time + " " + result[0] + " " + result[1]);
                    //    }
                    //    curActivity = res.data.act;
                    //    curActivityTimeSpan = 4;
                    //    curActivityStepCount = res.data.step;
                    //}
                    //totalStepCount += res.data.step;
                    //console.info("recognized a activity,state: " + res.data.act + " steps: " + res.data.step);
                }
                function recErr(reason) {
                    if (reason.data == null) reason.data = "网络原因";
                    tag = "识别 " + time + " 的数据失败：" + JSON.stringify(reason.data);
                }
                //function postMSG(msg) {
                //    $http({
                //        method: 'POST',
                //        url: self.serverUrl,
                //        data: msg
                //    }).then(function (resp) {
                //        console.info("Send a activity message to server: "+JSON.stringify(msg));
                //        console.info("Server response: "+JSON.stringify(resp.status));
                //    }, err);
                //}
                //function storeDB(dua_id,date,t,s,c,d,p,j,w) {
                //    var query = "INSERT INTO activity (dua_id, date,t,s,c,d,p,j,w) VALUES (?,?,?,?,?,?,?,?,?)";
                //    $cordovaSQLite.execute(db, query, [dua_id, date, t, s, c, d, p, j,w]).then(function (result) {
                //        console.log("INSERT a activity -> " + result.insertId);
                //    }, err);
                //    //var query = "SELECT firstname, lastname FROM people WHERE lastname = ?";
                //    //$cordovaSQLite.execute(db, query, []).then(function (result) {
                //    //    if (result.rows.length > 0) {
                //    //        for (var i = 0; i < result.rows.length; i++) {
                //    //            $scope.outputs.push({
                //    //                "firstname": result.rows.item(i).firstname,
                //    //            });
                //    //        }
                //    //    } else {
                //    //        console.log("No results found");
                //    //    }
                //    //}, function (error) {
                //    //    console.error(error);
                //    //});
                //}
                //function Activity(dua_id, date, t, s, c, d, p) {
                //    this.dua_id = dua_id;
                //    this.date = date;
                //    this.t = t;         //timestamp
                //    this.s = s;        //status
                //    this.c = c;        //stepcount
                //    this.d = d;        //duration
                //    this.p = p;        //phone position to body
                //    this.j = 0;        //lat
                //    this.w = 0;        //lon
                //    return this;
                //}
                //function storP(dua_id,date,t,m, std, spp, mcr) {
                //    var query = "INSERT INTO accParams (dua_id, date,timestamp,mean,std,spp,mcr) VALUES (?,?,?,?,?,?,?)";
                //    $cordovaSQLite.execute(db, query, [dua_id, date, t, m, std, spp, mcr]).then(function (result) {
                //        console.log("stored accList math params -> " + result.insertId);
                //    }, err);
                //}
            },
            tc: function () {
                return totalStepCount;
            },
            tag: function () {
                return tag;
            },
            getRecs:function(){
                return RecList;
            },
            clearRecs:function(){
                RecList.length=0;
            },
            init: function () {
                if (!db) {
                    db = $cordovaSQLite.openDB({ name: 'healthyun.db' });
                    //$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS activity");
                    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS activity (id integer primary key, dua_id integer,\
                    date integer,t integer,s integer,c integer,d integer,p integer,j double,w double)");
                    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS accParams (id integer primary key, dua_id integer,\
                    date integer,timestamp integer,mean double,std double,spp double,mcr double,note text,lon double,lat double,alt double,acc double,md5 text)");
                }
            }    
        };
        return service;
        function err(error) {
            console.error(error);
        }
        function std(array) {
            var ag = avg(array);

            var squareDiffs = array.map(function (value) {
                var diff = value - ag;
                var sqrDiff = diff * diff;
                return sqrDiff;
            });

            var avgSquareDiff = avg(squareDiffs);

            var std = Math.sqrt(avgSquareDiff);
            return std;
        }
        function avg(array) {
            var sum = array.reduce(function (sum, value) {
                return sum + value;
            }, 0);
            var avg = sum / array.length;
            return avg;
        }
        function mAcc(accList) {
            var array = new Array();
            for (var i = 0; i < accList.length; i++) {
                var acc = accList[i];
                var a = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
                array.push(a);
            }
            return array;
        }
    }
})