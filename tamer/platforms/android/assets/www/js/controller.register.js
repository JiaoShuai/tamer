angular.module('duac.controllers').controller('RegisterCtrl', RegisterCtrl);
function RegisterCtrl($scope, $state, DUA, $ionicPopup) {
    //
    $scope.sexes = [
        { text: "男", value: "M" },
        { text: "女", value: "F" },
    ];

    //注册用户的信息填写到这里,这里面写了一个例子是为了方便调试
    $scope.regUser = {
        action:"register",//dua用户注册采用POST方式，action表明具体的post方法.
        type: "T",//duac只支持电话号码方式注册，所以这里写死为"tel"
        zone: "+86-",
        tel:"",
        ustr: "+86-",
        pwd: "",
        pwd2: "",
        role:"member",
        key: '87bef141c833eebd326f9e52caff3fe9',
        incode: '',
        vfcode:null
    };
    $scope.register = function(regUser)
    {
        //Fixme:检查各个字段的合法性
 
        //把各个字段进行组装.对电话号码增加"+86-"前缀.
        $scope.regUser.ustr = $scope.regUser.zone + $scope.regUser.tel;
        $scope.regUser.bday = $scope.regUser.birthday.Format('yyyyMMdd');
        //访问dua服务器,更新本地dua_id
        DUA.registerUser($scope.regUser).then(registerUserSuccess, registerUserError);
        function registerUserSuccess(response) {
            $scope.regResult = JSON.stringify(response);
            $state.go("login");

        }
        function registerUserError(response) {
            $ionicPopup.alert({
                title: "错误",
                template: JSON.stringify(response)
            });
        }
    }

    $scope.promise = {timeout:60,pending:false,text:"获取验证码"};
    $scope.getVfCode = function () {
        $scope.promise.pending = true;

        $scope.regUser.ustr = $scope.regUser.zone + $scope.regUser.tel;
        DUA.getVfCode($scope.regUser.ustr).then(ok, err);
        var interval = setInterval(function () {
            $scope.promise.text = "请等待（" + ($scope.promise.timeout--) + "）秒";
            if ($scope.promise.timeout == 1) {
                $scope.promise.text = "获取验证码";
                clearInterval(interval);
                $scope.promise.pending = false;
            }
        }, 1000);
        function ok(result) {
            $ionicPopup.alert("验证码已发送，一分钟之内有效");

        }
        function err(reason) {
            $ionicPopup.alert({
                title: '验证码发送失败',
                template: JSON.stringify(reason)
            });
        }

    }
}