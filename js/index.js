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

function mainController(localstorage, $sce, $scope, $http, $anchorScroll, $location, $state, $stateParams) {
    var wval = $stateParams.wval;
    var sval = $stateParams.sval;
    console.log("wval " + wval);
    var vm = this;
    vm.editing = false;
    vm.optPopOvr = false;
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
                  if (localstorage.valueExistsInArray("history", "title", vm.title) == null) {
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
    function valueExistsInArray(name, prName, val) {
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


angular.module('wikireader')
.directive('svgIcon', function () {
    function link(scope, element, attrs) {
        function path(icon) {
            return icons[icon];
        }

        function renderSVG() {
            element.html(path(attrs.p));
        }

        renderSVG();
    }

    return {
        link: link,
        restrict: 'E'
    };
});

var icons = {
    favoriteOutline: '<svg height="32" viewBox="0 0 48 48" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h48v48h-48z" fill="none"/><path d="M33 6c-3.48 0-6.82 1.62-9 4.17-2.18-2.55-5.52-4.17-9-4.17-6.17 0-11 4.83-11 11 0 7.55 6.8 13.72 17.1 23.07l2.9 2.63 2.9-2.63c10.3-9.35 17.1-15.52 17.1-23.07 0-6.17-4.83-11-11-11zm-8.79 31.11l-.21.19-.21-.19c-9.51-8.63-15.79-14.33-15.79-20.11 0-3.99 3.01-7 7-7 3.08 0 6.08 1.99 7.13 4.72h3.73c1.06-2.73 4.06-4.72 7.14-4.72 3.99 0 7 3.01 7 7 0 5.78-6.28 11.48-15.79 20.11z"/></svg>',
    favorite:'<svg height="32" viewBox="0 0 48 48" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h48v48h-48z" fill="none"/><path d="M24 42.7l-2.9-2.63c-10.3-9.35-17.1-15.52-17.1-23.07 0-6.17 4.83-11 11-11 3.48 0 6.82 1.62 9 4.17 2.18-2.55 5.52-4.17 9-4.17 6.17 0 11 4.83 11 11 0 7.55-6.8 13.72-17.1 23.07l-2.9 2.63z"/></svg>',
    listBullteted: '<svg height="32" viewBox="0 0 48 48" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M8 21c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0-12c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 24.33c-1.47 0-2.67 1.19-2.67 2.67s1.2 2.67 2.67 2.67 2.67-1.19 2.67-2.67-1.2-2.67-2.67-2.67zm6 4.67h28v-4h-28v4zm0-12h28v-4h-28v4zm0-16v4h28v-4h-28z"/><path d="M0 0h48v48h-48z" fill="none"/></svg>',
    infoOutline: '<svg height="32" viewBox="0 0 48 48" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h48v48h-48z" fill="none"/><path d="M22 34h4v-12h-4v12zm2-30c-11.05 0-20 8.95-20 20s8.95 20 20 20 20-8.95 20-20-8.95-20-20-20zm0 36c-8.82 0-16-7.18-16-16s7.18-16 16-16 16 7.18 16 16-7.18 16-16 16zm-2-22h4v-4h-4v4z"/></svg>',
    menuBar: '<svg height="32px" viewBox="0 0 32 32" width="32px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4,10h24c1.104,0,2-0.896,2-2s-0.896-2-2-2H4C2.896,6,2,6.896,2,8S2.896,10,4,10z M28,14H4c-1.104,0-2,0.896-2,2  s0.896,2,2,2h24c1.104,0,2-0.896,2-2S29.104,14,28,14z M28,22H4c-1.104,0-2,0.896-2,2s0.896,2,2,2h24c1.104,0,2-0.896,2-2  S29.104,22,28,22z"/></svg>',
    save: '<svg height="32" viewBox="0 0 48 48" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M38 6h-28.02c-2.21 0-3.96 1.79-3.96 4l-.02 28c0 2.21 1.77 4 3.98 4h28.02c2.21 0 4-1.79 4-4v-28c0-2.21-1.79-4-4-4zm0 24h-8c0 3.31-2.69 6-6 6s-6-2.69-6-6h-8.02v-20h28.02v20zm-6-10h-4v-6h-8v6h-4l8 8 8-8z"/><path d="M0 0h48v48h-48z" fill="none"/></svg>',
    saved: '<svg height="32" viewBox="0 0 48 48" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h48v48h-48z" fill="none"/><path d="M38 6h-8.37c-.82-2.32-3.02-4-5.63-4s-4.81 1.68-5.63 4h-8.37c-2.21 0-4 1.79-4 4v28c0 2.21 1.79 4 4 4h28c2.21 0 4-1.79 4-4v-28c0-2.21-1.79-4-4-4zm-14 0c1.1 0 2 .89 2 2s-.9 2-2 2-2-.89-2-2 .9-2 2-2zm-4 28l-8-8 2.83-2.83 5.17 5.17 13.17-13.17 2.83 2.83-16 16z"/></svg>',
    optionVerticle: '<svg height="32" viewBox="0 0 48 48" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h48v48h-48z" fill="none"/><path d="M24 16c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 4c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>',
    search: '<svg height="32" viewBox="0 0 48 48" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M31 28h-1.59l-.55-.55c1.96-2.27 3.14-5.22 3.14-8.45 0-7.18-5.82-13-13-13s-13 5.82-13 13 5.82 13 13 13c3.23 0 6.18-1.18 8.45-3.13l.55.55v1.58l10 9.98 2.98-2.98-9.98-10zm-12 0c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z"/><path d="M0 0h48v48h-48z" fill="none"/></svg>'
}