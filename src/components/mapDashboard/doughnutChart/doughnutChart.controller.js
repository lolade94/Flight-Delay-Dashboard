(function() {
  'use strict';

  angular.module('doughnutChart')
    .controller('DoughnutChartController', DoughnutChartController);

  function DoughnutChartController($scope, $element, DataService) {
    var vm = this;

   //chart.js options
    vm.options = {
      elements: {
        arc: {
          borderWidth: 0
        }
      }
    };

    //initialize data object
    vm.data = {};

    //Initialize component's title binding
    vm.delay = "for All Delays";

    //Intitialize vm.airlines;
    vm.airlines = [{
        "label": ["American", "Other"],
        "data": [7800000, 34000000],
        "color": ["#A9C5A0", "#848484"]
      },
      {
        "label": ["Delta", "Other"],
        "data": [7200000, 34000000],
        "color": ["#758173",  "#848484"]
      },
      {
        "label": ["Southwest", "Other"],
        "data": [12300000, 34000000],
        "color": ["#BAD9B5",  "#848484"]
      },
      {
        "label": ["United", "Other"],
        "data": [6700000, 34000000],
        "color": ["#C6DEC6",  "#848484"]
      }];

    vm.$onInit = function() {
      vm.loadData();
    }; //vm.$onInit

    vm.$onChanges = function(changeObj) {
      // $onChanges is called BEFORE init the first time
      if (changeObj.delay && !changeObj.delay.isFirstChange()) {
        vm.data.delay = changeObj.delay.currentValue.delay;
        vm.update(vm.data);
      }
    };//vm.$onChanges

    vm.loadData = function() {
       DataService.getMapDashboardDemoData()
        .then(function(data){
          //create data structure
          vm.data.data = data;
          vm.data.minutes = [];
          vm.data.delay = null;

          //update doughnut charts
          vm.update(vm.data);
        });
    };

    vm.update = function(data) {
      var delay = vm.data.delay;
      var minutes = data.data.filter(function(d, i) {
        //Update the vm.delay model
        if (delay === null) {
          vm.delay = "for All Delays";
          return d.delayType === "All";
        } else {
          vm.delay = delay + "s";
          return d.delayType === delay;
        }
      });
      var airlines = minutes[0].Airlines;
      console.log(airlines)
      //Get only an array of minutes
      vm.data.minutes = airlines.map(function(item, i) {
        return item.minutes;
      });

      // create a new array with updated minutes
      vm.airlines = vm.airlines.map(function(item, i) {
        var min = vm.data.minutes[i];
        var array = [min, 34000000];
        console.log(array)

        return {
          "label": item.label,
          "color": item.color,
          "data": array
        };
      });//vm.airlines

    };//vm.update

  } //DoughnutChartController

})();
