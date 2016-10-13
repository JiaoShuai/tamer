//在我们的架构中，controllers.js这个文件只写一次，它的依赖都在这里写好。然后再Index.html中置顶include.
//注意，其它controller.**.js一定不要再写依赖。否则会出现无关错误。
angular.module('duac.controllers').controller('LocalCtrl', LocalCtrl);


function LocalCtrl($scope, $state, $cordovaSQLite, $http, DUA, $ionicLoading, $ionicPopup, $timeout) {
    var db;
    var dua_id = DUA.getCurrentDuaid();
    function initDB() {
        //console.info("initDB() is called");
        if (db != null) { return };
        db = $cordovaSQLite.openDB({ name: 'healthyun.db' });
        //$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS accRec");
        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS accRec (id integer primary key autoincrement, \
                    dua_id integer,name string,sex string,age integer,height double,weight double,interval double,\
                    time integer,act string,position string,source string,data text,fft text,params text,uploaded integer,note text,lon double,lat double,alt double,acc double,md5 text)");
    }
    initDB();
    var dataLen = 256;
    $scope.rec = { cnt: 0, total: 0, lastId: 0 };
    $scope.rec.data = [autoIncArray(0, 0, dataLen), autoIncArray(0, 0, dataLen)];
    $scope.rec.fft = [autoIncArray(0, 0, dataLen/2), autoIncArray(0, 0, dataLen/2)];
    var lastId = 0;
    $scope.getRec = function (mode) {
        $scope.tag = "";
        if (mode == -1) {
            var query = "SELECT * FROM accRec WHERE uploaded=0 AND id = (SELECT MAX(id) FROM accRec WHERE id<?)";
            $cordovaSQLite.execute(db, query, [lastId]).then(suc, err);
        } else if (mode == 1) {
            var query = "SELECT * FROM accRec WHERE uploaded=0 AND id>?  LIMIT 1 ";
            $cordovaSQLite.execute(db, query, [lastId]).then(suc, err);
        } else {
            var query = "SELECT * FROM accRec WHERE uploaded=0 order by id desc LIMIT 1 ";
            $cordovaSQLite.execute(db, query, []).then(suc, err);
        }
    }
    function suc(res) {
        if (res.rows.length == 0) {
            $scope.tag = "没有更多记录";
            return;
        }
        setRec(res);
    }
    function err(reason) {
        $scope.err = JSON.stringify(reason);
        console.error($scope.err);
    }
    $scope.delete = function (id) {
        var query = "SELECT * FROM accRec WHERE uploaded=0 AND id>?  LIMIT 1 ";
        $cordovaSQLite.execute(db, query, [id]).then(function (res) {
            if (res.rows.length == 0) {//如果向后没找到，向前找
                var query = "SELECT * FROM accRec WHERE uploaded=0 AND id = (SELECT MAX(id) FROM accRec WHERE id<?)";
                $cordovaSQLite.execute(db, query, [id]).then(function (result) {
                    if (result.rows.length == 0) {
                        lastId = 0;
                        $scope.tag = "记录已经为空";
                        $scope.rec = {};//这里为什么清不掉图表
                        $scope.rec.data = [autoIncArray(0, 0, dataLen)];
                        $scope.rec.fft = [autoIncArray(0, 0, dataLen/2)];
                        return;
                    }
                    setRec(result);
                }, err);
                return;
            }
            setRec(res);
        }, err);
        var query = "DELETE FROM accRec WHERE id=?";
        $cordovaSQLite.execute(db, query, [id]).then(function (res) {
            if (res.rowsAffected != 0) {
                $scope.tag = "记录删除成功！";
            }
        }, err);
    }
    //$scope.upload = function (id) {
    //    if (!id) {
    //        $scope.tag = "当前没有记录";
    //        return;
    //    }
    //    var msg = {};
    //    msg.name = $scope.rec.name;
    //    msg.dua_id = DUA.getCurrentDuaid();
    //    msg.sex = $scope.rec.sex;
    //    msg.age = $scope.rec.age;
    //    msg.height = $scope.rec.height;
    //    msg.weight = $scope.rec.weight;
    //    msg.interval = $scope.rec.interval;
    //    msg.time = $scope.rec.time;
    //    msg.act = $scope.rec.act;
    //    msg.position = $scope.rec.position;
    //    msg.source = $scope.rec.source;
    //    msg.data = $scope.rec.data;
    //    $http({
    //        method: 'POST',//115.28.40.128:8080
    //        //url: "http://10.41.0.100:8080/ivita/compute/ActivityTrainer",
    //        url: "http://ivita.xdua.org/ivita/compute/ActivityTrainer",
    //        data: msg,
    //        timeout: 5000//如果服务其上传超时2000毫秒，自动进入OnError()
    //    }).then(onSuccess, err);
    //    function onSuccess(res) {
    //        if (res.data.status != "ok") {
    //            err(res.data);
    //            return;
    //        }
    //        $scope.tag="记录上传成功";
    //        var query = "UPDATE accRec SET uploaded=1 WHERE id=?";
    //        $cordovaSQLite.execute(db, query, [id]).then(null, err);
    //    }
    //}
    $scope.uploadDisable = false;
    $scope.uploadAll = function () {
        $scope.uploadDisable = true;
        var query = "SELECT count(id) AS c FROM accRec WHERE uploaded=0";
        $cordovaSQLite.execute(db, query, []).then(cntSuc, err);
        function cntSuc(res) {
            if (res.rows.item(0).c == 0) {
                $scope.uploadDisable = false;
                $ionicPopup.alert({
                    template: "本地数据库中没有数据"
                });
            } else {
                $scope.rec.cnt = res.rows.item(0).c;
                $scope.rec.total = res.rows.item(0).c;

                console.info("共" + res.rows.item(0).c + "条记录");
                $ionicLoading.show({
                    template: "<span>{{rec.cnt}}/{{rec.total}}</span>",
                    scope: $scope,
                    animation: 'fade-in',
                    hideOnStateChange: true,
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });
                uploadOne();
            }

            function uploadOne() {
                var query = "SELECT * FROM accRec WHERE uploaded=0 LIMIT 1";
                $cordovaSQLite.execute(db, query, []).then(suc, err);
                function suc(res) {
                    if (res.rows.length == 1) {
                        var row = res.rows.item(0);
                        var msg = { acclist: [] };
                        row.time = (new Date().getTime() - row.time) / 1000;
                        msg.acclist.push(row);
                       

                        $scope.rec.lastId = row.id;

                        console.info("开始上传记录" + row.id);
                        $http({
                            method: 'POST',
                            url: "http://ivita.xdua.org/trainer",
                            data: msg,
                            timeout: 10000//如果服务其上传超时2000毫秒，自动进入OnError()
                        }).then(upSuc, upErr);

                        function upSuc(res) {
                            if (res.data.status != 0 && res.data.status != 100001) {
                                upErr(res.data);
                            } else {        //重复数据不提示
                                $scope.rec.cnt--;
                                //var query = "UPDATE accRec SET uploaded=1 WHERE id=?";
                                var query = "DELETE FROM accRec WHERE id=?";
                                $cordovaSQLite.execute(db, query, [$scope.rec.lastId]).then(delSuc, delErr);

                                function delSuc() {
                                    $timeout(function () {
                                        uploadOne();
                                    }, 100);
                                }
                                function delErr() {
                                    $ionicLoading.hide();
                                    $ionicPopup.alert({
                                        title: "数据库错误",
                                        template: "无法删除记录 " + $scope.rec.lastId + "但已上传成功"
                                    });
                                }
                            }
                        }

                        function upErr(reason) {
                            $ionicLoading.hide();
                            $scope.uploadDisable = false;
                            $ionicPopup.alert({
                                title: "上传记录" + $scope.rec.lastId + "失败",
                                template: JSON.stringify(reason)
                            });
                        }

                    }
                    else {
                        $ionicLoading.hide();
                        $scope.uploadDisable = false;
                        $ionicPopup.alert({
                            title: "上传完成",
                            template: $scope.rec.total + "条记录全部上传成功"
                        });

                        //将界面清空

                    }
                }
            }
        }

        function err(reason) {
            $scope.uploadDisable = false;
            $ionicPopup.alert({
                template: "读取数据库失败"
            });
        }
    }




    $scope.uploadAll2 = function () {
        $scope.uploadDisable = true;
        DUA.auth("upload").then(function (res) {
            var query = "SELECT count(id) AS c FROM accRec WHERE uploaded=0";
            $cordovaSQLite.execute(db, query, []).then(cntSuc, err);
            function cntSuc(res) {
                if (res.rows.item(0).c == 0) {
                    $scope.uploadDisable = false;
                    $ionicPopup.alert({
                        template: "本地数据库中没有数据"
                    });
                } else {
                    $scope.rec.cnt = res.rows.item(0).c;
                    $scope.rec.total = res.rows.item(0).c;

                    console.info("共" + res.rows.item(0).c + "条记录");
                    $ionicLoading.show({
                        template: "<span>{{rec.cnt}}/{{rec.total}}</span>",
                        scope: $scope,
                        animation: 'fade-in',
                        hideOnStateChange: true,
                        showBackdrop: true,
                        maxWidth: 200,
                        showDelay: 0
                    });
                    uploadOne();
                }

                function uploadOne() {
                    var query = "SELECT * FROM accRec WHERE uploaded=0 LIMIT 1";
                    $cordovaSQLite.execute(db, query, []).then(suc, err);
                    function suc(res) {
                        if (res.rows.length == 1) {
                            var row = res.rows.item(0);
                            var msg = { acclist: [] };
                            row.time = (new Date().getTime() - row.time) / 1000;
                            msg.acclist.push(row);
                            $scope.rec.lastId = row.id;

                            console.info("开始上传记录" + row.id);
                            $http({
                                method: 'POST',
                                url: "http://ivita.xdua.org/trainer",
                                data: msg,
                                timeout: 10000//如果服务其上传超时2000毫秒，自动进入OnError()
                            }).then(upSuc, upErr);

                            function upSuc(res) {
                                if (res.data.status != 0 && res.data.status != 100001) {
                                    upErr(res.data);
                                } else {        //重复数据不提示
                                    $scope.rec.cnt--;
                                    //var query = "UPDATE accRec SET uploaded=1 WHERE id=?";
                                    var query = "DELETE FROM accRec WHERE id=?";
                                    $cordovaSQLite.execute(db, query, [$scope.rec.lastId]).then(delSuc, delErr);

                                    function delSuc() {
                                        $timeout(function () {
                                            uploadOne();
                                        }, 100);
                                    }
                                    function delErr() {
                                        $ionicLoading.hide();
                                        $ionicPopup.alert({
                                            title: "数据库错误",
                                            template: "无法删除记录 " + $scope.rec.lastId + "但已上传成功"
                                        });
                                    }
                                }
                            }

                            function upErr(reason) {
                                $ionicLoading.hide();
                                $scope.uploadDisable = false;
                                $ionicPopup.alert({
                                    title: "上传记录" + $scope.rec.lastId + "失败",
                                    template: JSON.stringify(reason)
                                });
                            }

                        }
                        else {
                            $ionicLoading.hide();
                            $scope.uploadDisable = false;
                            $ionicPopup.alert({
                                title: "上传完成",
                                template: $scope.rec.total + "条记录全部上传成功"
                            });

                            //将界面清空

                        }
                    }
                }
            }

            function err(reason) {
                $scope.uploadDisable = false;
                $ionicPopup.alert({
                    template: "读取数据库失败"
                });
            }

        }, function (reason) {     //没有权限
            $scope.uploadDisable = false;
            $ionicPopup.alert({
                title: "操作失败",
                template: "没有权限 " + JSON.stringify(reason)
            });
        });


    }

    function setRec(res) {
        var row = res.rows.item(0);
        lastId = row.id;
        $scope.rec.data[0] = JSON.parse(row.data);
        $scope.rec.data[1] = JSON.parse(row.data2);
        $scope.rec.fft[0] = JSON.parse(row.fft);
        $scope.rec.fft[1]= JSON.parse(row.fft2);
        $scope.rec.params = JSON.parse(row.params);
        $scope.rec.name = row.name;
        $scope.rec.sex = row.sex;
        $scope.rec.age = row.age;
        $scope.rec.height = row.height;
        $scope.rec.weight = row.weight;
        $scope.rec.act = row.act;
        $scope.rec.interval = row.interval;
        $scope.rec.position = row.position;
        $scope.rec.source = row.source;
        $scope.rec.id = row.id;
        $scope.timeString = new Date(row.time).toLocaleString();
        $scope.rec.note = row.note;
    }
    $scope.$on("$ionicView.enter", function (scopes, states) {
        setTimeout(function () {
            $scope.chart.options.responsive = false;
            $scope.chart.options2.responsive = false;
        }, 1000);
        //if (states.fromCache && states.stateName == "edit") {
        //    $scope.getRec(0);
        //}
        //console.info("$ionicView.enter is fired ");
        lastId = 0;
        if (lastId == 0) $scope.getRec(0);
    });
    $scope.back = function () {
        $state.go('tab.train');
    }
    $scope.chart = {
        colours: [
        { // grey
            fillColor: "rgba(10,220,220,0.5)",
            strokeColor: "rgba(10,220,220,0.8)",
            highlightFill: "rgba(10,220,220,0.75)",
            highlightStroke: "rgba(10,220,220,1)",
        }, ],
        colours2: [
        { // grey
            fillColor: "rgba(144,22,184,0.5)",
            strokeColor: "rgba(144,22,184,0.8)",
            highlightFill: "rgba(144,22,184,0.75)",
            highlightStroke: "rgba(144,22,184,1)",
        }, ],
        options: {
            animation: false,
            // Boolean - whether or not the chart should be responsive and resize when the browser does.
            responsive: true,
            // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
            maintainAspectRatio: false,
            // Boolean - If we should show the scale at all
            // 左边scale显示否
            showScale: false,
            // Boolean - If we want to override with a hard coded scale
            // 焦帅：是否使用自定义的scale
            scaleOverride: true,

            // ** Required if scaleOverride is true **
            // Number - The number of steps in a hard coded scale
            scaleSteps: 15,
            // Number - The value jump in the hard coded scale
            scaleStepWidth: 2,
            // Number - The scale starting value
            scaleStartValue: 0,
            // Boolean - Determines whether to draw tooltips on the canvas or not
            // 是否显示提示
            showTooltips: false,
            // Boolean - Whether to show labels on the scale
            // 焦帅注false:only removes the labels on the left but not the bottom.
            //是否显示y轴注解
            scaleShowLabels: true,

            //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
            //纵坐标是否从0开始
            scaleBeginAtZero: true,

            //Boolean - Whether grid lines are shown across the chart
            //是否显示网格线
            scaleShowGridLines: false,

            //String - Colour of the grid lines
            //网格线颜色
            scaleGridLineColor: "rgba(0,0,0,.05)",

            //Number - Width of the grid lines
            //网格线粗细
            scaleGridLineWidth: 1,

            //Boolean - Whether to show horizontal lines (except X axis)
            //是否显示网格水平线
            scaleShowHorizontalLines: false,

            //Boolean - Whether to show vertical lines (except Y axis)
            //是否显示网格竖直线
            scaleShowVerticalLines: false,
            bezierCurve: false,

            //Number - Tension of the bezier curve between points
            bezierCurveTension: 0.4,

            //Boolean - Whether to show a dot for each point
            pointDot: false,

            //Boolean - Whether to show a stroke for datasets
            //在linechart的时候不要显示line中间的填充
            datasetStroke: false,

            //Number - Pixel width of dataset stroke
            datasetStrokeWidth: 0,

            //String - A legend template
            legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
        },
        options2: {
            animation: false,
            // Boolean - whether or not the chart should be responsive and resize when the browser does.
            responsive: true,
            // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
            maintainAspectRatio: false,
            // Boolean - If we should show the scale at all
            // 左边scale显示否
            showScale: false,
            // Boolean - If we want to override with a hard coded scale
            // 焦帅：是否使用自定义的scale
            scaleOverride: false,

            // ** Required if scaleOverride is true **
            // Number - The number of steps in a hard coded scale
            scaleSteps: 10,
            // Number - The value jump in the hard coded scale
            scaleStepWidth: 1,
            // Number - The scale starting value
            scaleStartValue: 0,
            // Boolean - Determines whether to draw tooltips on the canvas or not
            // 是否显示提示
            showTooltips: false,
            // Boolean - Whether to show labels on the scale
            // 焦帅注false:only removes the labels on the left but not the bottom.
            //是否显示y轴注解
            scaleShowLabels: true,

            //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
            //纵坐标是否从0开始
            scaleBeginAtZero: true,

            //Boolean - Whether grid lines are shown across the chart
            //是否显示网格线
            scaleShowGridLines: true,

            //String - Colour of the grid lines
            //网格线颜色
            scaleGridLineColor: "rgba(0,0,0,.05)",

            //Number - Width of the grid lines
            //网格线粗细
            scaleGridLineWidth: 1,

            //Boolean - Whether to show horizontal lines (except X axis)
            //是否显示网格水平线
            scaleShowHorizontalLines: true,
            //Boolean - If there is a stroke on each bar
            //是否显示填充，即bar的外边缘加粗变色
            barShowStroke: true,

            //Number - Pixel width of the bar stroke
            //外边缘加粗宽度
            barStrokeWidth: 1,

            //Number - Spacing between each of the X value sets
            //X轴两个数据间的距离，太小：bar会自动变粗。 太大：bar会重合
            barValueSpacing: 4,

            //Number - Spacing between data sets within X values
            //X轴每个标签内部数据的距离
            barDatasetSpacing: 1,
            //Boolean - Whether to show vertical lines (except Y axis)
            //是否显示网格竖直线
            scaleShowVerticalLines: false,
            bezierCurve: false,

            //Number - Tension of the bezier curve between points
            bezierCurveTension: 0.4,

            //Boolean - Whether to show a dot for each point
            pointDot: false,

            //Boolean - Whether to show a stroke for datasets
            //在linechart的时候不要显示line中间的填充
            datasetStroke: false,

            //Number - Pixel width of dataset stroke
            datasetStrokeWidth: 0,

            //String - A legend template
            legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
        },
        series: ['non-filter','filtered'],
        labels: autoIncArray(0, 0, dataLen),
        labels2: autoIncArray(0, 0, dataLen/2)
    };

    $scope.subject = { name: "" };
    $scope.jumpTo = function () {
        var confirmPopup = $ionicPopup.confirm({
            title: '跳转',
            scope:$scope,
            template: '<h4>跳转到指定测试对象的首条记录</h4>\
                       <p>测试对象名：</p>\
                       <input type="text" ng-model="subject.name">',
            buttons: [{
                text: '确定',
                type: 'button-positive',
                onTap: function (e) {
                    var query = "SELECT * FROM accRec WHERE uploaded=0 AND name=? LIMIT 1 ";
                    $cordovaSQLite.execute(db, query, [$scope.subject.name]).then(suc, err);
                }
            }, { text: '取消'}]
        });

        //confirmPopup.then(function (res) {
        //    if (res) {
        //        console.log('You are sure');
        //    } else {
        //        console.log('You are not sure');
        //    }
        //});
    }






    function autoIncArray(min, inc, length) {
        var ary = new Array();
        for (var i = 0; i < length; i++) {
            ary.push(min + i * inc);
        }
        return ary;
    }
}