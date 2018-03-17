(function () {
    'use strict';

    var module = angular.module('dashboard', ['ui.router'])
        .config(function($stateProvider) {
            $stateProvider.state('dashboard', {
                url: '/',
                templateUrl: 'src/views/dashboard/dashboard.html',
                controller: 'DashboardController',
                controllerAs: 'vm'
            })
        })

})();
