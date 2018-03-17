(function(angular) {
  'use strict';

  angular.module('app.service.data', [])
    .service('DataService', ['$http', DataService]);

  function DataService($http) {

    function getData(url) {
      return $http.get(url)
        .then(function(res) {
          return res.data;
        })
        .catch(function(err) {
          throw new Error(err.data);
        });
    }

    return {
      getData: getData,
      getMapDashboardDemoData: function(){
        return getData('src/assets/data/mapDashboardDemo/airlines.json')
      }
    };

  }

}(window.angular));
