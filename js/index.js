angular.module('wikireader', ['ngSanitize']);
angular.module('wikireader')
  .controller('mainController', mainController);

function mainController($sce, $scope, $http) {
  var vm = this;
  vm.editing = false;
  vm.header = "Title";
  vm.title = "Title";
  vm.Content = "Search to see article ";

  function getArticle() {
    //alert(vm.header);
    $http.jsonp($sce.trustAsResourceUrl('https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&titles=' + vm.header), {
        jsonpCallbackParam: 'callback'
      })
      .then(function(response) {
        vm.querydata = response.data.query.pages;
        var keys = Object.keys(vm.querydata);
        if (keys[0] == "-1") {
          $http.jsonp($sce.trustAsResourceUrl('https://en.wikipedia.org/w/api.php?action=opensearch&search=' + vm.header), {
              jsonpCallbackParam: 'callback'
            })
            .then(function(srespon) {
            
            var sresponse=srespon.data;
            console.log(sresponse);
            var sdata=[];
            if(sresponse[1].length == 1){
              getArticleByTitle(sresponse[1][0]);              
            }
            else{
              for(i=0;i<sresponse[1].length;i++){
                sdata.push({title:sresponse[1][i],body:sresponse[2][i],pagelink:sresponse[3][i]});
              }
            vm.searchResult=sdata;            
            }
            vm.title = angular.copy(vm.header);
          vm.editing = false;
            vm.Content = null;
            });
        } else {
          var value = vm.querydata[keys[0]];
          vm.Content = value.extract;
          vm.data = value;
          vm.title = value.title;
          vm.header = angular.copy(vm.title);
          vm.editing = false;
        }
        //$scope.Content = response.data.query.pages[object.keys(querydata)[0]].extract;
      });
  }

  
  function getArticleByTitle(title) {
    //alert(vm.header);
    $http.jsonp($sce.trustAsResourceUrl('https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&titles=' + title), {
        jsonpCallbackParam: 'callback'
      })
      .then(function(response) {
        vm.querydata = response.data.query.pages;
        var keys = Object.keys(vm.querydata);
        if (keys[0] == "-1") {
          
        } else {
          var value = vm.querydata[keys[0]];
          vm.Content = value.extract;
          vm.data = value;
          vm.title = value.title;
          vm.header = angular.copy(vm.title);
          vm.editing = false;
        }
        //$scope.Content = response.data.query.pages[object.keys(querydata)[0]].extract;
      });
  }

  function reAssign() {
    //console.log("vm.title" + vm.title +"vm.header"+vm.header)
    vm.header = angular.copy(vm.title);
    vm.editing = false;
  }
  vm.getArticle = getArticle;
  vm.getArticleByTitle = getArticleByTitle;
  vm.reAssign = reAssign;
}

angular.module('wikireader')
  .directive('ngEnter', function() {
    return function(scope, element, attrs) {
      element.bind("keydown keypress", function(event) {
        //console.log(event.which);
        if (event.which === 13) {
          scope.$apply(function() {
            scope.$eval(attrs.ngEnter);
          });

          event.preventDefault();
        }
      });
    }
  });

angular.module('wikireader')
  .directive('ngCancel', function() {
    return function(scope, element, attrs) {
      element.bind("keydown keypress", function(event) {
        if (event.which === 27 || event.which === 18) {
          scope.$apply(function() {
            scope.$eval(attrs.ngCancel);
          });

          event.preventDefault();
        }
      });
    }
  });

angular.module('wikireader')
  .directive('focusMe', function($timeout) {
    return {
      scope: {
        trigger: '=focusMe'
      },
      link: function(scope, element) {
        scope.$watch('trigger', function(value) {

          element[0].focus();
          if (value === true) {
            //console.log('trigger',value);
            $timeout(function() {
              element[0].focus();
              scope.trigger = false;
            });
          }
        });
      }
    };
  });