//在我们的架构中，controllers.js这个文件只写一次，它的依赖都在这里写好。然后再Index.html中置顶include.
//注意，其它controller.**.js一定不要再写依赖。否则会出现无关错误。
angular.module('duac.controllers').controller('AddSubjectCtrl', AddSubjectCtrl);

function AddSubjectCtrl($scope,$state,$ionicPopup,Subjects) {
    $scope.back = function () {
        $state.go('subjects');
    }
    $scope.trainUser = { data: {name:"焦帅",sex:"M",age:31,height:170,weight:56}};

    $scope.addSubject = function () {
        if (
            $scope.trainUser.data.name == null  ||
            $scope.trainUser.data.sex  == null  ||
            $scope.trainUser.data.age == null   ||
            $scope.trainUser.data.height == null||
            $scope.trainUser.data.weight == null)
        {
            var confirmPopup = $ionicPopup.confirm({
                title: '信息不完整',
                template: '请完整填写信息或放弃添加',
                buttons: [{
                    text: '放弃添加',
                    onTap: function (e) {
                        $scope.subjects.pop();
                        var len = $scope.subjects.length;
                        $scope.trainUser = $scope.subjects[len - 1];
                        $scope.showInfo = false;
                        $scope.addOrSave = false;
                    }
                }, { text: '继续填写', type: 'button-positive' }]
            });
            return;
        } else {
            $scope.trainUser.name = $scope.trainUser.data.name;
            $scope.showInfo = false;
            Subjects.add($scope.trainUser);
            $state.go('tab.train');
        }

    }
}