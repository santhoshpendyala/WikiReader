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
            templateUrl: 'partials/about.html'
        }
        var historyState = {
            name: 'home.history',
            url: 'history',
            templateUrl: 'partials/history.html'
        }
        var favoriteState = {
            name: 'home.favorite',
            url: 'favorite',
            templateUrl: 'partials/favorite.html'
        }
        var savedState = {
            name: 'home.saved',
            url: 'saved',
            templateUrl: 'partials/saved.html'
        }
        $stateProvider.state(homeState);
        $stateProvider.state(wikiState);
        $stateProvider.state(searchState);
        $stateProvider.state(quoteState);
        $stateProvider.state(aboutState);
        $stateProvider.state(historyState);
        $stateProvider.state(favoriteState);
        $stateProvider.state(savedState);
        $urlRouterProvider.otherwise('/DailyQuote');

        // use the HTML5 History API
        //$locationProvider.html5Mode(true);
    });

angular.module('wikireader')
  .controller('mainController', mainController);
//mainController.$inject = ['localstorage'];

angular.module('wikireader')
.controller('historyController', historyController);

angular.module('wikireader')
.controller('favoritesController', favoritesController);

angular.module('wikireader')
.controller('savedController', savedController);

function mainController(localstorage,$sce, $scope, $http, $anchorScroll, $location, $state, $stateParams) {
    var wval = $stateParams.wval;
    var sval = $stateParams.sval;
    console.log("wval " + wval);
    var vm = this;
    vm.editing = false;
    vm.header = "Search here";
    vm.title = "Search here";
    vm.Content = "";
    vm.rightsidenav = false;
    vm.rightsidenav2 = false;
    vm.rightsideIcons = false;
    vm.saved = false;
    vm.favorite = false;

    function getArticle() {
        var values = getsaved(vm.header);
        if (values) {
            //console.log( values);
            vm.Content = values.content;
            vm.data = values;
            vm.title = values.title;
            vm.header = angular.copy(vm.title);
            vm.editing = false;
            vm.searchResult = null;
            vm.rightsideIcons = true;
            vm.saved = true;
            $state.go('home.wiki', { wval: values.title });
            if (localstorage.valueExistsInArray("favorites", "title", vm.title) == null) {
                vm.favorite = false;
            }
            else {
                vm.favorite = true;
            }
        }
        else {
            searchArticle(vm.header);
        }
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
                  //inserting into local storage
                  var hisdata = { title: vm.title, body: vm.Content.replace(/<(?:.|\n)*?>/gm, '').substring(0, 100) }
                  if (localstorage.valueExistsInArray("history", "title", vm.title)==null) {
                      localstorage.setInArray("history", hisdata);
                  }
                  if (localstorage.valueExistsInArray("favorites", "title", vm.title) == null) {
                      vm.favorite = false;
                  }
                  else {
                      vm.favorite = true;
                  }
                  if (localstorage.valueExistsInArray("saved", "title", vm.title) == null) {
                      vm.saved = false;
                  }
                  else {
                      vm.saved = true;
                  }
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
                  //console.log("vm.header" + vm.header);
                  var hisdata = { title: vm.title, body: vm.Content.replace(/<(?:.|\n)*?>/gm, '').substring(0, 100) }
                  if (!localstorage.valueExistsInArray("history", "title", vm.title)) {
                      localstorage.setInArray("history", hisdata);
                  }
                  if (localstorage.valueExistsInArray("favorites", "title", vm.title) == null) {
                      vm.favorite = false;
                  }
                  else {
                      vm.favorite = true;
                  }
                  if (localstorage.valueExistsInArray("saved", "title", vm.title) == null) {
                      vm.saved = false;
                  }
                  else {
                      vm.saved = true;
                  }
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

    function dosave() {
        var hisdata = { title: vm.title, body: vm.Content.replace(/<(?:.|\n)*?>/gm, '').substring(0, 100), content: vm.Content }
        if (localstorage.valueExistsInArray("saved", "title", vm.title) == null) {
            localstorage.setInArray("saved", hisdata);
            vm.saved = true;
            console.log("Added to saved");
        }
    }

    function dofavorite() {
        var hisdata = { title: vm.title, body: vm.Content.replace(/<(?:.|\n)*?>/gm, '').substring(0, 100) }
        if (localstorage.valueExistsInArray("favorites", "title", vm.title) == null) {
            localstorage.setInArray("favorites", hisdata);
            vm.favorite = true;
            console.log("Added to favorites");
        }
    }

    function removesaved() {
        localstorage.removeFromArray("saved", "title", vm.title);
        vm.saved = false;
        console.log("Removed from saved");
    }
    function getsaved(wval) {
        return localstorage.valueExistsInArray("saved", "title", wval);
        //console.log("return from saved");
    }
    function removefavorite() {
        //var hisdata = { title: vm.title, body: vm.Content.replace(/<(?:.|\n)*?>/gm, '').substring(0, 100) }
        localstorage.removeFromArray("favorites", "title", vm.title);
        vm.favorite = false;
        console.log("Removed from favorites");
    }

    vm.getArticle = getArticle;
    vm.getArticleByTitle = getArticleByTitle;
    vm.reAssign = reAssign;
    vm.getHeadings = getHeadings;
    vm.scrollTo = scrollTo;
    vm.getInfoboxByTitle = getInfoboxByTitle;
    vm.dosave = dosave;
    vm.dofavorite = dofavorite;
    vm.removesaved = removesaved;
    vm.removefavorite = removefavorite;
    //getMainPage();
    getQuote();
    if (wval) {
        vm.header = wval;
        //getArticleByTitle(wval);
        getArticle();
    }
    if (sval) {
        searchArticle(sval);
    }

}

function wikiController(localstorage, $sce, $scope, $http, $anchorScroll, $location, $state, $stateParams) {
    var wval = $stateParams.wval;
}

function historyController($scope, localstorage) {
    var vm = this;
    vm.historyData = localstorage.get("history");    
}

function favoritesController($scope, localstorage) {
    var vm = this;
    vm.favoritesData = localstorage.get("favorites");
}

function savedController($scope, localstorage) {
    var vm = this;
    vm.savedData = localstorage.get("saved");
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
                          element[0].setSelectionRange(0, 999);
                          scope.trigger = false;
                      });
                  }
              });
          }
      };
  });

angular.module('wikireader')
.factory('localstorage', function () {
    var retVal = {};
    var ls = window.localStorage;
    function get(name) {
        var val = ls[name];
        if (val != undefined) {
            return JSON.parse(val);
        }
        return null;
    }
    function set(name, val) {
        ls[name] = JSON.stringify(val);
    }
    function setInArray(name, val) {
        var obj = get(name);
        if (obj == null) {
            obj = [];
        }
        obj.push(val);
        ls[name] = JSON.stringify(obj);
    }
    function removeFromArray(name, prName, val) {
        var retVal = null;
        var values = get(name);
        if (values) {
            values.forEach(function (value, index) {
                if (value[prName] == val) {
                    retVal = index;
                }
            })
        }
        if (retVal != null) {
            values.splice(retVal, 1)
            set(name, values);
        }        
        //return retVal;
    }
    function remove(name) {
        if (ls.hasOwnProperty(name)) {
            ls.removeItem(name);
        }
    }
    function valueExistsInArray(name,prName, val) {
        var retVal = null;
        var values = get(name);
        if (values) {
            values.forEach(function (value, index) {
                if (value[prName].toLowerCase() == val.toLowerCase()) {
                    retVal = value;
                }
            })
        }
        return retVal;
    }
    retVal.get = get;
    retVal.set = set;
    retVal.remove = remove;
    retVal.setInArray = setInArray;
    retVal.valueExistsInArray = valueExistsInArray;
    retVal.removeFromArray = removeFromArray
    return retVal;
});


