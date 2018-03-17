(function(){
  'use strict';

  angular.module('mapInteractive')

    .component('mapInteractive', {
      bindings: {
        delay: '<',
        month: '<',
        changeMonth: '&'
      },
      controller: 'MapInteractiveController',
      templateUrl: 'src/components/mapDashboard/mapInteractive/mapInteractive.html',
      controllerAs:'vm'
    });

})();
