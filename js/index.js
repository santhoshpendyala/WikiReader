angular.module('wikireader', ['ngSanitize', 'ui.router']);
angular.module('wikireader')
.run(['$anchorScroll', function ($anchorScroll) {
    $anchorScroll.yOffset = 50;   // always scroll by 50 extra pixels
}])

angular.module('wikireader')
    .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
        

        var homeState = {
            name: 'home',
            url: '/',
            templateUrl: 'partials/home.html'
        }
        var wikiState = {
            name: 'home.wiki',
            url: 'wiki/:wval',
            templateUrl: 'partials/wiki.html'
        }
        var searchState = {
            name: 'home.search',
            parent: 'home',
            url: 'search/:sval',
            templateUrl: 'partials/search.html'
        }
        var quoteState = {
            name: 'home.dailyQuote',
            url: 'DailyQuote',
            templateUrl: 'partials/dailyQuote.html'
        }
        var aboutState = {
            name: 'about',
            url: '/about',
            template: '<h3>Its the UI-Router hello world app!</h3>'
        }

        $stateProvider.state(homeState);
        $stateProvider.state(wikiState);
        $stateProvider.state(searchState);
        $stateProvider.state(quoteState);
        //$stateProvider.state(aboutState);
        $urlRouterProvider.otherwise('/DailyQuote');
      
        // use the HTML5 History API
        //$locationProvider.html5Mode(true);
    });

angular.module('wikireader')
  .controller('mainController', mainController);

function mainController($sce, $scope, $http, $anchorScroll, $location,$state, $stateParams) {
    var wval = $stateParams.wval;
    var sval = $stateParams.sval;
    
    var vm = this;
    vm.editing = false;
    vm.header = "Search here";
    vm.title = "Search here";
    vm.Content = "";
    vm.rightsidenav = false;
    vm.rightsidenav2 = false;
    vm.rightsideIcons = false;

    function getArticle() {
        searchArticle(vm.header);
    }
    function searchArticle(svalue) {
        //alert(vm.header);
        $http.jsonp($sce.trustAsResourceUrl('https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&titles=' + svalue), {
            jsonpCallbackParam: 'callback'
        })
          .then(function (response) {
              vm.querydata = response.data.query.pages;
              var keys = Object.keys(vm.querydata);
              if (keys[0] == "-1") {
                  $http.jsonp($sce.trustAsResourceUrl('https://en.wikipedia.org/w/api.php?action=opensearch&search=' + svalue), {
                      jsonpCallbackParam: 'callback'
                  })
                    .then(function (srespon) {
                        var sresponse = srespon.data;
                        //console.log(sresponse);
                        var sdata = [];
                        if (sresponse[1].length == 1) {
                            getArticleByTitle(sresponse[1][0]);
                        }
                        else {
                            for (i = 0; i < sresponse[1].length; i++) {
                                sdata.push({ title: sresponse[1][i], body: sresponse[2][i], pagelink: sresponse[3][i] });
                            }
                            vm.searchResult = sdata;
                        }
                        vm.header = svalue;
                        vm.title = angular.copy(vm.header);
                        vm.editing = false;
                        vm.Content = null;
                        vm.rightsideIcons = false;
                        $state.go('home.search', { sval: svalue });
                    });
              } else {
                  var value = vm.querydata[keys[0]];
                  vm.Content = value.extract;
                  vm.data = value;
                  vm.title = value.title;
                  vm.header = angular.copy(vm.title);
                  vm.editing = false;
                  vm.searchResult = null;
                  vm.rightsideIcons = true;
                  $state.go('home.wiki', { wval: svalue });
              }
              //console.log("vm.rightsideIcons " + vm.rightsideIcons);
              //$scope.Content = response.data.query.pages[object.keys(querydata)[0]].extract;
          });
    }

    function getMainPage() {
        $http.jsonp($sce.trustAsResourceUrl('https://en.wikipedia.org/w/api.php?action=query&titles=Main%20Page&prop=revisions&rvprop=content&format=json'), {
            jsonpCallbackParam: 'callback'
        })
          .then(function (response) {
              vm.querydata = response.data.query.pages;
              var keys = Object.keys(vm.querydata);
              if (keys[0] == "-1") {
                  vm.rightsideIcons = false;
              } else {
                  var value = vm.querydata[keys[0]];
                  vm.Content = value.revisions[0]["*"];
                  console.log(vm.Content);
                  console.log(value);

                  vm.data = value;
                  vm.title = value.title;
                  vm.header = angular.copy(vm.title);
                  vm.editing = false;
                  vm.rightsideIcons = true;
                  vm.searchResult = null;
              }
              //$scope.Content = response.data.query.pages[object.keys(querydata)[0]].extract;
          });
        
    }

    function getQuote() {
        $http.jsonp($sce.trustAsResourceUrl('http://api.forismatic.com/api/1.0/?method=getQuote&format=jsonp&lang=en'), {
            jsonpCallbackParam: 'jsonp'
        })
          .then(function (response) {
              vm.quote = response.data.quoteText;
              vm.quoteAuthor = response.data.quoteAuthor;
              
          });

    }

    function getArticleByTitle(title) {
        //alert(vm.header);
        $http.jsonp($sce.trustAsResourceUrl('https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&titles=' + title), {
            jsonpCallbackParam: 'callback'
        })
          .then(function (response) {
              vm.querydata = response.data.query.pages;
              var keys = Object.keys(vm.querydata);
              if (keys[0] == "-1") {
                  vm.rightsideIcons = false;
              } else {
                  var value = vm.querydata[keys[0]];
                  vm.Content = value.extract;
                  vm.data = value;
                  vm.title = value.title;
                  vm.header = angular.copy(vm.title);
                  vm.editing = false;
                  vm.rightsideIcons = true;
                  vm.searchResult = null;
                  console.log("vm.header" + vm.header);
                  //$state.go('home.wiki', { wval: vm.header }, { notify: false })
              }
              //$scope.Content = response.data.query.pages[object.keys(querydata)[0]].extract;
          });
        //console.log("2.vm.rightsideIcons " + vm.rightsideIcons);
    }

    function getInfoboxByTitle(title) {
        //alert(vm.header);
        $http.jsonp($sce.trustAsResourceUrl('https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=' + title + '&rvsection=0&rvparse'), {
            jsonpCallbackParam: 'callback'
        })
          .then(function (response) {
              vm.infoquerydata = response.data.query.pages;
              var keys = Object.keys(vm.infoquerydata);
              if (keys[0] == "-1") {

              } else {
                  var value = vm.infoquerydata[keys[0]];
                  var infoBox = value.revisions[0];
                  var infokeys = Object.keys(infoBox);
                  vm.infoBox = infoBox[infokeys[0]];
              }
              //$scope.Content = response.data.query.pages[object.keys(querydata)[0]].extract;
          });
    }

    function getHeadings() {
        vm.headingList = [];
        angular.forEach(angular.element(document).find('h2'), function (value, key) {
            var a = angular.element(value);
            var idname = 'heading' + vm.headingList.length;
            a.attr('id', idname);
            vm.headingList.push({ heading: a.text(), id: idname });
        });
    }
    function scrollTo(loc) {
        console.log(loc);
        $location.hash(loc);
        $anchorScroll();
    };

    function reAssign() {
        //console.log("vm.title" + vm.title +"vm.header"+vm.header)
        vm.header = angular.copy(vm.title);
        vm.editing = false;
    }
    
    vm.getArticle = getArticle;
    vm.getArticleByTitle = getArticleByTitle;
    vm.reAssign = reAssign;
    vm.getHeadings = getHeadings;
    vm.scrollTo = scrollTo;
    vm.getInfoboxByTitle = getInfoboxByTitle;
    //getMainPage();
    getQuote();
    if (wval) {
        getArticleByTitle(wval);
    }
    if (sval) {
        searchArticle(sval);
    }
    
}

angular.module('wikireader')
  .directive('ngEnter', function () {
      return function (scope, element, attrs) {
          element.bind("keydown keypress", function (event) {
              //console.log(event.which);
              if (event.which === 13) {
                  scope.$apply(function () {
                      scope.$eval(attrs.ngEnter);
                  });

                  event.preventDefault();
              }
          });
      }
  });

angular.module('wikireader')
  .directive('ngCancel', function () {
      return function (scope, element, attrs) {
          element.bind("keydown keypress", function (event) {
              if (event.which === 27 || event.which === 18) {
                  scope.$apply(function () {
                      scope.$eval(attrs.ngCancel);
                  });

                  event.preventDefault();
              }
          });
      }
  });

angular.module('wikireader')
  .directive('focusMe', function ($timeout) {
      return {
          scope: {
              trigger: '=focusMe'
          },
          link: function (scope, element) {
              scope.$watch('trigger', function (value) {
                  element[0].focus();
                  if (value === true) {
                      //console.log('trigger',value);
                      $timeout(function () {
                          element[0].focus();
                          element[0].setSelectionRange(0,999);
                          scope.trigger = false;
                      });
                  }
              });
          }
      };
  });