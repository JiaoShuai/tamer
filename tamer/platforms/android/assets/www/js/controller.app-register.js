angular.module('duac.controllers').controller('AppRegisterCtrl', AppRegisterCtrl);
function AppRegisterCtrl($scope, $state, DUA) {
    $scope.goBack = function () {
        $state.go('tab.chats');
    }
    //注册用户的信息填写到这里,这里面写了一个例子是为了方便调试
    $scope.regApp = {
        action: "register",//dua用户注册采用POST方式，action表明具体的post方法.
        name: "爱蓝新闻",
        mcato: "Games",
        scato:"Action",
        com: "爱蓝地球工作室",
        brief: "爱蓝地球工作室的第一个新闻APP,用来测试DUA系统的新闻系统。",
    };
    //regResult显示注册成功与否的信息
    $scope.regResult;
    //注册类别的次类别
    $scope.selectedCato = { mcato: "Other", scato: "Other" };
    $scope.selectedScato = "Other";
    $scope.scatos = [
        { name: "请选择次类别", code: "0" },

    ];
    //选择的主类别
    $scope.selectedMcato = "Other";
    $scope.mcatos = [
        { value: "Other", name: "选择主类别" },
        { value: 'Books', name: "图书" },
        { value: 'Business', name: "商务" },
        { value: 'Catalogs', name: "商品指南" },
        { value: 'Education', name: "教育" },
        { value: 'Entertainment', name: "娱乐" },
        { value: 'Finance', name: "财务" },
        { value: 'Food&Drink', name: "餐饮" },
        { value: 'Games', name: "游戏" },
        { value: 'Health&Fitness', name: "健康健美" },
        { value: 'Lifestyle', name: "生活" },
        { value: 'Medical', name: "医疗" },
        { value: 'Music', name: "音乐" },
        { value: 'Navigation', name: "导航" },
        { value: 'News', name: "新闻" },
        { value: 'Newsstand', name: "报刊杂志" },
        { value: 'Photo&Video', name: "摄影与录像" },
        { value: 'Productivity', name: "效率" },
        { value: 'Reference', name: "参考" },
        { value: 'SocialNetworking', name: "社交" },
        { value: 'Sports', name: "体育" },
        { value: 'Travel', name: "旅游" },
        { value: 'Utilities', name: "工具" },
        { value: 'Weather', name: "天气" },
    ];
    $scope.update = function () {
        console.info("mcato:" + $scope.selectedCato.mcato.name);
        if ($scope.selectedCato.mcato.value == "Games") {
            $scope.scatos = [
                { name: "请选择次类别", value: "" },
                { name: "动作游戏", value: "Action" },
                { name: "探险游戏", value: "Adventure" },
                { name: "街机游戏", value: "Arcade" },
                { name: "桌面游戏", value: "Board" },
                { name: "扑克牌游戏", value: "Card" },
                { name: "娱乐场游戏", value: "Casino" },
                { name: "骰子游戏", value: "Dice" },
                { name: "教育游戏", value: "Educational" },
                { name: "家庭游戏", value: "Family" },
                { name: "音乐", value: "Music" },
                { name: "智力游戏", value: "Puzzle" },
                { name: "赛车游戏", value: "Racing" },
                { name: "角色扮演游戏", value: "RolePlaying" },
                { name: "模拟游戏", value: "Simulation" },
                { name: "体育", value: "Sports" },
                { name: "策略游戏", value: "Strategy" },
                { name: "小游戏", value: "Trivia" },
                { name: "文字游戏", value: "Word" },
                { name: "其他", value: "Other" },
            ];
        }

        if ($scope.selectedCato.mcato.value == "Newsstand") {
            $scope.scatos = [
                { value: 'Arts&Photography', name: "艺术与摄影" },
                { value: 'Automotive', name: "汽车 " },
                { value: 'Brides&Weddings', name: "新娘与婚礼" },
                { value: 'Business&Investing', name: "商务与投资" },
                { value: 'ChildrenMagazines', name: "儿童杂志" },
                { value: 'Computers&Internet', name: "电脑与网络" },
                { value: 'Cooking&Food&Drink', name: "烹饪与饮食" },
                { value: 'Crafts&Hobbies', name: "手工艺与爱好" },
                { value: 'Electronics&Audio', name: "电子产品与音响" },
                { value: 'Entertainment', name: "娱乐" },
                { value: 'Fashion&Style', name: "流行与时尚" },
                { value: 'Health&Mind&Body', name: "健康、心理与生" },
                { value: 'History', name: "历史 " },
                { value: 'Home&Garden', name: "家居与园艺" },
                { value: 'LiteraryMagazines&Journals', name: "文学杂志与期刊" },
                { value: 'MenInterest', name: "男士兴趣" },
                { value: 'Movies&Music', name: "电影与音乐" },
                { value: 'News&Politics', name: "新闻及政治" },
                { value: 'Outdoors&Nature', name: "户外与自然" },
                { value: 'Parenting&Family', name: "子女教养与家庭" },
                { value: 'Pets', name: "宠物" },
                { value: 'Professional&Trade', name: "职业与技能 " },
                { value: 'RegionalNews', name: "地方新闻" },
                { value: 'Science', name: "科学" },
                { value: 'Sports&Leisure', name: "运动与休闲" },
                { value: 'Teens', name: "青少年" },
                { value: 'Travel&Regional', name: "旅游与地域" },
                { value: 'WomenInterest', name: "女士兴趣" },
                { value: 'Other', name: "其他" },
            ];
        }
    }

    $scope.angular_version = angular.version.full;
    $scope.version = 'latest, see github';
    $scope.register = function (regApp) {
        //Fixme:检查各个字段的合法性

        //访问dua服务器,更新本地dua_id
        DUA.registerApp($scope.regApp).then(registerUserSuccess, registerUserError);
        function registerUserSuccess(response) {


        }
        function registerUserError(response) {


        }
    }
}