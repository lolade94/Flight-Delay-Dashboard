(function(){
	'use strict';

	angular.module('mapInteractive')
		.controller('MapInteractiveController', MapInteractiveController);

	function MapInteractiveController($scope, $timeout, $element) {

		var vm = this,
			svg,
			mapWidth,
			d3ToolTip,
			previousRoutes;
		var defaultOptions = {
				width: 100,
				height: 550,
				widthDivisor: 2.010,
			  heightDivisor: 2.2
			};

		vm.$onInit = function () {
			vm.options = angular.extend({}, defaultOptions, vm.options);


			svg = d3.select($element[0])
        .append('svg')
				.attr("class", "map")
				.attr("width", vm.options.width + "%")
				.attr("height", vm.options.height);
			d3ToolTip = d3.select("body").append("div")
				.attr("class", "tooltip")
				.style("opacity", 0);
			mapWidth = $('.map').width();

			vm.delayMapTitle = "Delayed";
			vm.previousInterval = null;
			vm.path = d3.geoPath()
				.pointRadius(1.2)
				.projection(vm.scale(.72, mapWidth/4, vm.options.height/2));

			//Load data files
			vm.queueFiles();
		};

		vm.queueFiles = function () {
			//load files into sequential order
			d3.queue()
				.defer(d3.json, '../../../src/assets/data/mapDashboardDemo/us.json')
				.defer(d3.json, '../../../src/assets/data/mapDashboardDemo/airports.json')
				.defer(d3.json, '../../../src/assets/data/mapDashboardDemo/delayRoutes.json')
				.await(vm.onDataReady);
		}

		vm.onDataReady = function (err, us, airports, routes) {
			if (err)
				throw err;

			vm.mapData = {
				"us": us,
				"airports": airports,
				"routes": routes,
				"month": "Jan",
				"prevMonth": null,
				"delay": null
			};
			vm.createMap(vm.mapData);
			vm.createSlider(null);
		};

		vm.createSlider = function (delay) {
			//month labels
			var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
				j = 0,
				max = 0,
				textContents = [];

			//Add slider
			var mySlider = slid3r()
				.width(mapWidth - 100)
				.range([1, 12])
				.startPos(1)
				.loc([50, 10]) //margin top and left
				.onDrag(function (pos) {
				})
				.onDone(function (pos) {
					//Define month index
					var i = Math.round(pos);
					i -= 1;
					//store position for routes filter in vm.update
					vm.mapData.month = months[i];
					//callback to send month object to parent cpmponent
					vm.changeMonth({
						month: {
							month: months[i]
						}
					});
					//update map with new data
					vm.update(vm.mapData);
					//apply the month binding to scope so the parent can listen and note changes
					$scope.$apply()
				});

			//create slider
			svg.append('g')
				.attr("class", " slider")
				.call(mySlider);

			changeLabels();

			function changeLabels() {
				var slider = document.querySelector('g.slider');
				var textContents = slider.querySelectorAll("text");
				for (j = 0, max = textContents.length; j < max; j += 1) {
					textContents[j].textContent = months[j];
				}
			}
		}; //vm.createSlider

		vm.createMap = function (data) {
			var us = data.us,
				airports = data.airports;
			var projection = d3.geoAlbers()
				.scale(900)
				.translate([mapWidth / vm.options.widthDivisor, vm.options.height / vm.options.heightDivisor])
				.precision(.1);

			//create land path
			svg.append("path")
				.datum(topojson.feature(us, us.objects.nation))
				.attr("class", "land")
				.attr("d", vm.path)
				.style("fill", "#474747");

			//create paths for states
			svg.append("g")
				.selectAll("path")
				.data(topojson.feature(us, us.objects.states).features)
				.enter()
				.append("path")
				.attr("class", "states")
				.attr("d", vm.path)
				.style("fill", "#474747");

			//mesh states
			svg.append("path")
				.datum(topojson.feature(us, us.objects.states, function (a, b) {
					return a !== b;
				}))
				.attr("class", "state")
				.attr("d", vm.path)
				.attr("fill", "#474747")
				.style("stroke", "#20242A")
				.style("stroke-width", 2);

			//plot the points for airports
			svg.selectAll("circle")
				.data(airports)
				.enter()
				.append("circle")
				.attr("cx", function (airport) {
					return projection([airport.longitude, airport.latitude])[0];
				})
				.attr("cy", function (airport) {
					return projection([airport.longitude, airport.latitude])[1];
				})
				.attr("r", 5)
				.attr("fill", "#848484")
				.attr("fill-opacity", 0.9)
				.on("mouseover", hoverOn)
				.on("mouseleave", hoverOff)

			function hoverOn(d) {
				d3.select(this)
					.attr("fill-opacity", .9);

				d3ToolTip.transition()
					.duration(200)
					.style("opacity", .9);

				d3ToolTip.html("<span id='airport'>" + d.AIRPORT + "</span>" + "<br/>" + d.CITY + ", " + d.STATE)
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY - 28) + "px");

				d3.select("#airport")
					.style("color", "#21897E")
					.style("font-size", "14px")
					.style("font-weight", "700");
			}
			function hoverOff() {
				d3.select(this).attr("fill-opacity", function () {
					return 1;
				});

				d3ToolTip.transition()
					.duration(500)
					.style("opacity", 0);
			}
		};

		vm.scale = function (scaleFactor, width, height) {
			return d3.geoTransform({
				point: function (x, y) {
					this.stream.point((x - width / 2) * scaleFactor + width / 2, (y - height / 2) * scaleFactor + height / 2.);
				}
			});
		}

		vm.$onChanges = function (changeObj) {
			// $onChanges is called BEFORE init the first time
			if (changeObj.delay && !changeObj.delay.isFirstChange()) {
				vm.mapData.delay = changeObj.delay.currentValue.delay;
				vm.mapData.prevDelay = changeObj.delay.previousValue.delay;
				vm.update(vm.mapData);
			}

			if(changeObj.month && !changeObj.month.isFirstChange()){
				vm.mapData.prevMonth = changeObj.month.previousValue.month;
				vm.update(vm.mapData);
			}
		};

		vm.update = function (data) {
			var speed = 0, //interval speed
				i = 0, //counter for setInterval and routes
				month = data.month, //selected month
				prevMonth = data.prevMonth, //previous month
				delay = data.delay, //delay status
				routes = [], //flight routes
				previousRoutes = [];  //previous routes

			var mapprojection = d3.geoAlbers()
	 				.scale(900)
	 				.translate([mapWidth / vm.options.widthDivisor, vm.options.height / vm.options.heightDivisor])
	 				.precision(.1);

			var projection = d3.geoAlbers()
				.scale(900)
				.translate([mapWidth / 2.02, vm.options.height / vm.options.heightDivisor])
				.precision(.1);

			//Find routes by delay type
			routes = data.routes.routes.filter(function (d, i) {
				if (delay === null) {
					return d.properties.month === month;
				} else {
					return d.properties.month === month && d.properties.delayType === delay;
				}
			});

		 //Find previous routes by for month
			previousRoutes = data.routes.routes.filter(function(d, i){
				 return d.properties.month === prevMonth;
			});

      //Remove destination and target data points
      svg.selectAll('.dest').data(routes).remove();
      svg.selectAll('.dest').data(previousRoutes).exit().remove();
		  svg.selectAll('.target').data(routes).remove();
		  svg.selectAll('.target').data(previousRoutes).exit().remove();

     //removes previous animations, update map Title, and adjust speed if delay is All  or not
			if (delay === null && vm.previousInterval) {
						speed = 200;
						vm.delayMapTitle = "Delayed ";
					  clearInterval(vm.previousInterval);
			} else {
				speed = 150;
				vm.delayMapTitle = delay;
				vm.previousRoutes = routes;
				clearInterval(vm.previousInterval);
			};

      //store intervals for flights animations
			vm.previousInterval = setInterval(function () {
				if (i > routes.length - 1) {
					i = 0;
				}
				var route = routes[i];
				createDestination(route, routes);
				fly(route);
				i++;
			}, speed);

			function fly(route) {
				var projection = d3.geoAlbers()
					.scale(900)
					.translate([mapWidth / vm.options.widthDivisor, vm.options.height /vm.options.heightDivisor])
					.precision(.1);

				//define a flight route
				var flight = svg.append("path")
					.datum(route)
					.attr("class", "route")
					.attr("d", vm.path.projection(projection))
					.attr("fill", "none");

				//create plane  for each route
				var plane = svg.append("path")
					.attr("class", "plane")
					.attr("fill", function () {
						//filter plane color by delay type
						if (route.properties.delayType === "Extreme Weather Delay")
							return "#BBDBD1";
						else if (route.properties.delayType === "Air Carrier Delay")
								return "#7E78D2";
						else if (route.properties.delayType === "Aviation System Delay")
							return "#00BFB3";
					})
					.style("display", "none")
					.attr("d", "m25.21488,3.93375c-0.44355,0 -0.84275,0.18332 -1.17933,0.51592c-0.33397,0.33267 -0.61055,0.80884 -0.84275,1.40377c-0.45922,1.18911 -0.74362,2.85964 -0.89755,4.86085c-0.15655,1.99729 -0.18263,4.32223 -0.11741,6.81118c-5.51835,2.26427 -16.7116,6.93857 -17.60916,7.98223c-1.19759,1.38937 -0.81143,2.98095 -0.32874,4.03902l18.39971,-3.74549c0.38616,4.88048 0.94192,9.7138 1.42461,13.50099c-1.80032,0.52703 -5.1609,1.56679 -5.85232,2.21255c-0.95496,0.88711 -0.95496,3.75718 -0.95496,3.75718l7.53,-0.61316c0.17743,1.23545 0.28701,1.95767 0.28701,1.95767l0.01304,0.06557l0.06002,0l0.13829,0l0.0574,0l0.01043,-0.06557c0,0 0.11218,-0.72222 0.28961,-1.95767l7.53164,0.61316c0,0 0,-2.87006 -0.95496,-3.75718c-0.69044,-0.64577 -4.05363,-1.68813 -5.85133,-2.21516c0.48009,-3.77545 1.03061,-8.58921 1.42198,-13.45404l18.18207,3.70115c0.48009,-1.05806 0.86881,-2.64965 -0.32617,-4.03902c-0.88969,-1.03062 -11.81147,-5.60054 -17.39409,-7.89352c0.06524,-2.52287 0.04175,-4.88024 -0.1148,-6.89989l0,-0.00476c-0.15655,-1.99844 -0.44094,-3.6683 -0.90277,-4.8561c-0.22699,-0.59493 -0.50356,-1.07111 -0.83754,-1.40377c-0.33658,-0.3326 -0.73578,-0.51592 -1.18194,-0.51592l0,0l-0.00001,0l0,0z");
				//show plane transition on a route path
				transition(plane, flight);
			}

      function createDestination(route, routes) {
					var target = svg.append("circle")
										.datum(route)
										.attr("class", "dest")
										.attr("cx", function (d) { return mapprojection(d.coordinates[1])[0]; })
										.attr("cy", function (d) { return mapprojection(d.coordinates[1])[1]; })
										.attr("pointer-event", "none")
										.attr("r", "5px")
										.attr("fill", "red")
										.on("mouseover", hoverOn)
										.on("mouseleave", hoverOff);

					var pulse = svg.selectAll('.target-pulse')
					 		    	.data(routes)
					 		    	.enter()
					 		      .append('circle')
										.attr("class", "target")
					 		    	.classed('target-pulse', true)
					 					.attr("cx", function (d) { return mapprojection(d.coordinates[1])[0]; })
					 					.attr("cy", function (d) { return mapprojection(d.coordinates[1])[1]; })
					 		      .attr("r", 15)
					 		    	.attr("stroke", "red")
										.attr("pointer-event", "none")
										.attr("stroke-width", "4px")
										.attr("fill", "red")
										.attr("fill-opacity", ".7");
			}

			function transition(plane, route) {
				var l = route.node().getTotalLength();

				plane.transition()
					.duration(5000)
					.style("display", "block")
					.attrTween("transform", delta(plane, route.node()))
					.on("end", function () {
						return route.remove();
					})
					.remove();
			}

			function delta(plane, path) {
        var length = path.getTotalLength();
				return function (i) {
					return function (time) {
					 var point,
					     time2,
							 point2,
							 rotate,
							 second,
							 x, y;

					  //Define first point multiple transition time to length
						point = path.getPointAtLength(time * length);
						//t2 is end transition time
						time2 = Math.min(time + 0.05, 1);
						//Define second coordinate for rotation.
						point2 = path.getPointAtLength(time2 * length);

            x = point2.x - point.x;
					  y = point2.y - point.y;

						//Rotates the plane
						rotate = 90 - Math.atan2(-y, x) * 180 / Math.PI;
						//Scale the plane
						second = Math.min(Math.sin(Math.PI * time) * 0.7, 0.5);

						return "translate(" + point.x + "," + point.y + ") scale(" + second + ") rotate(" + rotate + ")";
					};
				}
			};

			function hoverOn(d) {
		   var airport = data.airports.filter(function(destination, i){
				   return destination.LONGITUDE ===  d.coordinates[1][0]  && destination.LATITUDE === d.coordinates[1][1];
				});

				d3.select(this)
					.attr("fill-opacity", .9);

				d3ToolTip.transition()
					.duration(200)
					.style("opacity", .9);

				d3ToolTip.html("<span id='airport'>" + airport[0].AIRPORT + "</span>" + "<br/>" + airport[0].CITY + ", " + airport[0].STATE)
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY - 28) + "px");

				d3.select("#airport")
					.style("color", "#21897E")
					.style("font-size", "14px")
					.style("font-weight", "700");
			}

			function hoverOff() {
				d3.select(this).attr("fill-opacity", function () {
					return 1;
				});

				d3ToolTip.transition()
					.duration(500)
					.style("opacity", 0);
			};
		};
	}

})();
