(function() {
  'use strict';

  angular.module('mapDashboard')
    .controller('MapDashboardController', MapDashboardController);

  function MapDashboardController($timeout, $element) {
    var vm = this;

    //initialize delay status
    vm.delayStatus = {
      delay: null
    };

    //initialize monthReport
    vm.monthReport = {
      month: null
    };

    //Month handler for child component callbacks
    vm.selectMonth = function(month) {
      vm.monthReport = angular.copy(month);
    };

    //Delay hanaler for child component callbacks
    vm.selectDelay = function(e) {
      //e is event
      vm.delayStatus = angular.copy(e);
    };

  }

})();
