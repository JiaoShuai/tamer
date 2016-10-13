//在我们的架构中，controllers.js这个文件只写一次，它的依赖都在这里写好。然后再Index.html中置顶include.
//注意，其它controller.**.js一定不要再写依赖。否则会出现无关错误。
angular.module('duac.controllers').controller('FeaturesCtrl', FeaturesCtrl);

function FeaturesCtrl($scope, $http, $state, $cordovaSQLite, $ionicPopup,DUA) {
    $scope.$on("$ionicView.enter", function () {
        var selectedSubject = localStorage.getItem("selectedSubject");
        if (selectedSubject == null) {
            $scope.selectedSubject = { name: "请选择对象", data: { name: "对象的名字", sex: "M", age: 31, height: 170, weight: 56 } };
        } else {
            $scope.selectedSubject = JSON.parse(selectedSubject);
        }
        initDB();
    });

    var db;
    var recList = [];
    var necData={walkSwing:false,runSwing:false};
    $scope.analysis = function () {
        $scope.score.dataGot = false;
        $scope.score.walkGot = false;
        $scope.score.runGot = false;
        $scope.score.maps = {};
        var query = "SELECT * FROM accRec WHERE uploaded=0 AND name=?";
        $cordovaSQLite.execute(db, query, [$scope.selectedSubject.data.name]).then(querySuc, err);
    }
    function querySuc(res) {
        //console.error("记录数目"+res.rows.length);
        for (var i = 0; i < res.rows.length; i++) {
            var row = res.rows.item(i);

            var rec = {};
            rec.params = JSON.parse(row.params);
            rec.act = row.act;
            rec.position = row.position;
            rec.lon = row.lon;
            rec.lat = row.lat;
            rec.alt = row.alt;
            rec.acc = row.acc;

            recList.push(rec);

            if (rec.act == "Walking") {
                $scope.score.walkGot = true;
                if(rec.position=="Hand Swing"){
                    necData.walkSwing=true;
                }
            }
            if (rec.act == "Running") {
                $scope.score.runGot = true;
                if (rec.position = "Hand Swing") {
                    necData.runSwing = true;
                }
            }
            
            //var index=indexOf(row.act, recList);
            //if (index==-1) {
            //    var rec = {};
            //    rec.act = row.act;
            //    rec.paramsList = [];
            //    rec.paramsList.push(JSON.parse(row.params));

            //    recList.push(rec);
            //} else {
            //    recList[index].paramsList.push(JSON.parse(row.params));
            //}
        }

        if (recList.length == 0) {
            alert("当前测试对象没有数据");
            return;
        }
        //if ((!necData.runSwing) && (!necData.walkSwing)) {
        //    alert("必须要有跑步或走路的手摆动");
        //}
        var msg = {};
        msg.action = 'getAnalysis';
        msg.recList = recList;
        msg.name = $scope.selectedSubject.data.name;
        msg.sex = $scope.selectedSubject.data.sex;
        msg.age = $scope.selectedSubject.data.age;
        msg.height = $scope.selectedSubject.data.height;
        msg.weight = $scope.selectedSubject.data.weight;
		msg.dua_id=DUA.getCurrentDuaid();

        console.error(JSON.stringify(msg));
        $http({
            method: 'POST',
            //url: "http://ivita.xdua.org/record",
            url: "http://115.28.40.128:8080/ivita/publicPark/rank",
            data: msg,
            timeout: 5000//如果服务其上传超时2000毫秒，自动进入OnError()
        }).then(suc, err);
    }
    function suc(response) {
        console.error(response.data);
        recList.length = 0;
        if (response.data.status != "ok") {
            alert("错误:" + JSON.stringify(response.data));
            return;
        }
        $scope.score.dataGot = true;
        $scope.score.maps = response.data.data;
    }
    function err(reason) {
        recList.length = 0;
        console.error(reason);
    }

    $scope.names = {
        "Walking_energy": "走路能量",
        "Walking_energy_rank": "走路能量排名",
        "Walking_energy_percentage": "走路能量百分比排名",
        "Walking_stability_rank": "走路稳定性排名",
        "Walking_stability_percentage": "走路稳定性百分排名",
        "Walking_spp": "走路频率",
        "Walking_centroid": "走路重心",
        "Walking_score": "走路分数",
        "Walking_rank": "走路排名",
        "Walking_percentage": "走路百分比排名",

        "Running_energy": "跑步能量",
        "Runing_energy_rank": "跑步能量排名",
        "Runing_energy_percentage": "跑步能量百分排名",
        "Runing_stability_rank": "跑步稳定性排名",
        "Runing_stability_percentage": "跑步稳定性百分比排名",
        "Running_spp": "跑步频率",
        "Running_centroid": "跑步重心",
        "Running_score": "跑步分数",
        "Running_rank": "跑步排名",
        "Running_percentage": "跑步百分比排名",

        "all_score": "总分数",
        "all_rank": "总排名",
        "all_percentage": "总百分比排名"
    };
    $scope.score = {
        dataGot: false,
        walkGot:false,
        runGot: false,
        maps: {           
        }
    };

    $scope.getPersonAmount = function (map) {
        if ($scope.score.runGot && $scope.score.walkGot) {
            return $scope.score.maps[map].all_amount;
        } else {
            if ($scope.score.runGot) {
                return "跑步" + $scope.score.maps[map].Walking_amount;
            } else{ 
                if ($scope.score.walkGot) {
                    return "走路" + $scope.score.maps[map].Running_amount;
                }
            }
        }
    }

    $scope.percentageToStars = function (float) {
        var minStar = 0.0;
        if (float == null) {
            return minStar*100 + '%';
        } else {
            var per = 1 - parseFloat(float);
            if (per<minStar) {
                per = minStar;
            }
            return per*100 ;
        }
    }





    function indexOf(str, objArray) {
        var index = -1;
        for (var i = 0; i < objArray.length; i++) {
            if (objArray[i].act == str) {
                index = i;
                break;
            }
        }
        return index;
    }
    function initDB() {
        //console.info("initDB() is called");
        if (db != null) { return };
        db = $cordovaSQLite.openDB({ name: 'healthyun.db' });
        //$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS accRec");
        $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS accRec (id integer primary key autoincrement, \
                    dua_id integer,name string,sex string,age integer,height double,weight double,interval double,\
                    time integer,act string,position string,source string,data text,fft text,params text,uploaded integer,note text,lon double,lat double,alt double,acc double,md5 text)");
    }
}