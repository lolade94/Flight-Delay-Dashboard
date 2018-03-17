(function () {
    "use strict";
    angular
        .module('dashboard')
        .controller('DashboardController', DashboardController);

        function DashboardController($rootScope){
            var vm = this;
            $rootScope.bodystyle = '';
        }
}());
