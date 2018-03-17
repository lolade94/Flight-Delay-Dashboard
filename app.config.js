(function (angular) {
    'use script'

    var app = angular.module('app', [

        'chart.js',
        'dashboard',
        'mapDashboard',
        'mapInteractive',
        'barGraph',
        'doughnutChart',
        'ui.router',
        'app.service.data'
    ])
    .run(function($rootScope){
      $rootScope.theme = 'dark';
    });

    app.config(['$urlRouterProvider', function($urlRouterProvider) {
        $urlRouterProvider.otherwise('/'); // default route
    }]);

}(window.angular));
