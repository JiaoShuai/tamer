angular.module('duac.services', ['dua-sdk', 'ngCordova'])
.run(function ($ionicPlatform, $rootScope, Subjects) {
    //这个时候还没有登陆，在这个时候执行代码是不明智的
    //$ionicPlatform.ready(function () {
    //    Subjects.pull().then(null,null);
    //});
    }
)
.factory('Subjects', function ($ionicLoading, $ionicPopup, $q, DUA) {

    //// Some fake testing data
    ////var subjects = [  { name: "焦帅", data: { name: "焦帅", sex: "M", age: 31, height: 170, weight: 56 } },
    //                  { name: "易明雨",data: { name: "易明雨", sex: "M", age: 23, height: 170, weight: 73 } },
    //                  { name: "余杰", data: { name: "余杰", sex: "F", age: 24, height: 160, weight: 55 } },
    //                  { name: "于佃存", data: { name: "于佃存", sex: "M", age: 24, height: 180, weight: 90 } },
    //                  { name: "李啸海", data: { name: "李啸海", sex: "M", age: 23, height: 170, weight: 73 } }, ];

    var subjects = [{ name: "请先修改资料", data: { name: "你的名字", sex: "M", age: 31, height: 170, weight: 56 },md5:"ABCDEFG" }];

    return {
        pull: function () {
            var deferred = $q.defer();

            $ionicLoading.show({
                content: 'Loading',
                templateUrl: "templates/myloading.html",
                animation: 'fade-in',
                hideOnStateChange: true,
                showBackdrop: true,
                maxWidth: 200,
                showDelay: 0
            });

            DUA.getStorage("subjects").then(
              function (res) {
                  $ionicLoading.hide();
                  if (res.status == 'ok') {
                      localStorage.setItem("subjects", angular.toJson(res.data));
                      subjects = res.data;
                      deferred.resolve(subjects);
                  } else {
                      $ionicPopup.alert({
                          title: "错误",
                          template: "获取测试对象失败: "+res.reason
                      });
                  }
              }
              ,
              function (error) {
                  $ionicLoading.hide();
                  $ionicPopup.alert({
                      title: "错误",
                      template: "获取测试对象错误: " + error
                  });
              }
              );
            return deferred.promise;
        },

        all: function () {
            //localStorage.setItem("subjects", angular.toJson(subjects));
            //从localStorage中把所有的测试对象读出来
            //var isDirty = localStorage.getItem("subjects_is_dirty");
            //console.info("是否dirty："+isDirty);
            //if (isDirty==undefined||isDirty==null||isDirty) {

            //}
            //localStorage.setItem("subjects_is_dirty", false);
            var obj = localStorage.getItem("subjects");
            if (obj != null&&obj!=undefined) {
                subjects = angular.fromJson(obj);
            }
            return subjects;
        },
        remove: function (subject) {
            subjects.splice(subjects.indexOf(subject), 1);
            localStorage.setItem("subjects", angular.toJson(subjects));
            localStorage.setItem("subjects_is_dirty", true);
        },
        add: function (subject) {
            var subject_exist = false;
            for (var i = 0; i < subjects.length; i++) {
                if (subjects[i].name === subject.name) {
                    subject_exist = true;
                }
            }
            if (subject_exist == true) {
                $ionicPopup.alert({
                    title: "错误",
                    template: "测试对象" + subject.name + "已存在"
                });
            } else {
                var md5Str = md5(subject.data.name + new Date().getTime());
                subject.md5 = md5Str;
                subjects.push(subject);
                localStorage.setItem("subjects", angular.toJson(subjects));
                localStorage.setItem("subjects_is_dirty", true);
            }
        },
        get: function (name) {
            for (var i = 0; i < subjects.length; i++) {
                if (subjects[i].name === name) {
                    return subjects[i];
                }
            }
        },
        update: function (subject) {
            for (var i = 0; i < subjects.length; i++) {
                if (subjects[i].data.name === subject.data.name) {
                    subjects[i].data = subject.data;
                    subjects[i].name = subject.data.name;
                    localStorage.setItem("subjects", angular.toJson(subjects));
                    localStorage.setItem("subjects_is_dirty", true);
                    return true;
                }
            }
            return false;
        }
    };
});
