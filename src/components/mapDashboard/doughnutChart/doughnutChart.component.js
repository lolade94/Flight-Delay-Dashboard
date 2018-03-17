(function(){
  'use strict';

  angular.module('doughnutChart')
    .component('doughnutChart', {
      bindings: {
        delay: '<',
        data: '<',
        options: '<?'
      },
      controller: 'DoughnutChartController',
      controllerAs: 'vm',
      templateUrl: 'src/components/mapDashboard/doughnutChart/doughnutChart.html'
    });
})();
