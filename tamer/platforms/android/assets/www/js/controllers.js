//在我们的架构中，controllers.js这个文件只写一次，它的依赖都在这里写好。然后再Index.html中置顶include.
//注意，其它controller.**.js一定不要再写依赖。否则会出现无关错误。
angular.module('duac.controllers', ['dua-sdk', 'ngCordova'])

.controller('SubjectsCtrl', function ($scope, $state, Subjects, DUA, $ionicPopup) {
    //$scope.$on("$ionicView.loaded", function () {
    //    $scope.subjects = Subjects.all();
    //    localStorage.setItem("subjects_is_dirty", false);
    //});
    $scope.$on("$ionicView.enter", function () {
        $scope.subjects = [];
        $scope.subjects = Subjects.all();
        //$scope.is_dirty = localStorage.getItem("subjects_is_dirty");
        //if ($scope.is_dirty == true)
        //{
        //    $scope.subjects = Subjects.all();
        //    localStorage.setItem("subjects_is_dirty", false);
        //}
    });
    $scope.remove = function (subject) {
        Subjects.remove(subject);
        console.info(Subjects.all());
    }
    $scope.goAddSubject = function () {
        $state.go("add-subject");
    }
    $scope.back = function () {
        $state.go("tab.account");
    }
    $scope.upload = function () {
        DUA.setStorage("subjects", $scope.subjects).then(suc, err);
        function suc(res) {
            if (res.status == 0) {
                $ionicPopup.alert({
                    template: "保存成功"
                });
                localStorage.setItem("subjects_is_dirty", false);
                $scope.is_dirty = false;
            } else {
                $ionicPopup.alert({
                    title: "错误",
                    template: JSON.stringify(res)
                });
            }
        }
        function err(reason) {
            $ionicPopup.alert({
                title: "错误",
                template: reason
            });
        }
    }
})

.controller('SelectRoleCtrl', function ($scope, $state) {
    $scope.roles = [{ value: "root", name: "根用户" }, { value: "admin", name: "管理员" },
        { value: "member", name: "普通用户" }, { value: "all", name: "所有权限" }];
    $scope.curRadio = { selectedRole: { value: "all", name: "所有权限" } };

    $scope.$on("$ionicView.enter", function () {
        $scope.curRadio.selectedRole = localStorage.getItem("selectedRole");
        if ($scope.curRadio.selectedRole == null) $scope.curRadio.selectedRole = { value: "all", name: "所有权限" };
    });

    $scope.select = function (role) {
        localStorage.setItem("selectedRole", JSON.stringify(role));
        $state.go('login');
    }
})

.controller('SelectSubjectCtrl', function ($scope, $state, Subjects) {
    //$scope.curRadio = {};
    $scope.$on("$ionicView.enter", function () {
        $scope.subjects = Subjects.all();
        //var len = $scope.subjects.length;
        //$scope.curRadio.selectedSubject = $scope.subjects[len - 1];
    });

    $scope.select = function (subject) {
        localStorage.setItem("selectedSubject", JSON.stringify(subject));
        $state.go('tab.features');
    }
})

.controller('SubjectDetailCtrl', function ($scope, $stateParams, Subjects, $state) {
    $scope.subject = Subjects.get($stateParams.subjectName);
    $scope.save = function (subject) {
        var result = Subjects.update(subject);
        if (result) {
            $state.go("tab.train");
        } else {
            alert("保存失败");
        }

    }
})

.controller('EditProfileCtrl', function ($scope, $stateParams, $state, DUA, $ionicPopup) {
    $scope.input = { birthday: null };
    var str = DUA.getItem("curUser");
    if (str) {
        $scope.user = JSON.parse(str);
    } else {
        $scope.user = {};
    }
    if ($scope.user.bday) {
        $scope.input.birthday = parseDate($scope.user.bday + "");
    }

    function parseDate(str) {
        if (!/^(\d){8}$/.test(str)) return "invalid date";
        var y = str.substr(0, 4),
            m = str.substr(4, 2),
            d = str.substr(6, 2);
        return new Date(y, m, d);
    }
    $scope.save = function () {
        if ($scope.user.birthday != null) {
            $scope.user.bday = parseInt($scope.input.birthday.Format('yyyyMMdd'));//如果生日没输入的话会出现错误：Cannot call method 'Format' of null
        }
        $scope.user.height = parseInt($scope.user.height);
        $scope.user.weight = parseInt($scope.user.weight);
        DUA.setStorage("user", $scope.user).then(suc, err);
        function suc(res) {
            if (res.status == 0) {
                $ionicPopup.alert({
                    template: "保存成功"
                });
            } else {
                $ionicPopup.alert({
                    title: "错误",
                    template: JSON.stringify(res)
                });
            }
        }
        function err(reason) {
            $ionicPopup.alert({
                title: "错误",
                template: reason
            });
        }
    }
    $scope.back = function () {
        $state.go('tab.account');
    }
})


.controller('AccountCtrl', function ($scope, $state, DUA, $ionicPopup) {
    $scope.settings = {
        delay: 5,
        hz: 64,
        windowLength: 4,
        windowSize: 256
    };

    $scope.saveSettings = function () {
        localStorage.setItem("delay", $scope.settings.delay);
        localStorage.setItem("hz", $scope.settings.hz);
        localStorage.setItem("windowLength", $scope.settings.windowLength);
        localStorage.setItem("windowSize", $scope.settings.windowSize);
        $state.go("tab.train");
    }


    $scope.$on("$ionicView.enter", function () {
        var delay = localStorage.getItem("delay");
        if (delay != null) {
            $scope.settings.delay = parseInt(delay);
        }
        var hz = localStorage.getItem("hz");
        if (hz != null) {
            $scope.settings.hz = parseInt(hz);
        }
        var windowLength = localStorage.getItem("windowLength");
        if (windowLength != null) {
            $scope.settings.windowLength = parseInt(windowLength);
        }
        var windowSize = localStorage.getItem("windowSize");
        if (windowSize != null) {
            $scope.settings.windowSize = parseInt(windowSize);
        }
        DUA.getStorage("user").then(
            function (data) {
                $scope.curUsr = data;
            }, null);
    });
    if (!$scope.curUsr) {  //这种情况一般不会出现
        $scope.curUsr = {
            avatar: 'img/avatar/man.jpg',
            tel: "手机号",
            name: "昵称",
            sex: "M",
            height: 0,
            weight: 0,
            age: 0
        };
    }
    $scope.goLogin = function () {
        console.info("onSwipLeft() has been called!");
        $state.go('login');
    }
    $scope.logout = function () {
        $state.go('login');
    }
    $scope.usageStats = { isOn: false };
    $scope.onSwitchChange = function () {
        if ($scope.usageStats.isOn) {
            if (typeof cordova.plugins.settings.openSetting != undefined) {
                cordova.plugins.settings.openSetting("usage_access",
                    function () {
                        console.log("opened usage_access settings")
                    },
                    function () {
                        console.error("failed to open settings")
                    });
            }

        } else {

        }
    }
});
























