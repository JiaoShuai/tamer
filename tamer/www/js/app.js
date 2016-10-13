// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('duac', ['ionic', 'duac.controllers', 'duac.services', "chart.js"])

.run(function ($ionicPlatform, $state, $ionicPopup) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleLightContent();
        }
        $ionicPlatform.registerBackButtonAction(function (event) {
            if ($state.current.name.indexOf("tab") != -1 || $state.current.name=="login") {
                var confirmPopup = $ionicPopup.confirm({
                    template: '是否退出应用?',
                    buttons: [{ text: '取消' }, { text: '<b>确定</b>', type: 'button-positive', onTap: function (e) { if (false) { e.preventDefault() } else { return true; } } }]
                });
                confirmPopup.then(function (res) {
                    if (res) {
                        navigator.app.exitApp();
                    } else {
                    }
                });
            } else {
                navigator.app.backHistory();
            }
        }, 100);    //exit

    });
})

.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

    // 通过这句话把安卓平台下的tabs放到底部
    $ionicConfigProvider.platform.android.tabs.position('bottom');
    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider
    // 默认是登陆界面
    .state('login', {
        url: "/login",
        templateUrl: "templates/login.html",
        controller: 'LoginCtrl'
    })
    .state('tab.history', {
        url: '/history',
        views: {
            'tab-history': {
                templateUrl: 'templates/tab-history.html',
                controller: 'HistoryCtrl'
            }
        }
    })
    // 注册界面
    .state('register', {
        url: "/register",
        templateUrl: "templates/register.html",
        controller: 'RegisterCtrl'
    })

    // 注册界面
    .state('add-subject', {
        url: "/add-subject",
        templateUrl: "templates/add-subject.html",
        controller: 'AddSubjectCtrl'
    })

    // 测试对象
    .state('subjects', {
        url: "/subjects",
        templateUrl: "templates/subjects.html",
        controller: 'SubjectsCtrl'
    })
    // 测试对象
    .state('selectSubject', {
        url: "/selectSubject",
        templateUrl: "templates/selectSubject.html",
        controller: 'SelectSubjectCtrl'
    })
    // 角色
    .state('selectRole', {
        url: "/selectRole",
        templateUrl: "templates/selectRole.html",
        controller: 'SelectRoleCtrl'
    })
    // 测试对象细节
    .state('subject-detail', {
        url: "/subject-detail/:subjectName",
        templateUrl: "templates/subject-detail.html",
        controller: "SubjectDetailCtrl"
    })
    .state('editProfile', {
        url: "/editProfile",
        templateUrl: "templates/editProfile.html",
        controller: "EditProfileCtrl"
    })

    // APP注册界面
    .state('app-register', {
        url: "/app-register",
        templateUrl: "templates/app-register.html",
        controller: 'AppRegisterCtrl'
    })
    // setup an abstract state for the tabs directive
    .state('tab', {
        url: "/tab",
        abstract: true,
        templateUrl: "templates/tabs.html"
    })

    // Each tab has its own nav history stack:
    .state('tab.train', {
        url: '/train',
        views: {
            'tab-train': {
                templateUrl: 'templates/tab-train.html',
                controller: 'TrainCtrl'
            }
        }
    })
    //.state('tab.features', {
    //    url: '/features',
    //    views: {
    //        'tab-features': {
    //            templateUrl: 'templates/tab-features.html',
    //            controller: 'FeaturesCtrl'
    //        }
    //    }
    //})
    .state('tab.local', {
        url: '/local',
        views: {
            'tab-local': {
                templateUrl: 'templates/tab-local.html',
                controller: 'LocalCtrl'
            }
        }
    })
    .state('tab.mySteps', {
        url: '/mySteps',
        views: {
            'tab-mySteps': {
                templateUrl: 'templates/tab-mySteps.html',
                controller: 'MyStepsCtrl'
            }
        }
    })
    .state('tab.account', {
        url: '/account',
        views: {
            'tab-account': {
                templateUrl: 'templates/tab-account.html',
                controller: 'AccountCtrl'
            }
        }
    });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('login');

});

Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1,                 //月份 
        "d+": this.getDate(),                    //日 
        "h+": this.getHours(),                   //小时 
        "m+": this.getMinutes(),                 //分 
        "s+": this.getSeconds(),                 //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds()             //毫秒 
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

//UTC比当前时间晚(注意是少不是多)480分钟，故中国得出结果-480
Date.prototype.getTimeZoneGMT = function () {
    return -this.getTimezoneOffset() / 60;
}