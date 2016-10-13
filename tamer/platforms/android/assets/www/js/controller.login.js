angular.module('duac.controllers').controller('LoginCtrl',LoginCtrl);
function LoginCtrl($scope, $state, DUA, $ionicLoading, $ionicPopup,$rootScope) {
    //登陆用户的信息填写到这里,这里面写了一个例子是为了方便调试
    $scope.loginUser = {
        action:"login",
        type: "T",//duac只支持电话号码方式登陆，所以这里写死为"tel"
        zone: "+86-",
        tel: "",
        ustr: "+86-15810419011",
        pwd: "",
    };

    $scope.$on("$ionicView.enter", function () {
        var selectedRole = localStorage.getItem("selectedRole");
        if (selectedRole == null) {
            $scope.selectedRole = { value: "all", name: "所有权限" };
        } else {
            $scope.selectedRole = JSON.parse(selectedRole);
        }
        $scope.loginUser.role = $scope.selectedRole.value;
        
    });
    $scope.roles = ['member','admin','root','all'];
    var props = DUA.getProps("duaLocalStorage_0d82839cf42a298708e70c1f5a9f5872", ["currentZone", "currentUtel", "currentUpwd"]);
    if (props && (Object.prototype.toString.call(props) == '[object Array]')) {
        if(props[0])
            $scope.loginUser.zone = props[0];
        if (props[1])
            $scope.loginUser.tel = props[1];
        if (props[2])
            $scope.loginUser.pwd = props[2];
    }
    //登录按钮无效和有效的控制变量
    $scope.loginButtonDisabled = false;
    //用户登陆方法和登录过程控制
    $scope.login = function (loginUser)
    {
        $ionicLoading.show({
            content: 'Loading',
            templateUrl:"templates/myloading.html",
            animation: 'fade-in',
            hideOnStateChange:true,
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
        });
        //判断各个字段的合法性
        //把各个字段进行组装.对电话号码增加"+86-"前缀.
        $scope.loginUser.ustr = $scope.loginUser.zone + $scope.loginUser.tel;
        //把button设为无效,以防止用户连续按登录按钮
        $scope.loginButtonDisabled = true;;
        //访问dua服务器,更新本地dua_id

        //$scope.loginUser.role = "all";
        DUA.loginUser($scope.loginUser).then(
            function (response) {
                $scope.loginButtonDisabled = false;
                if (response.status == 0) {
                    console.info(response.result.rules);
                    $rootScope.permissions = angular.fromJson(response.result.rules);
                    if ($rootScope.permissions == null) $rootScope.permissions = [];
                    DUA.getStorage("user").then(
                        function(data) {
                            console.info("获取用户信息成功！");
                            DUA.setItem("curUser", data);
                        }, function (reason) {
                            //console.error("获取用户资料失败: " + JSON.stringify(reason));
                            //var usr = {
                            //    avatar: 'img/avatar/man.jpg',
                            //    tel: "手机号",
                            //    name: "昵称",
                            //    sex: "M",
                            //    height: 0,
                            //    weight: 0,
                            //}
                            //DUA.setItem("curUser", usr);
                        });
                    //DUA.getStorage("subjects").then(
                    //    function (data) {
                    //        console.info("获取测试对象成功！"+angular.toJson(data));
                    //        //DUA.setItem("subjects", data);
                    //    }, function (reason) {
                    //        console.error("获取测试对象失败: " + angular.toJson(reason));
                    //    });
                    $state.go("tab.train");
                } else {
                    $ionicLoading.hide();
                    $ionicPopup.alert({
                        title: '登陆失败',
                        template: JSON.stringify(response)
                    });
                }
            }, function (response) {
                $scope.loginButtonDisabled = false;
                $ionicLoading.hide();
                $ionicPopup.alert({
                    title: '登陆失败',
                    template: JSON.stringify(response)
                });
            });
        

        //访问dua.service到服务器判断登陆

    }

    $scope.goRegister = function()
    {
        $state.go('register');
    }
}
