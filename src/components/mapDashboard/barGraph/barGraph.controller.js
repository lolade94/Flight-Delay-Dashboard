(function () {
	'use strict';

	angular.module('barGraph')
		.controller('BarGraphController', BarGraphController);

	function BarGraphController($scope, $element) {

		var vm = this;
		var el = d3.select($element[0]);
		var defaultOptions = {
			width: 600,
			height: 300,
			chartWidth: 650,
			margin: {
				top: 20,
				right: 20,
				bottom: 30,
				left: 40
			},
			relativePath: '../../../src/assets/data/mapDashboardDemo/delays.csv',
			colors: ["#023436", "#ffd8a8", "#7b6888"]
		};

		vm.$onInit = function () {
			vm.tab = 1;
			vm.delayTitle = "Delays";
			vm.options = angular.extend({}, defaultOptions, vm.options);
      vm.barHeight = vm.options.height - vm.options.margin.top - vm.options.margin.bottom;

			//Tooltip
			vm.d3ToolTip = d3.select("body").append("div")
				.attr("class", "tooltip")
				.style("opacity", 0);

			// create svg
			vm.svg = el.append('svg')
				.attr("class", "barGraph")
				.attr("width", vm.options.chartWidth)
				.attr("height", vm.options.height)
				.append("g")
				.attr("id", "graph-container")
				.attr("transform", "translate(" + vm.options.margin.left + "," + vm.options.margin.top + ")");

    //create Left Axis group
			vm.leftAxis = vm.svg.append("g")
				.attr("class", "axis")
				.attr("id", "leftAxis");

			vm.resize();
			vm.loadData();
		};

		vm.$onChanges = function (changeObj) {

			if (changeObj.month && !changeObj.month.isFirstChange()) {
				vm.data.month = changeObj.month.currentValue.month;
				vm.update(vm.data);
			}
		};

		vm.setTab = function (tabId) {
			vm.tab = tabId;
		};

		vm.isSet = function (tabId) {
			return vm.tab === tabId;
		};

		vm.loadData = function () {
			d3.csv(vm.options.relativePath, function (d, i, columns) {
				for (var j = 1, n = columns.length; j < n; ++j) {
					d[columns[j]] = +d[columns[j]];
				}
				return d;
			}, function (error, data) {
				if (error) throw error;

				vm.data = {
					"data": data,
					"delayType": null
				};

				vm.createGrid();
				vm.update(vm.data);
			});
		};

		vm.createGrid = function () {
			var y = d3.scaleLinear()
				.rangeRound([vm.barHeight, 0]);

			// add the Y gridlines
			vm.svg.append("g")
				.attr("class", "grid")
				.call(make_y_gridlines()
					.tickSize(-vm.options.width)
					.tickFormat(""));

			function make_y_gridlines() {
				return d3.axisLeft(y)
					.ticks();
			}
		};

		vm.selectDelay = function ($event, value) {
			if (value === "null") {
				vm.data.delayType = null;
				vm.delayTitle = "Delays";
			} else {
				vm.data.delayType = value;
				vm.delayTitle = value + "s";
			}

			vm.changeDelay({
				$event: {
					delay: vm.data.delayType
				}
			});

			vm.update(vm.data);
		};

		vm.resize = function () {
			vm.svg.attr('width', vm.options.chartWidth)
				.attr('height', vm.options.height);
		};

		vm.update = function (dataObj) {

			var keys;
			var data = dataObj.data;
			var month = dataObj.month;
			var delay = dataObj.delayType;
			var formatComma = d3.format(",");
			var filtered = data.map(function (item, i) {
				if (delay === null) {
					keys = Object.keys(item);
					keys.shift();
					return item;
				} else {
					//
					var newItem = _.pick(item, ['Months', delay]);
					keys = Object.keys(newItem);
					keys.shift();
					return newItem;
				}
			});
			var x0 = d3.scaleBand()
				.rangeRound([0, vm.options.width])
				.paddingInner(0.1);

			var x1 = d3.scaleBand()
				.padding(0.09);
			var y = d3.scaleLinear()
				.rangeRound([vm.barHeight, 0]);
			var color = d3.scaleOrdinal()
				.range(vm.options.colors);


			x0.domain(data.map(function (d) {
				return d.Months;
			}));
			x1.domain(keys).rangeRound([0, x0.bandwidth()]);
			y.domain([0, d3.max(data, function (d) {
				return d3.max(keys, function (key) {
					return d[key];
				});
			})]).nice();

			//build left axis
			vm.leftAxis.call(d3.axisLeft(y).ticks(null, "s"));

			//create grouped bars
			var barGroup = vm.svg.selectAll('g.barGroup')
				.data(filtered)
				.enter()
				.append('g')
				.attr("class", "barGroup")
				.attr("transform", function (d) {
					return "translate(" + x0(d.Months) + ", 0)";
				});

			//Remove Bar Group Nodes
			barGroup.exit().remove();

			//create individual bars
			var bars = vm.svg.selectAll('.barGroup')
				.attr("fill-opacity", function (d) {
					//filtered by the month
					if (month === null || month === undefined) {
						return 1;
					} else if (d.Months !== month) {
						return 0.4;
					}
				})
				.selectAll(".bar")
				.remove()
				.exit()
				.data(function (d) {
					return keys.map(function (key) {
						return {
							key: key,
							value: d[key]
						};
					});
				});

			//Add the updated bars
			bars.enter()
				.append("rect")
				.attr("x", function (d) {
					return x1(d.key);
				})
				.attr("y", function (d) {
					return y(0);
				})
				.attr('width', x1.bandwidth())
				.attr('height', 0)
				.attr('class', 'bar')
				.attr("fill", function (d) {
					if (d.key === "Extreme Weather Delay")
					  return "#BBDBD1";
					else if (d.key === "Aviation System Delay")
						return "#00BFB3";
					else {
						return "#7E78D2";
					}
				})
				.on("mouseover", hoverOn)
				.on("mouseleave", hoverOff);

			// Bar transition
			vm.svg.selectAll(".bar")
				.transition()
				.duration(1000)
				.ease(d3.easeLinear)
				.attr("height", function (d) {
					return vm.barHeight - y(d.value);
				})
				.attr("y", function (d) {
					return y(d.value);
				});

			//create bottom axis
			vm.svg.append("g")
				.attr("id", "axisBottom")
				.attr("class", "axis")
				.attr("transform", function () {
					return "translate(0," + (vm.barHeight + 5) + ")";
				})
				.attr("font-size", "14px")
				.call(d3.axisBottom(x0));


			function hoverOn(d) {
				d3.select(this)
          .attr("fill-opacity", 0.9);

				vm.d3ToolTip.transition()
					.duration(200)
					.style("opacity", 0.9);

				vm.d3ToolTip.html("<span id='delay' class='colorKey'>" + d.key + "</span>" + "<br/>" + formatComma(d.value))
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY - 28) + "px");

				d3.select(".colorKey")
					.style("color", function () {
						if (d.key === "Extreme Weather Delay")
							return "#BBDBD1";
						else if (d.key === "Aviation System Delay")
							return "#00BFB3";
						else {
							return "#7E78D2";
						}
					})
					.style("font-size", "14px")
					.style("font-weight", "700");
			}

			function hoverOff() {
				d3.select(this)
					.attr("fill-opacity", function () {
						return 1;
					});

				vm.d3ToolTip.transition()
					.duration(500)
					.style("opacity", 0);
			}

		};
	}
})();
