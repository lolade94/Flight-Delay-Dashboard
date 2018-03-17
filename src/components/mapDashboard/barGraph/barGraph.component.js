(function(){
  'use strict';

  angular.module('barGraph')
    .component('barGraph', {
      bindings: {
        delay: '<',
        month: '<',
        changeDelay: '&'
      },
      controller: 'BarGraphController',
      templateUrl: 'src/components/mapDashboard/barGraph/barGraph.html',
      controllerAs:'vm'
    });
})();
