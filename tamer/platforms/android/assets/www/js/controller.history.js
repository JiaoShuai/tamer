//在我们的架构中，controllers.js这个文件只写一次，它的依赖都在这里写好。然后再Index.html中置顶include.
//注意，其它controller.**.js一定不要再写依赖。否则会出现无关错误。
angular.module('duac.controllers').controller('HistoryCtrl', HistoryCtrl);


function HistoryCtrl($scope, $state, $http, $ionicLoading, $ionicPopup,DUA,$rootScope) {
    $scope.delPm = false;
    $scope.setGoodPm = false;
    $scope.rec = {};
    var dataLen = 256;
    $scope.rec.data = [autoIncArray(0, 0, dataLen), autoIncArray(0, 0, dataLen)];
    $scope.rec.fft = [autoIncArray(0, 0, dataLen/2)];
    var lastId=0;
    $scope.getRec = function (mode) {
        $scope.tag = "";
        var msg = {};
        msg.action = 'getRecord';
        msg.direction = mode;
        msg.inc = lastId;
        $http({
            method: 'POST',
            url: "http://ivita.xdua.org/record",
            data: msg,
            timeout: 5000//如果服务其上传超时2000毫秒，自动进入OnError()
        }).then(suc, err);
    }
    function suc(res) {
        if (res.data.status !=0) {
            $scope.tag = "服务器没有更多数据库";
            console.error(JSON.stringify(res.data));
            return;
        }
        setRec(res.data.result);
    }
    function err(reason) {
        $ionicPopup.alert({
            title: '错误',
            template: JSON.stringify(reason)
        });
    }
    $scope.delete = function (id) {
        var msg = {};
        msg.action = 'deleteRecord';
        msg.inc = id;
        msg.dua_id = DUA.getCurrentDuaid();
        $http({
            method: 'POST',
            url: "http://ivita.xdua.org/record",
            data: msg,
            timeout: 5000//如果服务其上传超时2000毫秒，自动进入OnError()
        }).then(delSuc, err);
        function delSuc(res) {
            console.info(msg,res);
            if (res.data.status != 0) {
                err(res.data.reason);
                return;
            }
            $ionicPopup.alert({               
                template: '记录删除成功'
            });
            $scope.getRec(-1);
        }
    }
    function setRec(recStr) {
        if (recStr == null) {
            console.error("没有获取到数据！");
            return;
        }
        var row = recStr[0];

        $scope.rec.data[0] = JSON.parse(row.data);
        $scope.rec.data[1] = JSON.parse(row.data_filter);
        $scope.rec.fft[0] = JSON.parse(row.fft);
        $scope.rec.params = JSON.parse(row.features);
        lastId = row.id;
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
        $scope.timeString = new Date(row.time*1000).toLocaleString();
    }
    //$scope.$on("$ionicView.loaded", function () {
    //    console.info("$ionicView.loaded is fired ");
    //    setTimeout(function () {
    //        $scope.chart.options.responsive = false;
    //        $scope.chart.options2.responsive = false;
    //    }, 1000);
    //});
    $scope.$on("$ionicView.enter", function (scopes, states) {
        //setTimeout(function () {
        //    $scope.chart.options.responsive = false;
        //    $scope.chart.options2.responsive = false;
        //}, 1000);
        //if (states.fromCache && states.stateName == "edit") {
        //    $scope.getRec(0);
        //}
        console.info("$ionicView.enter is fired ");
        $scope.delPm = false;
        $scope.setGoodPm = false;
        if (lastId == 0) $scope.getRec(0);
        if ($rootScope.permissions.indexOf('deleteTrainRecord') != -1) {
            $scope.delPm = true;
        }
        if ($rootScope.permissions.indexOf('setTrainRecordGood') != -1) {
            $scope.setGoodPm = true;
        }
    });
    $scope.setGood = function (id) {
        var msg = {};
        msg.action = 'setGood';
        msg.inc = id;
        msg.dua_id = DUA.getCurrentDuaid();
        $http({
            method: 'POST',
            url: "http://ivita.xdua.org/record",
            data: msg,
            timeout: 5000//如果服务其上传超时2000毫秒，自动进入OnError()
        }).then(suc, err);
        function suc(res) {
            console.info(msg, res);
            if (res.data.status != 0) {
                err(res.data.reason);
                return;
            }
            $ionicPopup.alert({
                template: '记录标记成功'
            });
        }
    }
    $scope.back = function () {
        $state.go('tab.features');
    }
    $scope.chart = {
        colours:[
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

            //Boolean - Whether to show vertical lines (except Y axis)
            //是否显示网格竖直线
            scaleShowVerticalLines: false,

            //Boolean - If there is a stroke on each bar
            //是否显示填充，即bar的外边缘加粗变色
            barShowStroke: false,

            //Number - Pixel width of the bar stroke
            //外边缘加粗宽度
            barStrokeWidth: 2,

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
        labels: autoIncArray(0, 0, 128),
        labels2:autoIncArray(0,0,64)
    };
    function autoIncArray(min, inc, length) {
        var ary = new Array();
        for (var i = 0; i < length; i++) {
            ary.push(min + i * inc);
        }
        return ary;
    }
}