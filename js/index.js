angular.module('wikireader', ['ngSanitize']);
angular.module('wikireader')
.run(['$anchorScroll', function($anchorScroll) {
  $anchorScroll.yOffset = 50;   // always scroll by 50 extra pixels
}])
angular.module('wikireader')
  .controller('mainController', mainController);

function mainController($sce, $scope, $http,$anchorScroll,$location) {
  var vm = this;
  vm.editing = false;
  vm.header = "Title";
  vm.title = "Title";
  vm.Content = "Search to see article ";
vm.rightsidenav=false;
  vm.rightsidenav2=false;
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
          vm.searchResult=null;
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

  
  function getInfoboxByTitle(title) {
    //alert(vm.header);
    $http.jsonp($sce.trustAsResourceUrl('https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=' + title+ '&rvsection=0&rvparse' ), {
        jsonpCallbackParam: 'callback'
      })
      .then(function(response) {
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
  vm.headingList=[];
  angular.forEach(angular.element(document).find('h2'), function(value, key){
     var a = angular.element(value);
    var idname='heading'+vm.headingList.length;
    a.attr('id',idname);
     vm.headingList.push({heading:a.text(),id:idname});
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
  vm.getHeadings=getHeadings;
  vm.scrollTo=scrollTo;
  vm.getInfoboxByTitle=getInfoboxByTitle;
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