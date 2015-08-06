(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var configurable = require('./util/configurable');
var xAxisFactory = require('./xAxis');
var filterLine = require('./filterLine');

module.exports = function(d3) {
  var eventLine = require('./eventLine')(d3);

  //一些默认的配置
  var defaultConfig = {
    name: 'project manager',
    start: d3.time.day(new Date()),
    end: d3.time.day.offset(d3.time.day(new Date()), 7),
    minScale: 0,
    maxScale: 100,
    margin: {
      top: 45,
      left: 0,
      bottom: 45,
      right: 0
    },
    tickFormat: [
      [".%L", function(d) {
        return d.getMilliseconds();
      }],
      [":%S", function(d) {
        return d.getSeconds();
      }],
      ["%I:%M", function(d) {
        return d.getMinutes();
      }],
      ["%I %p", function(d) {
        return d.getHours();
      }],
      ["%a %d", function(d) {
        return d.getDay() && d.getDate() != 1;
      }],
      ["%b %d", function(d) {
        return d.getDate() != 1;
      }],
      ["%B", function(d) {
        return d.getMonth();
      }],
      ["%Y", function() {
        return true;
      }]
    ],
    width: 1000
  };

  return function app(config) {
    // console.log(config);
    var xScale = d3.time.scale();
    var yScale = d3.scale.ordinal();
    config = config || {};
    for (var key in defaultConfig) {
      config[key] = config[key] || defaultConfig[key];
    }



    function init(selection) {

      selection.each(function(data) {
        var graphHeight = 0;
        var graphWidth = config.width;
        d3.select(this).select('svg').remove();

        var zoom = d3.behavior.zoom().center(null).scaleExtent([config.minScale,
            config.maxScale
          ])
          .on('zoomstart', zoomstart)
          .on("zoom", updateZoom)
          .on("zoomend", function() {
            console.log('zoomend');
            // redraw(false);
          });

        var days = d3.time.days(config.start, config.end);
        xScale.range([0, graphWidth])
          .domain([config.start, config.end])
          .nice(d3.time.day);
        zoom.x(xScale);
        zoom.size([graphWidth, graphHeight]);



        graphHeight = data.length * 40;
        console.log(data.length + '个任务');
        var svg = d3.select(this)
          .append('svg')
          .attr('class', 'app')
          .attr('width', graphWidth)
          .attr('height', graphHeight);


        var graph = svg.append('g')
          .attr('id', 'container-box')
          // .attr('transform', 'translate(0, 25)');

        var yDomain = [];
        var yRange = [];


        data.forEach(function(task, index) {
          yDomain.push(task.name);
          yRange.push(index * 40);
        });

        yScale.domain(yDomain).range(yRange);


        var yAxisEl = graph.append('g')
          .classed('y-axis axis', true)
          .attr('transform', 'translate(0, -1)')
          .attr('opacity', '0.4');

        var yTick = yAxisEl.append('g').selectAll('g').data(yDomain);

        yTick.enter()
          .append('g')
          .attr('transform', function(d) {
            return 'translate(0, ' + (yScale(d) - 1) + ')';
          })
          .append('line')
          .classed('y-tick', true)
          .attr("stroke-dasharray", "10, 10")
          .attr('x1', config.margin.left)
          .attr('x2', config.margin.left + graphWidth);

        yTick.exit().remove();



        function drawZoom() {
          var curx, cury;
          var zoomRect = graph
            .append('rect')
            .call(zoom)
            .classed('zoom', true)
            .attr('width', graphWidth)
            .attr('height', graphHeight)
            // .attr('display', 'none')
            // .attr('transform', 'translate(' + config.margin.left +
            //   ', 35)')
          ;

          // if (typeof config.eventHover === 'function') {
          //   zoomRect.on('mousemove', function(d, e) {
          //     var event = d3.event;
          //     if (curx == event.clientX && cury == event.clientY)
          //       return;
          //     curx = event.clientX;
          //     cury = event.clientY;
          //     zoomRect.attr('display', 'none');
          //     var el = document.elementFromPoint(d3.event.clientX,
          //       d3.event.clientY);
          //     zoomRect.attr('display', 'block');
          //     if (el.tagName !== 'circle') return;
          //     config.eventHover(el);
          //   });
          // }
          //
          // if (typeof config.eventClick === 'function') {
          //   zoomRect.on('click', function() {
          //     zoomRect.attr('display', 'none');
          //     var el = document.elementFromPoint(d3.event.clientX,
          //       d3
          //       .event.clientY);
          //     zoomRect.attr('display', 'block');
          //     if (el.tagName !== 'circle') return;
          //     config.eventClick(el);
          //   });
          // }
          return zoomRect;
        }
        drawZoom();



        graph.select('.graph-body').remove();
        var graphBody = graph
          .append('g')
          .classed('graph-body', true)
          // .attr('transform', 'translate(' + config.margin.left + ', ' +
          //   (config.margin.top - 15) + ')')
        ;

        // var zoom = d3.behavior.zoom().center(null).scaleExtent([config.minScale,
        //   config.maxScale
        // ]).on("zoom", updateZoom);
        var timer = null;

        function zoomstart() {
          config.scale = null;
          config.translate = null;
          if (d3.event.sourceEvent && d3.event.sourceEvent.toString() ===
            '[object WheelEvent]') {
            if (!d3.event.sourceEvent.altKey) {
              config.scale = zoom.scale();
              config.translate = zoom.translate();
            }
          }
        }

        function updateZoom() {
          if (d3.event.sourceEvent && d3
            .event.sourceEvent.toString() ===
            '[object MouseEvent]') {
            zoom.translate([d3.event.translate[0], 0]);
          }

          if (d3.event.sourceEvent && d3.event.sourceEvent.altKey && d3
            .event.sourceEvent.toString() ===
            '[object WheelEvent]') {
            zoom.scale(d3.event.scale);
          }
          if (config.scale && config.translate) {
            zoom.scale(config.scale);
            zoom.translate(config.translate);
            return false;
          }
          if (timer) {
            clearTimeout(timer);
          }
          redraw(false);
          timer = setTimeout(function() {
            redraw(true);
          }, 300);
        }



        // var lines = graphBody.selectAll('g').data(function(d) {
        //   return filterLine(d, yScale, true);
        // });
        //
        // lines.enter()
        //   .append('g')
        //   .classed('line', true)
        //   .attr('transform', function(d) {
        //     return 'translate(0,' + (yScale(d.name)) + ')';
        //   })
        //   .style('fill', config.eventLineColor);
        //
        // lines.exit().remove();

        var lines = null;
        lines = graphBody.selectAll('g').data(data);

        lines.enter()
          .append('g')
          .classed('line', true)
          .attr('transform', function(d) {
            return 'translate(0,' + (yScale(d.name)) + ')';
          })
          .style('fill', config.eventLineColor);

        lines.exit().remove();


        function redraw(fullRedraw) {
          var st = new Date().getTime();

          var xtop = d3.select('#header');
          xtop.select('g').remove();
          var xAxisTop = xAxisFactory(d3, config, xScale, xtop,
            graphHeight, 'top');

          var xbottom = d3.select('#footer');
          xbottom.select('g').remove();
          var xAxisBottom = xAxisFactory(d3, config, xScale, xbottom,
            graphHeight, 'bottom');

          lines.call(eventLine({
            margin: config.margin,
            graphHeight: graphHeight,
            yScale: yScale,
            xScale: xScale,
            fullRedraw: fullRedraw,
            eventColor: config.eventColor
          }));

          var et = new Date().getTime();
          console.log('重画整体' + fullRedraw + '=' + (et - st) + 'ms');
        }
        redraw(false);



      });
      loaded();
    }

    configurable(init, config);
    return init;
  };
};

},{"./eventLine":2,"./filterLine":4,"./util/configurable":7,"./xAxis":8}],2:[function(require,module,exports){
"use strict";
/* global require, module, d3 */

var configurable = require('./util/configurable');
var filterData = require('./filterData');

var defaultConfig = {
  xScale: null
};
var formater = d3.time.format("%Y-%m-%d %H:%M:%S")

module.exports = function(d3) {
  var task = require('./task')(d3);
  return function(config) {
    config = config || {
      xScale: null,
      redraw: true,
      eventColor: null
    };
    for (var key in defaultConfig) {
      config[key] = config[key] || defaultConfig[key];
    }
    // console.log('取高度111f');
    var offset = $('#scroller').offset().top;
    var yMin = 0 - offset;
    var yMax = 0 - offset + $('#wrapper').height() + 80;
    //当前选中的是哪一个任务
    var selectedTask = null;
    //xxx
    var eventLine = function eventLine(selection) {
      // console.log(selection);
      selection.each(function(data) {
        var lineSvg = d3.select(this);
        lineSvg.selectAll('.item').remove();
        var taskBox = lineSvg.selectAll('.item')
          .data(function(d) {
            return filterData(d.tasks, config.xScale, config.yScale,
              yMin, yMax, config.fullRedraw);
          });
        var moveListener = d3.behavior.zoom().center(null);

        //处理提示信息
        var tooltip = d3.helper.tooltip()
          .padding(16, 25)
          .text(function(d) {
            var x = taskBox.attr('x');
            var timeOnScale = config.xScale.invert(x);
            var stat = d.status == 'finish' ? '完结' : '进行中';
            var html = [];
            html.push('<h1>' + d.name + '</h1>');
            html.push('<ul>')
            html.push('<li class="i">开始时间:  ' + formater(d.startDate) +
              '</li>')
            html.push('<li class="i">结束时间:  ' + formater(d.endDate) +
              '</li>')
            html.push('<li class="i">任务状态:  ' + stat + '</li>')
            html.push('<li class="i">进度:  ' + (d.percent || 0) *
              100 +
              '%</li>')
            return html.join('');
          });
        //画菜单


        var leftLine, percentLine, rightLine;
        var redrawMenu = function() {
          var task = taskBox.data()[0];
          if (task == null || window.config.selectId != task.taskName) {
            return;
          }
          console.log('画菜单');

          //目录
          // var container = d3.select('#container-box');
          d3.select('.graph-body').select('.menu').remove();
          var menu = lineSvg.append('g').attr('class', "menu");
          var percentListener = d3.behavior.zoom().center(null);
          var startTimeListener = d3.behavior.zoom().center(null);
          var endTimeListener = d3.behavior.zoom().center(null);

          var x = config.xScale(task.startDate);
          var w = config.xScale(task.endDate) - config.xScale(task.startDate);
          var y1 = 0;
          var y2 = 39;

          menu.attr('transform', 'translate(' + x + ', 0)');
          percentListener.on('zoomstart', function() {
              task._percent = task.percent;
              var xCurr = parseFloat(percentLine.attr('x1'));
              task._xCurr = xCurr;
            }).on("zoom",
              function() {
                if (d3.event.sourceEvent && d3.event.sourceEvent.toString() ===
                  '[object MouseEvent]') {
                  var xScale = config.xScale;
                  var xMin = parseFloat(leftLine.attr('x1')) + 10;
                  var xMax = parseFloat(rightLine.attr('x1')) - 10;
                  var xCurr = task._xCurr;
                  console.log(xCurr + '/' + xMin + '/' + xMax);
                  var xWidth = xMax - xMin;
                  var offset = d3.event.translate[0];
                  xCurr = xCurr + d3.event.translate[0];
                  xCurr = Math.min(xCurr, xMax);
                  xCurr = Math.max(xCurr, xMin);
                  var _percent = (xCurr - xMin) / (xMax - xMin);
                  _percent = Math.round(_percent * 10) / 10
                  xCurr = xMin + (xMax - xMin) * _percent;
                  var x1 = xCurr;
                  task.percent = _percent;
                  percentLine.attr("x1", x1).attr("x2", x1);
                  redrawTask();
                }
              })
            .on("zoomend", function() {
              redrawMenu();
            });

          var steps = 0;
          startTimeListener.on('zoomstart', function() {
              task._startDate = task.startDate;
              task._endDate = task.endDate;
              task._steps = 0;
            }).on("zoom",
              function() {
                if (d3.event.sourceEvent && d3.event.sourceEvent.toString() ===
                  '[object MouseEvent]') {
                  var xScale = config.xScale;
                  var offset = d3.event.translate[0];
                  var maxDate = d3.time.day.offset(task._endDate, -
                    1);
                  offset = Math.min(offset, (xScale(maxDate) -
                    xScale(task._startDate))) - 10;
                  // offset = Math.min(offset, w) - 10;
                  var now = new Date();
                  var dayWidth = xScale(d3.time.day.offset(now, 1)) -
                    xScale(now);
                  steps = Math.round(offset / dayWidth);
                  offset = steps * dayWidth - 10;
                  leftLine.attr("x1", function() {
                    return offset;
                  }).attr("x2", function() {
                    return offset;
                  });
                  task.startDate = d3.time.day.offset(task._startDate,
                    steps);
                  redrawTask();
                  var x1 = percentX();
                  percentLine.attr("x1", x1).attr("x2", x1);
                }
                return false;
              })
            .on("zoomend", function() {
              redrawMenu();
            });

          endTimeListener.on('zoomstart', function() {
              task._startDate = task.startDate;
              task._endDate = task.endDate;
              task._steps = 0;
              var xCurr = parseFloat(rightLine.attr('x1'));
              task._xCurr = xCurr;
            }).on("zoom",
              function() {
                if (d3.event.sourceEvent && d3.event.sourceEvent.toString() ===
                  '[object MouseEvent]') {
                  var xScale = config.xScale;
                  var offset = d3.event.translate[0];
                  var xCurr = task._xCurr + offset;
                  var days = d3.time.days(task._startDate, task._endDate);
                  var now = new Date();
                  var dayWidth = xScale(d3.time.day.offset(now, 1)) -
                    xScale(now);
                  steps = Math.round(offset / dayWidth);
                  steps = Math.max(0 - days.length + 1, steps);
                  xCurr = steps * dayWidth + task._xCurr;
                  rightLine.attr("x1", function() {
                    return xCurr;
                  }).attr("x2", function() {
                    return xCurr;
                  });
                  var x1 = percentX();
                  percentLine.attr("x1", x1).attr("x2", x1);
                  task.endDate = d3.time.day.offset(task._endDate,
                    steps);
                  redrawTask();
                }
                return false;
              })
            .on("zoomend", function() {
              redrawMenu();
            });

          leftLine = menu.append('line')
            .attr('idx', 'left')
            .attr('class', 'left')
            .attr('x1', 0 - 10)
            .attr('y1', y1)
            .attr('x2', 0 - 10)
            .attr('y2', y2)
            .call(startTimeListener);

          rightLine = menu.append('line')
            .attr('idx', 'right')
            .attr('class', 'right')
            .attr('x1', w + 10)
            .attr('y1', y1)
            .attr('x2', w + 10)
            .attr('y2', y2)
            .call(endTimeListener);

          percentLine = menu.append('line')
            .attr('idx', 'percent')
            .attr('class', 'percent')
            .attr('x1', w * task.percent || 0)
            .attr('y1', y1)
            .attr('x2', w * task.percent || 0)
            .attr('y2', y2)
            .call(percentListener);
        }

        var percentX = function() {
          var task = taskBox.data()[0];
          var x = 0;
          var left = parseFloat(leftLine.attr('x1')) + 10;
          var right = parseFloat(rightLine.attr('x1')) - 10;
          x = left + (right - left) * (task.percent || 0);
          console.log('left=' + left + '\t=' + right + '\t' + x);
          return x;
        }

        //click
        var curx, cury;
        var clickHandler = function() {
          console.log('clickHandler');
          var event = d3.event;
          if (curx == event.clientX && cury == event.clientY)
            return;
          curx = event.clientX;
          cury = event.clientY;
          var el = document.elementFromPoint(d3.event.clientX,
            d3.event.clientY);
          var taskBox = d3.select(el).parentNode;
          console.log(taskBox);
          if (taskBox) {
            // redrawMenu();
            var task = taskBox.data()[0];
            window.config.selectId = task.name;
            console.log(task.taskName);
          }
          redrawMenu();
        }

        //画行
        var redrawTask = function() {
          // console.log('重画任务');
          lineSvg.selectAll('.item').remove();
          taskBox.enter()
            .append('g')
            .on('click', clickHandler)
            .call(moveListener)
            .style('fill', config.eventColor)
            .attr('class', "item")
            .attr('transform', function(d) {
              return 'translate(' + config.xScale(d.startDate) +
                ', 9)'
            })
            .attr('height', 20)
            // .attr('width', function(d) {
            //   return (config.xScale(task.endDate) - config.xScale(
            //     d.startDate))
            // })
            .on('mouseover', tooltip.mouseover)
            .on('mouseout', tooltip.mouseout)
            .on('mousemove', tooltip.mousemove)
            .call(task({
              xScale: config.xScale,
              eventColor: config.eventColor
            }));
          taskBox.exit().remove();
        }
        redrawTask();


        //点击任务后显示任务的调整模式
        redrawMenu();
        //--------------------------------------------------------------------

        // 处理任务左右移动的问题
        moveListener.on("zoom",
          function() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.toString() ===
              '[object MouseEvent]') {
              var el = document.elementFromPoint(d3.event.clientX,
                d3.event.clientY);
              var x = 0,
                w = 0;
              /////////////////////
              taskBox.attr('transform', function(d) {
                var xScale = config.xScale;
                w = xScale(d.endDate) - xScale(d.startDate);
                x = xScale(d.startDate) + d3.event.translate[
                  0]; //移动后的距离
                var dateTime = xScale.invert(x); //转换成新的时间
                var date = d3.time.day(dateTime); //对时间进行取整
                x = xScale(date); //时间取整后的距离
                d.startDate = date;
                d.endDate = xScale.invert(x + w);
                return 'translate(' + x + ', 9)';
              });


              // var xScale = config.xScale;
              // var task = taskBox.data()[0];
              // x = xScale(task.startDate) + d3.event.translate[
              //   0]; //移动后的距离
              // var dateTime = xScale.invert(x); //转换成新的时间
              // var date = d3.time.day(dateTime); //对时间进行取整
              // // x = xScale(date); //时间取整后的距离
              // // console.log(x);
              // task.startDate = date;
              // // task.endDate = xScale.invert(x + w);
              redrawMenu();



              /////////////////////

              var box = d3.select('#container-box');
              box.select('.lline').remove();
              var g = box.append('g')
                .attr('opacity', '0.4')
                .attr('class', 'lline')
                .attr('transform', 'translate(' + x + ', 0)');

              g.append('rect')
                .style('fill', "#0cc")
                .attr('opacity', '0.4')
                // .attr('class', "itemx")
                // .attr('transform', 'translate(0, ' + 20 + ')')
                .attr('height', config.graphHeight)
                .attr('width', w)

              g.append('line')
                .attr('x1', 0)
                .attr('y1', config.margin.top - 40)
                .attr('x2', 0)
                .attr('y2', config.graphHeight + 40);

              g.append('line')
                .attr('x1', w)
                .attr('y1', config.margin.top - 40)
                .attr('x2', w)
                .attr('y2', config.graphHeight + 40);
            }
            return false;
          }).on("zoomend", function() {
          var box = d3.select('#container-box');
          box.select('.lline').remove();
        });
      });
    };

    configurable(eventLine, config);

    return eventLine;
  };
};

},{"./filterData":3,"./task":6,"./util/configurable":7}],3:[function(require,module,exports){
"use strict";
/* global module */

module.exports = function filterDate(data, xScale, yScale, yMin, yMax,
  fullRedraw) {
  data = data || [];
  var filteredData = [];
  var boundary = xScale.range();
  var min = boundary[0];
  var max = boundary[1];
  data.forEach(function(datum) {
    var start = xScale(datum.startDate);
    var end = xScale(datum.endDate);
    var y = yScale(datum.name);
    if (end < min || start > max) {
      return;
    }
    if (!fullRedraw && (y < yMin || y > yMax)) {
      return;
    }
    filteredData.push(datum);
  });
  return filteredData;
};

},{}],4:[function(require,module,exports){
"use strict";
/* global module */

module.exports = function filterDate(data, scale, lite) {
  data = data || [];
  var filteredData = [];
  var offset = $('#scroller').offset().top;
  var yMin = 0 - offset;
  var yMax = 0 - offset + $('#wrapper').height();
  var count = 0;
  data.forEach(function(d) {
    // if (lite) {
    //   var name = d.name;
    //   var y = scale(name);
    //   console.log([y, yMin, yMax].join(','))
    //   var _d = $.extend(true, {}, d);
    //   if (y < yMin || y > yMax) {
    //     _d.tasks.length = 0;
    //   } else {
    //     count++;
    //   }
    //   filteredData.push(_d);
    // } else {
    filteredData.push(d);
    // }
  });
  console.log('count===' + count);

  return filteredData;
};

},{}],5:[function(require,module,exports){
"use strict";

var app = require('./app');

if (typeof define === "function" && define.amd) {
  define('d3.chart.app', ["d3"], function(d3) {
    d3.chart = d3.chart || {};
    d3.chart.app = app(d3);
  });
} else if (window) {
  window.d3.chart = window.d3.chart || {};
  window.d3.chart.app = app(window.d3);
} else {
  module.exports = app;
}

},{"./app":1}],6:[function(require,module,exports){
"use strict";
/* global require, module, d3 */

var configurable = require('./util/configurable');
var filterData = require('./filterData');

var defaultConfig = {
  xScale: null
};

var formater = d3.time.format("%Y-%m-%d %H:%M:%S")

module.exports = function(d3) {
  return function(config) {

    config = config || {
      xScale: null,
      yScale: null
    };
    for (var key in defaultConfig) {
      config[key] = config[key] || defaultConfig[key];
    }
    var xScale = config.xScale;
    var task = function task(selection) {
      selection.each(function(data) {
        // console.log('画任务');
        // 矩形显示方案
        var container = d3.select(this);
        container.selectAll('.task').remove();

        var show = function() {
          var fillColor = "#0cc";
          if (data.endDate < new Date()) {
            fillColor = 'red';
          }
          var background = container.append('rect')
            .style('fill', fillColor)
            .attr('class', "task background")
            .attr('height', 20)
            .attr('width', function() {
              // console.log(data.endDate + '\t' + data.startDate +
              //   '\t' + (xScale(data.endDate) - xScale(data.startDate))
              // );
              return (xScale(data.endDate) - xScale(data.startDate))
            });
          var pre = container.append('rect')
            .style('fill', "#0ac")
            .attr('class', "task pre")
            .attr('height', 20)
            .attr('width', function() {
              return (config.xScale(data.endDate) - config.xScale(
                data.startDate)) * data.percent || 0;
            });
        };
        show();
      });
    };

    configurable(task, config);

    return task;
  };
};

},{"./filterData":3,"./util/configurable":7}],7:[function(require,module,exports){
module.exports = function configurable(targetFunction, config, listeners) {
  listeners = listeners || {};
  for (var item in config) {
    (function(item) {
      targetFunction[item] = function(value) {
        if (!arguments.length) return config[item];
        config[item] = value;
        if (listeners.hasOwnProperty(item)) {
          listeners[item](value);
        }
        return targetFunction;
      };
    })(item); // for doesn't create a closure, forcing it
  }
};

},{}],8:[function(require,module,exports){
module.exports = function(d3, config, xScale, graph, graphHeight, where) {
  var xAxis = {};
  var xAxisEls = {};

  var tickFormatData = [];

  config.tickFormat.forEach(function(item) {
    var tick = item.slice(0);
    tickFormatData.push(tick);
  });

  var tickFormat = config.locale ? config.locale.timeFormat.multi(
    tickFormatData) : d3.time.format.multi(tickFormatData);
  xAxis[where] = d3.svg.axis()
    .scale(xScale)
    .orient(where)
    .tickSize(6)
    .tickPadding(10)
    .tickFormat(tickFormat);

  if (typeof config.axisFormat === 'function') {
    config.axisFormat(xAxis);
  }

  var y = (where == 'bottom') ? 0 : config.margin.top - 1;


  xAxisEls[where] = graph
    .append('g')
    .classed('x-axis axis', true)
    .classed(where, true)
    .attr('transform', 'translate(' + config.margin.left + ', ' + y + ')')
    .call(xAxis[where]);

  var drawXAxis = function drawXAxis() {
    xAxisEls[where]
      .call(xAxis[where]);
  };

  return {
    drawXAxis: drawXAxis
  };
};

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvYXBwLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2V2ZW50TGluZS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9maWx0ZXJEYXRhLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2ZpbHRlckxpbmUuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvbWFpbi5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy90YXNrLmpzIiwicHVibGljL2phdmFzY3JpcHRzL3V0aWwvY29uZmlndXJhYmxlLmpzIiwicHVibGljL2phdmFzY3JpcHRzL3hBeGlzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBjb25maWd1cmFibGUgPSByZXF1aXJlKCcuL3V0aWwvY29uZmlndXJhYmxlJyk7XG52YXIgeEF4aXNGYWN0b3J5ID0gcmVxdWlyZSgnLi94QXhpcycpO1xudmFyIGZpbHRlckxpbmUgPSByZXF1aXJlKCcuL2ZpbHRlckxpbmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkMykge1xuICB2YXIgZXZlbnRMaW5lID0gcmVxdWlyZSgnLi9ldmVudExpbmUnKShkMyk7XG5cbiAgLy/kuIDkupvpu5jorqTnmoTphY3nva5cbiAgdmFyIGRlZmF1bHRDb25maWcgPSB7XG4gICAgbmFtZTogJ3Byb2plY3QgbWFuYWdlcicsXG4gICAgc3RhcnQ6IGQzLnRpbWUuZGF5KG5ldyBEYXRlKCkpLFxuICAgIGVuZDogZDMudGltZS5kYXkub2Zmc2V0KGQzLnRpbWUuZGF5KG5ldyBEYXRlKCkpLCA3KSxcbiAgICBtaW5TY2FsZTogMCxcbiAgICBtYXhTY2FsZTogMTAwLFxuICAgIG1hcmdpbjoge1xuICAgICAgdG9wOiA0NSxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICBib3R0b206IDQ1LFxuICAgICAgcmlnaHQ6IDBcbiAgICB9LFxuICAgIHRpY2tGb3JtYXQ6IFtcbiAgICAgIFtcIi4lTFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLmdldE1pbGxpc2Vjb25kcygpO1xuICAgICAgfV0sXG4gICAgICBbXCI6JVNcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXRTZWNvbmRzKCk7XG4gICAgICB9XSxcbiAgICAgIFtcIiVJOiVNXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuZ2V0TWludXRlcygpO1xuICAgICAgfV0sXG4gICAgICBbXCIlSSAlcFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLmdldEhvdXJzKCk7XG4gICAgICB9XSxcbiAgICAgIFtcIiVhICVkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuZ2V0RGF5KCkgJiYgZC5nZXREYXRlKCkgIT0gMTtcbiAgICAgIH1dLFxuICAgICAgW1wiJWIgJWRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXREYXRlKCkgIT0gMTtcbiAgICAgIH1dLFxuICAgICAgW1wiJUJcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXRNb250aCgpO1xuICAgICAgfV0sXG4gICAgICBbXCIlWVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XVxuICAgIF0sXG4gICAgd2lkdGg6IDEwMDBcbiAgfTtcblxuICByZXR1cm4gZnVuY3Rpb24gYXBwKGNvbmZpZykge1xuICAgIC8vIGNvbnNvbGUubG9nKGNvbmZpZyk7XG4gICAgdmFyIHhTY2FsZSA9IGQzLnRpbWUuc2NhbGUoKTtcbiAgICB2YXIgeVNjYWxlID0gZDMuc2NhbGUub3JkaW5hbCgpO1xuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdENvbmZpZykge1xuICAgICAgY29uZmlnW2tleV0gPSBjb25maWdba2V5XSB8fCBkZWZhdWx0Q29uZmlnW2tleV07XG4gICAgfVxuXG5cblxuICAgIGZ1bmN0aW9uIGluaXQoc2VsZWN0aW9uKSB7XG5cbiAgICAgIHNlbGVjdGlvbi5lYWNoKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGdyYXBoSGVpZ2h0ID0gMDtcbiAgICAgICAgdmFyIGdyYXBoV2lkdGggPSBjb25maWcud2lkdGg7XG4gICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zZWxlY3QoJ3N2ZycpLnJlbW92ZSgpO1xuXG4gICAgICAgIHZhciB6b29tID0gZDMuYmVoYXZpb3Iuem9vbSgpLmNlbnRlcihudWxsKS5zY2FsZUV4dGVudChbY29uZmlnLm1pblNjYWxlLFxuICAgICAgICAgICAgY29uZmlnLm1heFNjYWxlXG4gICAgICAgICAgXSlcbiAgICAgICAgICAub24oJ3pvb21zdGFydCcsIHpvb21zdGFydClcbiAgICAgICAgICAub24oXCJ6b29tXCIsIHVwZGF0ZVpvb20pXG4gICAgICAgICAgLm9uKFwiem9vbWVuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd6b29tZW5kJyk7XG4gICAgICAgICAgICAvLyByZWRyYXcoZmFsc2UpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBkYXlzID0gZDMudGltZS5kYXlzKGNvbmZpZy5zdGFydCwgY29uZmlnLmVuZCk7XG4gICAgICAgIHhTY2FsZS5yYW5nZShbMCwgZ3JhcGhXaWR0aF0pXG4gICAgICAgICAgLmRvbWFpbihbY29uZmlnLnN0YXJ0LCBjb25maWcuZW5kXSlcbiAgICAgICAgICAubmljZShkMy50aW1lLmRheSk7XG4gICAgICAgIHpvb20ueCh4U2NhbGUpO1xuICAgICAgICB6b29tLnNpemUoW2dyYXBoV2lkdGgsIGdyYXBoSGVpZ2h0XSk7XG5cblxuXG4gICAgICAgIGdyYXBoSGVpZ2h0ID0gZGF0YS5sZW5ndGggKiA0MDtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YS5sZW5ndGggKyAn5Liq5Lu75YqhJyk7XG4gICAgICAgIHZhciBzdmcgPSBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuYXBwZW5kKCdzdmcnKVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdhcHAnKVxuICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGdyYXBoV2lkdGgpXG4gICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGdyYXBoSGVpZ2h0KTtcblxuXG4gICAgICAgIHZhciBncmFwaCA9IHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5hdHRyKCdpZCcsICdjb250YWluZXItYm94JylcbiAgICAgICAgICAvLyAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCAyNSknKTtcblxuICAgICAgICB2YXIgeURvbWFpbiA9IFtdO1xuICAgICAgICB2YXIgeVJhbmdlID0gW107XG5cblxuICAgICAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24odGFzaywgaW5kZXgpIHtcbiAgICAgICAgICB5RG9tYWluLnB1c2godGFzay5uYW1lKTtcbiAgICAgICAgICB5UmFuZ2UucHVzaChpbmRleCAqIDQwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgeVNjYWxlLmRvbWFpbih5RG9tYWluKS5yYW5nZSh5UmFuZ2UpO1xuXG5cbiAgICAgICAgdmFyIHlBeGlzRWwgPSBncmFwaC5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5jbGFzc2VkKCd5LWF4aXMgYXhpcycsIHRydWUpXG4gICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwgLTEpJylcbiAgICAgICAgICAuYXR0cignb3BhY2l0eScsICcwLjQnKTtcblxuICAgICAgICB2YXIgeVRpY2sgPSB5QXhpc0VsLmFwcGVuZCgnZycpLnNlbGVjdEFsbCgnZycpLmRhdGEoeURvbWFpbik7XG5cbiAgICAgICAgeVRpY2suZW50ZXIoKVxuICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgwLCAnICsgKHlTY2FsZShkKSAtIDEpICsgJyknO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgLmNsYXNzZWQoJ3ktdGljaycsIHRydWUpXG4gICAgICAgICAgLmF0dHIoXCJzdHJva2UtZGFzaGFycmF5XCIsIFwiMTAsIDEwXCIpXG4gICAgICAgICAgLmF0dHIoJ3gxJywgY29uZmlnLm1hcmdpbi5sZWZ0KVxuICAgICAgICAgIC5hdHRyKCd4MicsIGNvbmZpZy5tYXJnaW4ubGVmdCArIGdyYXBoV2lkdGgpO1xuXG4gICAgICAgIHlUaWNrLmV4aXQoKS5yZW1vdmUoKTtcblxuXG5cbiAgICAgICAgZnVuY3Rpb24gZHJhd1pvb20oKSB7XG4gICAgICAgICAgdmFyIGN1cngsIGN1cnk7XG4gICAgICAgICAgdmFyIHpvb21SZWN0ID0gZ3JhcGhcbiAgICAgICAgICAgIC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLmNhbGwoem9vbSlcbiAgICAgICAgICAgIC5jbGFzc2VkKCd6b29tJywgdHJ1ZSlcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGdyYXBoV2lkdGgpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgZ3JhcGhIZWlnaHQpXG4gICAgICAgICAgICAvLyAuYXR0cignZGlzcGxheScsICdub25lJylcbiAgICAgICAgICAgIC8vIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBjb25maWcubWFyZ2luLmxlZnQgK1xuICAgICAgICAgICAgLy8gICAnLCAzNSknKVxuICAgICAgICAgIDtcblxuICAgICAgICAgIC8vIGlmICh0eXBlb2YgY29uZmlnLmV2ZW50SG92ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAvLyAgIHpvb21SZWN0Lm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbihkLCBlKSB7XG4gICAgICAgICAgLy8gICAgIHZhciBldmVudCA9IGQzLmV2ZW50O1xuICAgICAgICAgIC8vICAgICBpZiAoY3VyeCA9PSBldmVudC5jbGllbnRYICYmIGN1cnkgPT0gZXZlbnQuY2xpZW50WSlcbiAgICAgICAgICAvLyAgICAgICByZXR1cm47XG4gICAgICAgICAgLy8gICAgIGN1cnggPSBldmVudC5jbGllbnRYO1xuICAgICAgICAgIC8vICAgICBjdXJ5ID0gZXZlbnQuY2xpZW50WTtcbiAgICAgICAgICAvLyAgICAgem9vbVJlY3QuYXR0cignZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgLy8gICAgIHZhciBlbCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZDMuZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAvLyAgICAgICBkMy5ldmVudC5jbGllbnRZKTtcbiAgICAgICAgICAvLyAgICAgem9vbVJlY3QuYXR0cignZGlzcGxheScsICdibG9jaycpO1xuICAgICAgICAgIC8vICAgICBpZiAoZWwudGFnTmFtZSAhPT0gJ2NpcmNsZScpIHJldHVybjtcbiAgICAgICAgICAvLyAgICAgY29uZmlnLmV2ZW50SG92ZXIoZWwpO1xuICAgICAgICAgIC8vICAgfSk7XG4gICAgICAgICAgLy8gfVxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gaWYgKHR5cGVvZiBjb25maWcuZXZlbnRDbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIC8vICAgem9vbVJlY3Qub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gICAgIHpvb21SZWN0LmF0dHIoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICAgIC8vICAgICB2YXIgZWwgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGQzLmV2ZW50LmNsaWVudFgsXG4gICAgICAgICAgLy8gICAgICAgZDNcbiAgICAgICAgICAvLyAgICAgICAuZXZlbnQuY2xpZW50WSk7XG4gICAgICAgICAgLy8gICAgIHpvb21SZWN0LmF0dHIoJ2Rpc3BsYXknLCAnYmxvY2snKTtcbiAgICAgICAgICAvLyAgICAgaWYgKGVsLnRhZ05hbWUgIT09ICdjaXJjbGUnKSByZXR1cm47XG4gICAgICAgICAgLy8gICAgIGNvbmZpZy5ldmVudENsaWNrKGVsKTtcbiAgICAgICAgICAvLyAgIH0pO1xuICAgICAgICAgIC8vIH1cbiAgICAgICAgICByZXR1cm4gem9vbVJlY3Q7XG4gICAgICAgIH1cbiAgICAgICAgZHJhd1pvb20oKTtcblxuXG5cbiAgICAgICAgZ3JhcGguc2VsZWN0KCcuZ3JhcGgtYm9keScpLnJlbW92ZSgpO1xuICAgICAgICB2YXIgZ3JhcGhCb2R5ID0gZ3JhcGhcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAuY2xhc3NlZCgnZ3JhcGgtYm9keScsIHRydWUpXG4gICAgICAgICAgLy8gLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIGNvbmZpZy5tYXJnaW4ubGVmdCArICcsICcgK1xuICAgICAgICAgIC8vICAgKGNvbmZpZy5tYXJnaW4udG9wIC0gMTUpICsgJyknKVxuICAgICAgICA7XG5cbiAgICAgICAgLy8gdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpLnNjYWxlRXh0ZW50KFtjb25maWcubWluU2NhbGUsXG4gICAgICAgIC8vICAgY29uZmlnLm1heFNjYWxlXG4gICAgICAgIC8vIF0pLm9uKFwiem9vbVwiLCB1cGRhdGVab29tKTtcbiAgICAgICAgdmFyIHRpbWVyID0gbnVsbDtcblxuICAgICAgICBmdW5jdGlvbiB6b29tc3RhcnQoKSB7XG4gICAgICAgICAgY29uZmlnLnNjYWxlID0gbnVsbDtcbiAgICAgICAgICBjb25maWcudHJhbnNsYXRlID0gbnVsbDtcbiAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICdbb2JqZWN0IFdoZWVsRXZlbnRdJykge1xuICAgICAgICAgICAgaWYgKCFkMy5ldmVudC5zb3VyY2VFdmVudC5hbHRLZXkpIHtcbiAgICAgICAgICAgICAgY29uZmlnLnNjYWxlID0gem9vbS5zY2FsZSgpO1xuICAgICAgICAgICAgICBjb25maWcudHJhbnNsYXRlID0gem9vbS50cmFuc2xhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVab29tKCkge1xuICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkM1xuICAgICAgICAgICAgLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09XG4gICAgICAgICAgICAnW29iamVjdCBNb3VzZUV2ZW50XScpIHtcbiAgICAgICAgICAgIHpvb20udHJhbnNsYXRlKFtkMy5ldmVudC50cmFuc2xhdGVbMF0sIDBdKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQuYWx0S2V5ICYmIGQzXG4gICAgICAgICAgICAuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICdbb2JqZWN0IFdoZWVsRXZlbnRdJykge1xuICAgICAgICAgICAgem9vbS5zY2FsZShkMy5ldmVudC5zY2FsZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjb25maWcuc2NhbGUgJiYgY29uZmlnLnRyYW5zbGF0ZSkge1xuICAgICAgICAgICAgem9vbS5zY2FsZShjb25maWcuc2NhbGUpO1xuICAgICAgICAgICAgem9vbS50cmFuc2xhdGUoY29uZmlnLnRyYW5zbGF0ZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aW1lcikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVkcmF3KGZhbHNlKTtcbiAgICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWRyYXcodHJ1ZSk7XG4gICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgfVxuXG5cblxuICAgICAgICAvLyB2YXIgbGluZXMgPSBncmFwaEJvZHkuc2VsZWN0QWxsKCdnJykuZGF0YShmdW5jdGlvbihkKSB7XG4gICAgICAgIC8vICAgcmV0dXJuIGZpbHRlckxpbmUoZCwgeVNjYWxlLCB0cnVlKTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGxpbmVzLmVudGVyKClcbiAgICAgICAgLy8gICAuYXBwZW5kKCdnJylcbiAgICAgICAgLy8gICAuY2xhc3NlZCgnbGluZScsIHRydWUpXG4gICAgICAgIC8vICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgLy8gICAgIHJldHVybiAndHJhbnNsYXRlKDAsJyArICh5U2NhbGUoZC5uYW1lKSkgKyAnKSc7XG4gICAgICAgIC8vICAgfSlcbiAgICAgICAgLy8gICAuc3R5bGUoJ2ZpbGwnLCBjb25maWcuZXZlbnRMaW5lQ29sb3IpO1xuICAgICAgICAvL1xuICAgICAgICAvLyBsaW5lcy5leGl0KCkucmVtb3ZlKCk7XG5cbiAgICAgICAgdmFyIGxpbmVzID0gbnVsbDtcbiAgICAgICAgbGluZXMgPSBncmFwaEJvZHkuc2VsZWN0QWxsKCdnJykuZGF0YShkYXRhKTtcblxuICAgICAgICBsaW5lcy5lbnRlcigpXG4gICAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmNsYXNzZWQoJ2xpbmUnLCB0cnVlKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgwLCcgKyAoeVNjYWxlKGQubmFtZSkpICsgJyknO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLnN0eWxlKCdmaWxsJywgY29uZmlnLmV2ZW50TGluZUNvbG9yKTtcblxuICAgICAgICBsaW5lcy5leGl0KCkucmVtb3ZlKCk7XG5cblxuICAgICAgICBmdW5jdGlvbiByZWRyYXcoZnVsbFJlZHJhdykge1xuICAgICAgICAgIHZhciBzdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgICAgICAgdmFyIHh0b3AgPSBkMy5zZWxlY3QoJyNoZWFkZXInKTtcbiAgICAgICAgICB4dG9wLnNlbGVjdCgnZycpLnJlbW92ZSgpO1xuICAgICAgICAgIHZhciB4QXhpc1RvcCA9IHhBeGlzRmFjdG9yeShkMywgY29uZmlnLCB4U2NhbGUsIHh0b3AsXG4gICAgICAgICAgICBncmFwaEhlaWdodCwgJ3RvcCcpO1xuXG4gICAgICAgICAgdmFyIHhib3R0b20gPSBkMy5zZWxlY3QoJyNmb290ZXInKTtcbiAgICAgICAgICB4Ym90dG9tLnNlbGVjdCgnZycpLnJlbW92ZSgpO1xuICAgICAgICAgIHZhciB4QXhpc0JvdHRvbSA9IHhBeGlzRmFjdG9yeShkMywgY29uZmlnLCB4U2NhbGUsIHhib3R0b20sXG4gICAgICAgICAgICBncmFwaEhlaWdodCwgJ2JvdHRvbScpO1xuXG4gICAgICAgICAgbGluZXMuY2FsbChldmVudExpbmUoe1xuICAgICAgICAgICAgbWFyZ2luOiBjb25maWcubWFyZ2luLFxuICAgICAgICAgICAgZ3JhcGhIZWlnaHQ6IGdyYXBoSGVpZ2h0LFxuICAgICAgICAgICAgeVNjYWxlOiB5U2NhbGUsXG4gICAgICAgICAgICB4U2NhbGU6IHhTY2FsZSxcbiAgICAgICAgICAgIGZ1bGxSZWRyYXc6IGZ1bGxSZWRyYXcsXG4gICAgICAgICAgICBldmVudENvbG9yOiBjb25maWcuZXZlbnRDb2xvclxuICAgICAgICAgIH0pKTtcblxuICAgICAgICAgIHZhciBldCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKCfph43nlLvmlbTkvZMnICsgZnVsbFJlZHJhdyArICc9JyArIChldCAtIHN0KSArICdtcycpO1xuICAgICAgICB9XG4gICAgICAgIHJlZHJhdyhmYWxzZSk7XG5cblxuXG4gICAgICB9KTtcbiAgICAgIGxvYWRlZCgpO1xuICAgIH1cblxuICAgIGNvbmZpZ3VyYWJsZShpbml0LCBjb25maWcpO1xuICAgIHJldHVybiBpbml0O1xuICB9O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIHJlcXVpcmUsIG1vZHVsZSwgZDMgKi9cblxudmFyIGNvbmZpZ3VyYWJsZSA9IHJlcXVpcmUoJy4vdXRpbC9jb25maWd1cmFibGUnKTtcbnZhciBmaWx0ZXJEYXRhID0gcmVxdWlyZSgnLi9maWx0ZXJEYXRhJyk7XG5cbnZhciBkZWZhdWx0Q29uZmlnID0ge1xuICB4U2NhbGU6IG51bGxcbn07XG52YXIgZm9ybWF0ZXIgPSBkMy50aW1lLmZvcm1hdChcIiVZLSVtLSVkICVIOiVNOiVTXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZDMpIHtcbiAgdmFyIHRhc2sgPSByZXF1aXJlKCcuL3Rhc2snKShkMyk7XG4gIHJldHVybiBmdW5jdGlvbihjb25maWcpIHtcbiAgICBjb25maWcgPSBjb25maWcgfHwge1xuICAgICAgeFNjYWxlOiBudWxsLFxuICAgICAgcmVkcmF3OiB0cnVlLFxuICAgICAgZXZlbnRDb2xvcjogbnVsbFxuICAgIH07XG4gICAgZm9yICh2YXIga2V5IGluIGRlZmF1bHRDb25maWcpIHtcbiAgICAgIGNvbmZpZ1trZXldID0gY29uZmlnW2tleV0gfHwgZGVmYXVsdENvbmZpZ1trZXldO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZygn5Y+W6auY5bqmMTExZicpO1xuICAgIHZhciBvZmZzZXQgPSAkKCcjc2Nyb2xsZXInKS5vZmZzZXQoKS50b3A7XG4gICAgdmFyIHlNaW4gPSAwIC0gb2Zmc2V0O1xuICAgIHZhciB5TWF4ID0gMCAtIG9mZnNldCArICQoJyN3cmFwcGVyJykuaGVpZ2h0KCkgKyA4MDtcbiAgICAvL+W9k+WJjemAieS4reeahOaYr+WTquS4gOS4quS7u+WKoVxuICAgIHZhciBzZWxlY3RlZFRhc2sgPSBudWxsO1xuICAgIC8veHh4XG4gICAgdmFyIGV2ZW50TGluZSA9IGZ1bmN0aW9uIGV2ZW50TGluZShzZWxlY3Rpb24pIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHNlbGVjdGlvbik7XG4gICAgICBzZWxlY3Rpb24uZWFjaChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBsaW5lU3ZnID0gZDMuc2VsZWN0KHRoaXMpO1xuICAgICAgICBsaW5lU3ZnLnNlbGVjdEFsbCgnLml0ZW0nKS5yZW1vdmUoKTtcbiAgICAgICAgdmFyIHRhc2tCb3ggPSBsaW5lU3ZnLnNlbGVjdEFsbCgnLml0ZW0nKVxuICAgICAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJEYXRhKGQudGFza3MsIGNvbmZpZy54U2NhbGUsIGNvbmZpZy55U2NhbGUsXG4gICAgICAgICAgICAgIHlNaW4sIHlNYXgsIGNvbmZpZy5mdWxsUmVkcmF3KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgdmFyIG1vdmVMaXN0ZW5lciA9IGQzLmJlaGF2aW9yLnpvb20oKS5jZW50ZXIobnVsbCk7XG5cbiAgICAgICAgLy/lpITnkIbmj5DnpLrkv6Hmga9cbiAgICAgICAgdmFyIHRvb2x0aXAgPSBkMy5oZWxwZXIudG9vbHRpcCgpXG4gICAgICAgICAgLnBhZGRpbmcoMTYsIDI1KVxuICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHZhciB4ID0gdGFza0JveC5hdHRyKCd4Jyk7XG4gICAgICAgICAgICB2YXIgdGltZU9uU2NhbGUgPSBjb25maWcueFNjYWxlLmludmVydCh4KTtcbiAgICAgICAgICAgIHZhciBzdGF0ID0gZC5zdGF0dXMgPT0gJ2ZpbmlzaCcgPyAn5a6M57uTJyA6ICfov5vooYzkuK0nO1xuICAgICAgICAgICAgdmFyIGh0bWwgPSBbXTtcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPGgxPicgKyBkLm5hbWUgKyAnPC9oMT4nKTtcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPHVsPicpXG4gICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cImlcIj7lvIDlp4vml7bpl7Q6ICAnICsgZm9ybWF0ZXIoZC5zdGFydERhdGUpICtcbiAgICAgICAgICAgICAgJzwvbGk+JylcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPGxpIGNsYXNzPVwiaVwiPue7k+adn+aXtumXtDogICcgKyBmb3JtYXRlcihkLmVuZERhdGUpICtcbiAgICAgICAgICAgICAgJzwvbGk+JylcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPGxpIGNsYXNzPVwiaVwiPuS7u+WKoeeKtuaAgTogICcgKyBzdGF0ICsgJzwvbGk+JylcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPGxpIGNsYXNzPVwiaVwiPui/m+W6pjogICcgKyAoZC5wZXJjZW50IHx8IDApICpcbiAgICAgICAgICAgICAgMTAwICtcbiAgICAgICAgICAgICAgJyU8L2xpPicpXG4gICAgICAgICAgICByZXR1cm4gaHRtbC5qb2luKCcnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgLy/nlLvoj5zljZVcblxuXG4gICAgICAgIHZhciBsZWZ0TGluZSwgcGVyY2VudExpbmUsIHJpZ2h0TGluZTtcbiAgICAgICAgdmFyIHJlZHJhd01lbnUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgdGFzayA9IHRhc2tCb3guZGF0YSgpWzBdO1xuICAgICAgICAgIGlmICh0YXNrID09IG51bGwgfHwgd2luZG93LmNvbmZpZy5zZWxlY3RJZCAhPSB0YXNrLnRhc2tOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnNvbGUubG9nKCfnlLvoj5zljZUnKTtcblxuICAgICAgICAgIC8v55uu5b2VXG4gICAgICAgICAgLy8gdmFyIGNvbnRhaW5lciA9IGQzLnNlbGVjdCgnI2NvbnRhaW5lci1ib3gnKTtcbiAgICAgICAgICBkMy5zZWxlY3QoJy5ncmFwaC1ib2R5Jykuc2VsZWN0KCcubWVudScpLnJlbW92ZSgpO1xuICAgICAgICAgIHZhciBtZW51ID0gbGluZVN2Zy5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsIFwibWVudVwiKTtcbiAgICAgICAgICB2YXIgcGVyY2VudExpc3RlbmVyID0gZDMuYmVoYXZpb3Iuem9vbSgpLmNlbnRlcihudWxsKTtcbiAgICAgICAgICB2YXIgc3RhcnRUaW1lTGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpO1xuICAgICAgICAgIHZhciBlbmRUaW1lTGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpO1xuXG4gICAgICAgICAgdmFyIHggPSBjb25maWcueFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgICB2YXIgdyA9IGNvbmZpZy54U2NhbGUodGFzay5lbmREYXRlKSAtIGNvbmZpZy54U2NhbGUodGFzay5zdGFydERhdGUpO1xuICAgICAgICAgIHZhciB5MSA9IDA7XG4gICAgICAgICAgdmFyIHkyID0gMzk7XG5cbiAgICAgICAgICBtZW51LmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHggKyAnLCAwKScpO1xuICAgICAgICAgIHBlcmNlbnRMaXN0ZW5lci5vbignem9vbXN0YXJ0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHRhc2suX3BlcmNlbnQgPSB0YXNrLnBlcmNlbnQ7XG4gICAgICAgICAgICAgIHZhciB4Q3VyciA9IHBhcnNlRmxvYXQocGVyY2VudExpbmUuYXR0cigneDEnKSk7XG4gICAgICAgICAgICAgIHRhc2suX3hDdXJyID0geEN1cnI7XG4gICAgICAgICAgICB9KS5vbihcInpvb21cIixcbiAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09XG4gICAgICAgICAgICAgICAgICAnW29iamVjdCBNb3VzZUV2ZW50XScpIHtcbiAgICAgICAgICAgICAgICAgIHZhciB4U2NhbGUgPSBjb25maWcueFNjYWxlO1xuICAgICAgICAgICAgICAgICAgdmFyIHhNaW4gPSBwYXJzZUZsb2F0KGxlZnRMaW5lLmF0dHIoJ3gxJykpICsgMTA7XG4gICAgICAgICAgICAgICAgICB2YXIgeE1heCA9IHBhcnNlRmxvYXQocmlnaHRMaW5lLmF0dHIoJ3gxJykpIC0gMTA7XG4gICAgICAgICAgICAgICAgICB2YXIgeEN1cnIgPSB0YXNrLl94Q3VycjtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHhDdXJyICsgJy8nICsgeE1pbiArICcvJyArIHhNYXgpO1xuICAgICAgICAgICAgICAgICAgdmFyIHhXaWR0aCA9IHhNYXggLSB4TWluO1xuICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IGQzLmV2ZW50LnRyYW5zbGF0ZVswXTtcbiAgICAgICAgICAgICAgICAgIHhDdXJyID0geEN1cnIgKyBkMy5ldmVudC50cmFuc2xhdGVbMF07XG4gICAgICAgICAgICAgICAgICB4Q3VyciA9IE1hdGgubWluKHhDdXJyLCB4TWF4KTtcbiAgICAgICAgICAgICAgICAgIHhDdXJyID0gTWF0aC5tYXgoeEN1cnIsIHhNaW4pO1xuICAgICAgICAgICAgICAgICAgdmFyIF9wZXJjZW50ID0gKHhDdXJyIC0geE1pbikgLyAoeE1heCAtIHhNaW4pO1xuICAgICAgICAgICAgICAgICAgX3BlcmNlbnQgPSBNYXRoLnJvdW5kKF9wZXJjZW50ICogMTApIC8gMTBcbiAgICAgICAgICAgICAgICAgIHhDdXJyID0geE1pbiArICh4TWF4IC0geE1pbikgKiBfcGVyY2VudDtcbiAgICAgICAgICAgICAgICAgIHZhciB4MSA9IHhDdXJyO1xuICAgICAgICAgICAgICAgICAgdGFzay5wZXJjZW50ID0gX3BlcmNlbnQ7XG4gICAgICAgICAgICAgICAgICBwZXJjZW50TGluZS5hdHRyKFwieDFcIiwgeDEpLmF0dHIoXCJ4MlwiLCB4MSk7XG4gICAgICAgICAgICAgICAgICByZWRyYXdUYXNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKFwiem9vbWVuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmVkcmF3TWVudSgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICB2YXIgc3RlcHMgPSAwO1xuICAgICAgICAgIHN0YXJ0VGltZUxpc3RlbmVyLm9uKCd6b29tc3RhcnQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgdGFzay5fc3RhcnREYXRlID0gdGFzay5zdGFydERhdGU7XG4gICAgICAgICAgICAgIHRhc2suX2VuZERhdGUgPSB0YXNrLmVuZERhdGU7XG4gICAgICAgICAgICAgIHRhc2suX3N0ZXBzID0gMDtcbiAgICAgICAgICAgIH0pLm9uKFwiem9vbVwiLFxuICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICAgICAgICdbb2JqZWN0IE1vdXNlRXZlbnRdJykge1xuICAgICAgICAgICAgICAgICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gZDMuZXZlbnQudHJhbnNsYXRlWzBdO1xuICAgICAgICAgICAgICAgICAgdmFyIG1heERhdGUgPSBkMy50aW1lLmRheS5vZmZzZXQodGFzay5fZW5kRGF0ZSwgLVxuICAgICAgICAgICAgICAgICAgICAxKTtcbiAgICAgICAgICAgICAgICAgIG9mZnNldCA9IE1hdGgubWluKG9mZnNldCwgKHhTY2FsZShtYXhEYXRlKSAtXG4gICAgICAgICAgICAgICAgICAgIHhTY2FsZSh0YXNrLl9zdGFydERhdGUpKSkgLSAxMDtcbiAgICAgICAgICAgICAgICAgIC8vIG9mZnNldCA9IE1hdGgubWluKG9mZnNldCwgdykgLSAxMDtcbiAgICAgICAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgdmFyIGRheVdpZHRoID0geFNjYWxlKGQzLnRpbWUuZGF5Lm9mZnNldChub3csIDEpKSAtXG4gICAgICAgICAgICAgICAgICAgIHhTY2FsZShub3cpO1xuICAgICAgICAgICAgICAgICAgc3RlcHMgPSBNYXRoLnJvdW5kKG9mZnNldCAvIGRheVdpZHRoKTtcbiAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHN0ZXBzICogZGF5V2lkdGggLSAxMDtcbiAgICAgICAgICAgICAgICAgIGxlZnRMaW5lLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9mZnNldDtcbiAgICAgICAgICAgICAgICAgIH0pLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9mZnNldDtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgdGFzay5zdGFydERhdGUgPSBkMy50aW1lLmRheS5vZmZzZXQodGFzay5fc3RhcnREYXRlLFxuICAgICAgICAgICAgICAgICAgICBzdGVwcyk7XG4gICAgICAgICAgICAgICAgICByZWRyYXdUYXNrKCk7XG4gICAgICAgICAgICAgICAgICB2YXIgeDEgPSBwZXJjZW50WCgpO1xuICAgICAgICAgICAgICAgICAgcGVyY2VudExpbmUuYXR0cihcIngxXCIsIHgxKS5hdHRyKFwieDJcIiwgeDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJ6b29tZW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZWRyYXdNZW51KCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIGVuZFRpbWVMaXN0ZW5lci5vbignem9vbXN0YXJ0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHRhc2suX3N0YXJ0RGF0ZSA9IHRhc2suc3RhcnREYXRlO1xuICAgICAgICAgICAgICB0YXNrLl9lbmREYXRlID0gdGFzay5lbmREYXRlO1xuICAgICAgICAgICAgICB0YXNrLl9zdGVwcyA9IDA7XG4gICAgICAgICAgICAgIHZhciB4Q3VyciA9IHBhcnNlRmxvYXQocmlnaHRMaW5lLmF0dHIoJ3gxJykpO1xuICAgICAgICAgICAgICB0YXNrLl94Q3VyciA9IHhDdXJyO1xuICAgICAgICAgICAgfSkub24oXCJ6b29tXCIsXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PVxuICAgICAgICAgICAgICAgICAgJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgeFNjYWxlID0gY29uZmlnLnhTY2FsZTtcbiAgICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSBkMy5ldmVudC50cmFuc2xhdGVbMF07XG4gICAgICAgICAgICAgICAgICB2YXIgeEN1cnIgPSB0YXNrLl94Q3VyciArIG9mZnNldDtcbiAgICAgICAgICAgICAgICAgIHZhciBkYXlzID0gZDMudGltZS5kYXlzKHRhc2suX3N0YXJ0RGF0ZSwgdGFzay5fZW5kRGF0ZSk7XG4gICAgICAgICAgICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgIHZhciBkYXlXaWR0aCA9IHhTY2FsZShkMy50aW1lLmRheS5vZmZzZXQobm93LCAxKSkgLVxuICAgICAgICAgICAgICAgICAgICB4U2NhbGUobm93KTtcbiAgICAgICAgICAgICAgICAgIHN0ZXBzID0gTWF0aC5yb3VuZChvZmZzZXQgLyBkYXlXaWR0aCk7XG4gICAgICAgICAgICAgICAgICBzdGVwcyA9IE1hdGgubWF4KDAgLSBkYXlzLmxlbmd0aCArIDEsIHN0ZXBzKTtcbiAgICAgICAgICAgICAgICAgIHhDdXJyID0gc3RlcHMgKiBkYXlXaWR0aCArIHRhc2suX3hDdXJyO1xuICAgICAgICAgICAgICAgICAgcmlnaHRMaW5lLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHhDdXJyO1xuICAgICAgICAgICAgICAgICAgfSkuYXR0cihcIngyXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geEN1cnI7XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIHZhciB4MSA9IHBlcmNlbnRYKCk7XG4gICAgICAgICAgICAgICAgICBwZXJjZW50TGluZS5hdHRyKFwieDFcIiwgeDEpLmF0dHIoXCJ4MlwiLCB4MSk7XG4gICAgICAgICAgICAgICAgICB0YXNrLmVuZERhdGUgPSBkMy50aW1lLmRheS5vZmZzZXQodGFzay5fZW5kRGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgc3RlcHMpO1xuICAgICAgICAgICAgICAgICAgcmVkcmF3VGFzaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJ6b29tZW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZWRyYXdNZW51KCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIGxlZnRMaW5lID0gbWVudS5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgICAgLmF0dHIoJ2lkeCcsICdsZWZ0JylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdsZWZ0JylcbiAgICAgICAgICAgIC5hdHRyKCd4MScsIDAgLSAxMClcbiAgICAgICAgICAgIC5hdHRyKCd5MScsIHkxKVxuICAgICAgICAgICAgLmF0dHIoJ3gyJywgMCAtIDEwKVxuICAgICAgICAgICAgLmF0dHIoJ3kyJywgeTIpXG4gICAgICAgICAgICAuY2FsbChzdGFydFRpbWVMaXN0ZW5lcik7XG5cbiAgICAgICAgICByaWdodExpbmUgPSBtZW51LmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgICAuYXR0cignaWR4JywgJ3JpZ2h0JylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdyaWdodCcpXG4gICAgICAgICAgICAuYXR0cigneDEnLCB3ICsgMTApXG4gICAgICAgICAgICAuYXR0cigneTEnLCB5MSlcbiAgICAgICAgICAgIC5hdHRyKCd4MicsIHcgKyAxMClcbiAgICAgICAgICAgIC5hdHRyKCd5MicsIHkyKVxuICAgICAgICAgICAgLmNhbGwoZW5kVGltZUxpc3RlbmVyKTtcblxuICAgICAgICAgIHBlcmNlbnRMaW5lID0gbWVudS5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgICAgLmF0dHIoJ2lkeCcsICdwZXJjZW50JylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdwZXJjZW50JylcbiAgICAgICAgICAgIC5hdHRyKCd4MScsIHcgKiB0YXNrLnBlcmNlbnQgfHwgMClcbiAgICAgICAgICAgIC5hdHRyKCd5MScsIHkxKVxuICAgICAgICAgICAgLmF0dHIoJ3gyJywgdyAqIHRhc2sucGVyY2VudCB8fCAwKVxuICAgICAgICAgICAgLmF0dHIoJ3kyJywgeTIpXG4gICAgICAgICAgICAuY2FsbChwZXJjZW50TGlzdGVuZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBlcmNlbnRYID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHRhc2sgPSB0YXNrQm94LmRhdGEoKVswXTtcbiAgICAgICAgICB2YXIgeCA9IDA7XG4gICAgICAgICAgdmFyIGxlZnQgPSBwYXJzZUZsb2F0KGxlZnRMaW5lLmF0dHIoJ3gxJykpICsgMTA7XG4gICAgICAgICAgdmFyIHJpZ2h0ID0gcGFyc2VGbG9hdChyaWdodExpbmUuYXR0cigneDEnKSkgLSAxMDtcbiAgICAgICAgICB4ID0gbGVmdCArIChyaWdodCAtIGxlZnQpICogKHRhc2sucGVyY2VudCB8fCAwKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnbGVmdD0nICsgbGVmdCArICdcXHQ9JyArIHJpZ2h0ICsgJ1xcdCcgKyB4KTtcbiAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vY2xpY2tcbiAgICAgICAgdmFyIGN1cngsIGN1cnk7XG4gICAgICAgIHZhciBjbGlja0hhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnY2xpY2tIYW5kbGVyJyk7XG4gICAgICAgICAgdmFyIGV2ZW50ID0gZDMuZXZlbnQ7XG4gICAgICAgICAgaWYgKGN1cnggPT0gZXZlbnQuY2xpZW50WCAmJiBjdXJ5ID09IGV2ZW50LmNsaWVudFkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgY3VyeCA9IGV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgY3VyeSA9IGV2ZW50LmNsaWVudFk7XG4gICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChkMy5ldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgZDMuZXZlbnQuY2xpZW50WSk7XG4gICAgICAgICAgdmFyIHRhc2tCb3ggPSBkMy5zZWxlY3QoZWwpLnBhcmVudE5vZGU7XG4gICAgICAgICAgY29uc29sZS5sb2codGFza0JveCk7XG4gICAgICAgICAgaWYgKHRhc2tCb3gpIHtcbiAgICAgICAgICAgIC8vIHJlZHJhd01lbnUoKTtcbiAgICAgICAgICAgIHZhciB0YXNrID0gdGFza0JveC5kYXRhKClbMF07XG4gICAgICAgICAgICB3aW5kb3cuY29uZmlnLnNlbGVjdElkID0gdGFzay5uYW1lO1xuICAgICAgICAgICAgY29uc29sZS5sb2codGFzay50YXNrTmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZHJhd01lbnUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8v55S76KGMXG4gICAgICAgIHZhciByZWRyYXdUYXNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ+mHjeeUu+S7u+WKoScpO1xuICAgICAgICAgIGxpbmVTdmcuc2VsZWN0QWxsKCcuaXRlbScpLnJlbW92ZSgpO1xuICAgICAgICAgIHRhc2tCb3guZW50ZXIoKVxuICAgICAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgICAgICAub24oJ2NsaWNrJywgY2xpY2tIYW5kbGVyKVxuICAgICAgICAgICAgLmNhbGwobW92ZUxpc3RlbmVyKVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgY29uZmlnLmV2ZW50Q29sb3IpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCBcIml0ZW1cIilcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyBjb25maWcueFNjYWxlKGQuc3RhcnREYXRlKSArXG4gICAgICAgICAgICAgICAgJywgOSknXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDIwKVxuICAgICAgICAgICAgLy8gLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgLy8gICByZXR1cm4gKGNvbmZpZy54U2NhbGUodGFzay5lbmREYXRlKSAtIGNvbmZpZy54U2NhbGUoXG4gICAgICAgICAgICAvLyAgICAgZC5zdGFydERhdGUpKVxuICAgICAgICAgICAgLy8gfSlcbiAgICAgICAgICAgIC5vbignbW91c2VvdmVyJywgdG9vbHRpcC5tb3VzZW92ZXIpXG4gICAgICAgICAgICAub24oJ21vdXNlb3V0JywgdG9vbHRpcC5tb3VzZW91dClcbiAgICAgICAgICAgIC5vbignbW91c2Vtb3ZlJywgdG9vbHRpcC5tb3VzZW1vdmUpXG4gICAgICAgICAgICAuY2FsbCh0YXNrKHtcbiAgICAgICAgICAgICAgeFNjYWxlOiBjb25maWcueFNjYWxlLFxuICAgICAgICAgICAgICBldmVudENvbG9yOiBjb25maWcuZXZlbnRDb2xvclxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIHRhc2tCb3guZXhpdCgpLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJlZHJhd1Rhc2soKTtcblxuXG4gICAgICAgIC8v54K55Ye75Lu75Yqh5ZCO5pi+56S65Lu75Yqh55qE6LCD5pW05qih5byPXG4gICAgICAgIHJlZHJhd01lbnUoKTtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICAgIC8vIOWkhOeQhuS7u+WKoeW3puWPs+enu+WKqOeahOmXrumimFxuICAgICAgICBtb3ZlTGlzdGVuZXIub24oXCJ6b29tXCIsXG4gICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICAgJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZDMuZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgICBkMy5ldmVudC5jbGllbnRZKTtcbiAgICAgICAgICAgICAgdmFyIHggPSAwLFxuICAgICAgICAgICAgICAgIHcgPSAwO1xuICAgICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgICAgICAgdGFza0JveC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgICAgICAgICAgICAgdyA9IHhTY2FsZShkLmVuZERhdGUpIC0geFNjYWxlKGQuc3RhcnREYXRlKTtcbiAgICAgICAgICAgICAgICB4ID0geFNjYWxlKGQuc3RhcnREYXRlKSArIGQzLmV2ZW50LnRyYW5zbGF0ZVtcbiAgICAgICAgICAgICAgICAgIDBdOyAvL+enu+WKqOWQjueahOi3neemu1xuICAgICAgICAgICAgICAgIHZhciBkYXRlVGltZSA9IHhTY2FsZS5pbnZlcnQoeCk7IC8v6L2s5o2i5oiQ5paw55qE5pe26Ze0XG4gICAgICAgICAgICAgICAgdmFyIGRhdGUgPSBkMy50aW1lLmRheShkYXRlVGltZSk7IC8v5a+55pe26Ze06L+b6KGM5Y+W5pW0XG4gICAgICAgICAgICAgICAgeCA9IHhTY2FsZShkYXRlKTsgLy/ml7bpl7Tlj5bmlbTlkI7nmoTot53nprtcbiAgICAgICAgICAgICAgICBkLnN0YXJ0RGF0ZSA9IGRhdGU7XG4gICAgICAgICAgICAgICAgZC5lbmREYXRlID0geFNjYWxlLmludmVydCh4ICsgdyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHggKyAnLCA5KSc7XG4gICAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgICAgLy8gdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgICAgICAgICAgIC8vIHZhciB0YXNrID0gdGFza0JveC5kYXRhKClbMF07XG4gICAgICAgICAgICAgIC8vIHggPSB4U2NhbGUodGFzay5zdGFydERhdGUpICsgZDMuZXZlbnQudHJhbnNsYXRlW1xuICAgICAgICAgICAgICAvLyAgIDBdOyAvL+enu+WKqOWQjueahOi3neemu1xuICAgICAgICAgICAgICAvLyB2YXIgZGF0ZVRpbWUgPSB4U2NhbGUuaW52ZXJ0KHgpOyAvL+i9rOaNouaIkOaWsOeahOaXtumXtFxuICAgICAgICAgICAgICAvLyB2YXIgZGF0ZSA9IGQzLnRpbWUuZGF5KGRhdGVUaW1lKTsgLy/lr7nml7bpl7Tov5vooYzlj5bmlbRcbiAgICAgICAgICAgICAgLy8gLy8geCA9IHhTY2FsZShkYXRlKTsgLy/ml7bpl7Tlj5bmlbTlkI7nmoTot53nprtcbiAgICAgICAgICAgICAgLy8gLy8gY29uc29sZS5sb2coeCk7XG4gICAgICAgICAgICAgIC8vIHRhc2suc3RhcnREYXRlID0gZGF0ZTtcbiAgICAgICAgICAgICAgLy8gLy8gdGFzay5lbmREYXRlID0geFNjYWxlLmludmVydCh4ICsgdyk7XG4gICAgICAgICAgICAgIHJlZHJhd01lbnUoKTtcblxuXG5cbiAgICAgICAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgICAgdmFyIGJveCA9IGQzLnNlbGVjdCgnI2NvbnRhaW5lci1ib3gnKTtcbiAgICAgICAgICAgICAgYm94LnNlbGVjdCgnLmxsaW5lJykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgIHZhciBnID0gYm94LmFwcGVuZCgnZycpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAnMC40JylcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbGxpbmUnKVxuICAgICAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB4ICsgJywgMCknKTtcblxuICAgICAgICAgICAgICBnLmFwcGVuZCgncmVjdCcpXG4gICAgICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgXCIjMGNjXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAnMC40JylcbiAgICAgICAgICAgICAgICAvLyAuYXR0cignY2xhc3MnLCBcIml0ZW14XCIpXG4gICAgICAgICAgICAgICAgLy8gLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwgJyArIDIwICsgJyknKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBjb25maWcuZ3JhcGhIZWlnaHQpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgdylcblxuICAgICAgICAgICAgICBnLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3gxJywgMClcbiAgICAgICAgICAgICAgICAuYXR0cigneTEnLCBjb25maWcubWFyZ2luLnRvcCAtIDQwKVxuICAgICAgICAgICAgICAgIC5hdHRyKCd4MicsIDApXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3kyJywgY29uZmlnLmdyYXBoSGVpZ2h0ICsgNDApO1xuXG4gICAgICAgICAgICAgIGcuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgICAgICAgICAuYXR0cigneDEnLCB3KVxuICAgICAgICAgICAgICAgIC5hdHRyKCd5MScsIGNvbmZpZy5tYXJnaW4udG9wIC0gNDApXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3gyJywgdylcbiAgICAgICAgICAgICAgICAuYXR0cigneTInLCBjb25maWcuZ3JhcGhIZWlnaHQgKyA0MCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSkub24oXCJ6b29tZW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBib3ggPSBkMy5zZWxlY3QoJyNjb250YWluZXItYm94Jyk7XG4gICAgICAgICAgYm94LnNlbGVjdCgnLmxsaW5lJykucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbmZpZ3VyYWJsZShldmVudExpbmUsIGNvbmZpZyk7XG5cbiAgICByZXR1cm4gZXZlbnRMaW5lO1xuICB9O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIG1vZHVsZSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZpbHRlckRhdGUoZGF0YSwgeFNjYWxlLCB5U2NhbGUsIHlNaW4sIHlNYXgsXG4gIGZ1bGxSZWRyYXcpIHtcbiAgZGF0YSA9IGRhdGEgfHwgW107XG4gIHZhciBmaWx0ZXJlZERhdGEgPSBbXTtcbiAgdmFyIGJvdW5kYXJ5ID0geFNjYWxlLnJhbmdlKCk7XG4gIHZhciBtaW4gPSBib3VuZGFyeVswXTtcbiAgdmFyIG1heCA9IGJvdW5kYXJ5WzFdO1xuICBkYXRhLmZvckVhY2goZnVuY3Rpb24oZGF0dW0pIHtcbiAgICB2YXIgc3RhcnQgPSB4U2NhbGUoZGF0dW0uc3RhcnREYXRlKTtcbiAgICB2YXIgZW5kID0geFNjYWxlKGRhdHVtLmVuZERhdGUpO1xuICAgIHZhciB5ID0geVNjYWxlKGRhdHVtLm5hbWUpO1xuICAgIGlmIChlbmQgPCBtaW4gfHwgc3RhcnQgPiBtYXgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFmdWxsUmVkcmF3ICYmICh5IDwgeU1pbiB8fCB5ID4geU1heCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZmlsdGVyZWREYXRhLnB1c2goZGF0dW0pO1xuICB9KTtcbiAgcmV0dXJuIGZpbHRlcmVkRGF0YTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCBtb2R1bGUgKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmaWx0ZXJEYXRlKGRhdGEsIHNjYWxlLCBsaXRlKSB7XG4gIGRhdGEgPSBkYXRhIHx8IFtdO1xuICB2YXIgZmlsdGVyZWREYXRhID0gW107XG4gIHZhciBvZmZzZXQgPSAkKCcjc2Nyb2xsZXInKS5vZmZzZXQoKS50b3A7XG4gIHZhciB5TWluID0gMCAtIG9mZnNldDtcbiAgdmFyIHlNYXggPSAwIC0gb2Zmc2V0ICsgJCgnI3dyYXBwZXInKS5oZWlnaHQoKTtcbiAgdmFyIGNvdW50ID0gMDtcbiAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAvLyBpZiAobGl0ZSkge1xuICAgIC8vICAgdmFyIG5hbWUgPSBkLm5hbWU7XG4gICAgLy8gICB2YXIgeSA9IHNjYWxlKG5hbWUpO1xuICAgIC8vICAgY29uc29sZS5sb2coW3ksIHlNaW4sIHlNYXhdLmpvaW4oJywnKSlcbiAgICAvLyAgIHZhciBfZCA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkKTtcbiAgICAvLyAgIGlmICh5IDwgeU1pbiB8fCB5ID4geU1heCkge1xuICAgIC8vICAgICBfZC50YXNrcy5sZW5ndGggPSAwO1xuICAgIC8vICAgfSBlbHNlIHtcbiAgICAvLyAgICAgY291bnQrKztcbiAgICAvLyAgIH1cbiAgICAvLyAgIGZpbHRlcmVkRGF0YS5wdXNoKF9kKTtcbiAgICAvLyB9IGVsc2Uge1xuICAgIGZpbHRlcmVkRGF0YS5wdXNoKGQpO1xuICAgIC8vIH1cbiAgfSk7XG4gIGNvbnNvbGUubG9nKCdjb3VudD09PScgKyBjb3VudCk7XG5cbiAgcmV0dXJuIGZpbHRlcmVkRGF0YTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGFwcCA9IHJlcXVpcmUoJy4vYXBwJyk7XG5cbmlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICBkZWZpbmUoJ2QzLmNoYXJ0LmFwcCcsIFtcImQzXCJdLCBmdW5jdGlvbihkMykge1xuICAgIGQzLmNoYXJ0ID0gZDMuY2hhcnQgfHwge307XG4gICAgZDMuY2hhcnQuYXBwID0gYXBwKGQzKTtcbiAgfSk7XG59IGVsc2UgaWYgKHdpbmRvdykge1xuICB3aW5kb3cuZDMuY2hhcnQgPSB3aW5kb3cuZDMuY2hhcnQgfHwge307XG4gIHdpbmRvdy5kMy5jaGFydC5hcHAgPSBhcHAod2luZG93LmQzKTtcbn0gZWxzZSB7XG4gIG1vZHVsZS5leHBvcnRzID0gYXBwO1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBkMyAqL1xuXG52YXIgY29uZmlndXJhYmxlID0gcmVxdWlyZSgnLi91dGlsL2NvbmZpZ3VyYWJsZScpO1xudmFyIGZpbHRlckRhdGEgPSByZXF1aXJlKCcuL2ZpbHRlckRhdGEnKTtcblxudmFyIGRlZmF1bHRDb25maWcgPSB7XG4gIHhTY2FsZTogbnVsbFxufTtcblxudmFyIGZvcm1hdGVyID0gZDMudGltZS5mb3JtYXQoXCIlWS0lbS0lZCAlSDolTTolU1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGQzKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb25maWcpIHtcblxuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7XG4gICAgICB4U2NhbGU6IG51bGwsXG4gICAgICB5U2NhbGU6IG51bGxcbiAgICB9O1xuICAgIGZvciAodmFyIGtleSBpbiBkZWZhdWx0Q29uZmlnKSB7XG4gICAgICBjb25maWdba2V5XSA9IGNvbmZpZ1trZXldIHx8IGRlZmF1bHRDb25maWdba2V5XTtcbiAgICB9XG4gICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgdmFyIHRhc2sgPSBmdW5jdGlvbiB0YXNrKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygn55S75Lu75YqhJyk7XG4gICAgICAgIC8vIOefqeW9ouaYvuekuuaWueahiFxuICAgICAgICB2YXIgY29udGFpbmVyID0gZDMuc2VsZWN0KHRoaXMpO1xuICAgICAgICBjb250YWluZXIuc2VsZWN0QWxsKCcudGFzaycpLnJlbW92ZSgpO1xuXG4gICAgICAgIHZhciBzaG93ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGZpbGxDb2xvciA9IFwiIzBjY1wiO1xuICAgICAgICAgIGlmIChkYXRhLmVuZERhdGUgPCBuZXcgRGF0ZSgpKSB7XG4gICAgICAgICAgICBmaWxsQ29sb3IgPSAncmVkJztcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGJhY2tncm91bmQgPSBjb250YWluZXIuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIGZpbGxDb2xvcilcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwidGFzayBiYWNrZ3JvdW5kXCIpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgMjApXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZGF0YS5lbmREYXRlICsgJ1xcdCcgKyBkYXRhLnN0YXJ0RGF0ZSArXG4gICAgICAgICAgICAgIC8vICAgJ1xcdCcgKyAoeFNjYWxlKGRhdGEuZW5kRGF0ZSkgLSB4U2NhbGUoZGF0YS5zdGFydERhdGUpKVxuICAgICAgICAgICAgICAvLyApO1xuICAgICAgICAgICAgICByZXR1cm4gKHhTY2FsZShkYXRhLmVuZERhdGUpIC0geFNjYWxlKGRhdGEuc3RhcnREYXRlKSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIHZhciBwcmUgPSBjb250YWluZXIuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIFwiIzBhY1wiKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgXCJ0YXNrIHByZVwiKVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDIwKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiAoY29uZmlnLnhTY2FsZShkYXRhLmVuZERhdGUpIC0gY29uZmlnLnhTY2FsZShcbiAgICAgICAgICAgICAgICBkYXRhLnN0YXJ0RGF0ZSkpICogZGF0YS5wZXJjZW50IHx8IDA7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgc2hvdygpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbmZpZ3VyYWJsZSh0YXNrLCBjb25maWcpO1xuXG4gICAgcmV0dXJuIHRhc2s7XG4gIH07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjb25maWd1cmFibGUodGFyZ2V0RnVuY3Rpb24sIGNvbmZpZywgbGlzdGVuZXJzKSB7XG4gIGxpc3RlbmVycyA9IGxpc3RlbmVycyB8fCB7fTtcbiAgZm9yICh2YXIgaXRlbSBpbiBjb25maWcpIHtcbiAgICAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgdGFyZ2V0RnVuY3Rpb25baXRlbV0gPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBjb25maWdbaXRlbV07XG4gICAgICAgIGNvbmZpZ1tpdGVtXSA9IHZhbHVlO1xuICAgICAgICBpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGl0ZW0pKSB7XG4gICAgICAgICAgbGlzdGVuZXJzW2l0ZW1dKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGFyZ2V0RnVuY3Rpb247XG4gICAgICB9O1xuICAgIH0pKGl0ZW0pOyAvLyBmb3IgZG9lc24ndCBjcmVhdGUgYSBjbG9zdXJlLCBmb3JjaW5nIGl0XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGQzLCBjb25maWcsIHhTY2FsZSwgZ3JhcGgsIGdyYXBoSGVpZ2h0LCB3aGVyZSkge1xuICB2YXIgeEF4aXMgPSB7fTtcbiAgdmFyIHhBeGlzRWxzID0ge307XG5cbiAgdmFyIHRpY2tGb3JtYXREYXRhID0gW107XG5cbiAgY29uZmlnLnRpY2tGb3JtYXQuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgdmFyIHRpY2sgPSBpdGVtLnNsaWNlKDApO1xuICAgIHRpY2tGb3JtYXREYXRhLnB1c2godGljayk7XG4gIH0pO1xuXG4gIHZhciB0aWNrRm9ybWF0ID0gY29uZmlnLmxvY2FsZSA/IGNvbmZpZy5sb2NhbGUudGltZUZvcm1hdC5tdWx0aShcbiAgICB0aWNrRm9ybWF0RGF0YSkgOiBkMy50aW1lLmZvcm1hdC5tdWx0aSh0aWNrRm9ybWF0RGF0YSk7XG4gIHhBeGlzW3doZXJlXSA9IGQzLnN2Zy5heGlzKClcbiAgICAuc2NhbGUoeFNjYWxlKVxuICAgIC5vcmllbnQod2hlcmUpXG4gICAgLnRpY2tTaXplKDYpXG4gICAgLnRpY2tQYWRkaW5nKDEwKVxuICAgIC50aWNrRm9ybWF0KHRpY2tGb3JtYXQpO1xuXG4gIGlmICh0eXBlb2YgY29uZmlnLmF4aXNGb3JtYXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25maWcuYXhpc0Zvcm1hdCh4QXhpcyk7XG4gIH1cblxuICB2YXIgeSA9ICh3aGVyZSA9PSAnYm90dG9tJykgPyAwIDogY29uZmlnLm1hcmdpbi50b3AgLSAxO1xuXG5cbiAgeEF4aXNFbHNbd2hlcmVdID0gZ3JhcGhcbiAgICAuYXBwZW5kKCdnJylcbiAgICAuY2xhc3NlZCgneC1heGlzIGF4aXMnLCB0cnVlKVxuICAgIC5jbGFzc2VkKHdoZXJlLCB0cnVlKVxuICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBjb25maWcubWFyZ2luLmxlZnQgKyAnLCAnICsgeSArICcpJylcbiAgICAuY2FsbCh4QXhpc1t3aGVyZV0pO1xuXG4gIHZhciBkcmF3WEF4aXMgPSBmdW5jdGlvbiBkcmF3WEF4aXMoKSB7XG4gICAgeEF4aXNFbHNbd2hlcmVdXG4gICAgICAuY2FsbCh4QXhpc1t3aGVyZV0pO1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgZHJhd1hBeGlzOiBkcmF3WEF4aXNcbiAgfTtcbn07XG4iXX0=
