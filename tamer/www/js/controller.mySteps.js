angular.module('duac.controllers').controller('MyStepsCtrl', MyStepsCtrl);
function MyStepsCtrl($scope, $state, AR, $ionicScrollDelegate) {
    $scope.recs = [];
    $scope.isOn = false;
    $scope.onSwitchChange = function () {
        $scope.isOn ? AR.stop() : AR.start(0);
        $scope.isOn = !$scope.isOn;

        $scope.recs = AR.getRecs();
    }
    $scope.back = function () {
        $state.go('tab.account');
    }
    $scope.test = function () {
        AR.clearRecs();
    }
    $scope.tag = function () {
        return AR.tag();
    }
    $scope.mode = function () {
        return AR.mode();
    }


    function start(mode) {

    }
}