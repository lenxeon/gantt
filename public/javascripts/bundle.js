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
          .attr('id', 'container-box');

        var yDomain = [];
        var yRange = [];


        data.forEach(function(task, index) {
          yDomain.push(task.uuid);
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
            return 'translate(0,' + (yScale(d.uuid)) + ')';
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
            eventColor: config.eventColor,
            changeTimeHandler: config.changeTimeHandler,
            changeStartTimeHandler: config.changeStartTimeHandler,
            changeEndTimeHandler: config.changeEndTimeHandler,
            changePercentHandler: config.changePercentHandler
          }));

          var et = new Date().getTime();
          // console.log('重画整体' + fullRedraw + '=' + (et - st) + 'ms');
        }
        redraw(false);



      });
      loaded();
    }

    configurable(init, config);
    return init;
  };
};

},{"./eventLine":2,"./filterLine":4,"./util/configurable":10,"./xAxis":11}],2:[function(require,module,exports){
"use strict";
/* global require, module, d3 */

var configurable = require('./util/configurable');
var filterData = require('./filterData');
var muFactory = require('./muItems');

var defaultConfig = {
  xScale: null
};
var formater = d3.time.format("%Y-%m-%d %H:%M:%S")

module.exports = function(d3) {
  var task = require('./task')(d3);
  var leftBtn = require('./leftBtn')(d3);
  var rightBtn = require('./rightBtn')(d3);
  return function(config) {
    config = config || {
      xScale: null,
      redraw: true,
      eventColor: null
    };
    for (var key in defaultConfig) {
      config[key] = config[key] || defaultConfig[key];
    }
    //过滤用
    var scrollTopOffset = $('#scroller').offset().top;
    var yMin = 0 - scrollTopOffset;
    var yMax = 0 - scrollTopOffset + $('#wrapper').height() + 80;
    //当前选中的是哪一个任务
    var selectedTask = null;
    var xScale = config.xScale;
    //
    var eventLine = function eventLine(selection) {
      selection.each(function(data) {
        var lineSvg = d3.select(this);
        lineSvg.selectAll('.item').remove();
        var taskBox = lineSvg
          .selectAll('.item')
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


        var leftBtn, percentBtn, rightBtn;
        var leftOffFix = -19,
          rightOffFix = 5; //矩形偏移
        var redrawMenu = function() {
          var task = taskBox.data()[0];
          if (task == null || window.config.selectId != task.name) {
            return;
          }
          //目录
          d3.select('.graph-body').select('.menu').remove();
          var menu = lineSvg.append('g').attr('class', "menu");
          var percentListener = d3.behavior.zoom().center(null);
          var startTimeListener = d3.behavior.zoom().center(null);
          var endTimeListener = d3.behavior.zoom().center(null);
          var x = config.xScale(task.startDate);
          var w = config.xScale(task.endDate) - config.xScale(task.startDate);
          menu.attr('transform', 'translate(' + x + ', 0)');

          //百分比
          percentListener.on('zoomstart', function() {
              task._percent = task.percent || 0;
              task._xCurr = d3.event.sourceEvent.clientX;
              console.log("zoomstart:" + task._xCurr);
            }).on("zoom",
              function() {
                if (d3.event.sourceEvent && d3.event.sourceEvent.toString() ===
                  '[object MouseEvent]') {
                  var clientX = d3.event.sourceEvent.clientX;
                  var offset = clientX - task._xCurr;
                  var xScale = config.xScale;
                  var xMin = 0; //
                  var xMax = w;
                  var xCurr = w * task._percent + offset;
                  xCurr = Math.min(xCurr, xMax);
                  xCurr = Math.max(xCurr, xMin);
                  var _percent = (xCurr - xMin) / w;
                  task.percent = Math.round(_percent * 10) / 10
                  xCurr = xMin + w * task.percent;
                  percentBtn.attr('transform', "translate(" + xCurr +
                    ", 19) rotate(0)")
                  redrawTask();
                }
              })
            .on("zoomend", function() {
              redrawMenu();
              if (typeof config.changePercentHandler ===
                'function') {
                config.changePercentHandler(taskBox.data()[0]);
              }
            });

          var steps = 0;
          startTimeListener.on('zoomstart', function() {
              task._startDate = task.startDate;
              task._endDate = task.endDate;
              task._steps = 0;
              task._percent = task.percent || 0;
              task._xCurr = d3.event.sourceEvent.clientX;
              console.log("zoomstart:" + task._xCurr);
            }).on("zoom",
              function() {
                if (d3.event.sourceEvent && d3.event.sourceEvent.toString() ===
                  '[object MouseEvent]') {
                  var xScale = config.xScale;
                  var clientX = d3.event.sourceEvent.clientX;
                  var offset = clientX - task._xCurr;
                  var maxDate = d3.time.day.offset(task._endDate, -
                    1);
                  offset = Math.min(offset, (xScale(maxDate) -
                    xScale(task._startDate))) + leftOffFix;
                  var now = new Date();
                  var dayWidth = xScale(d3.time.day.offset(now, 1)) -
                    xScale(now);
                  steps = Math.round(offset / dayWidth);
                  offset = steps * dayWidth + leftOffFix;
                  leftBtn.attr('transform', "translate(" + offset +
                    ", 13)")
                  task.startDate = d3.time.day.offset(task._startDate,
                    steps);
                  redrawTask();
                  var x1 = percentX();
                  percentBtn.attr("x", x1);
                  //
                  w = xScale(task.endDate) - xScale(task.startDate);
                  var maskX = xScale(task.startDate);
                  drawMask(maskX, w);
                }
                return false;
              })
            .on("zoomend", function() {
              redrawMenu();
              clearMask();
              if (typeof config.changeStartTimeHandler ===
                'function') {
                config.changeEndTimeHandler(taskBox.data()[0]);
              }
            });


          //结束时间调整开始
          endTimeListener.on('zoomstart', function() {
              task._startDate = task.startDate;
              task._endDate = task.endDate;
              task._steps = 0;
              task._xCurr = d3.event.sourceEvent.clientX;
              task._width = xScale(task.endDate) - xScale(task.startDate);
              console.log("zoomstart:" + task._xCurr);
            }).on("zoom",
              function() {
                if (d3.event.sourceEvent && d3.event.sourceEvent.toString() ===
                  '[object MouseEvent]') {
                  var xScale = config.xScale;
                  var clientX = d3.event.sourceEvent.clientX;
                  var offset = clientX - task._xCurr;
                  //这个任务有几天
                  var days = d3.time.days(task._startDate, task._endDate);
                  var now = new Date();
                  var dayWidth = xScale(d3.time.day.offset(now, 1)) -
                    xScale(now);
                  steps = Math.round(offset / dayWidth);
                  steps = Math.max(0 - days.length + 1, steps);
                  var xCurr = task._width + rightOffFix + steps *
                    dayWidth;
                  rightBtn.attr('transform', 'translate(' + xCurr +
                    ', 13)');
                  task.endDate = d3.time.day.offset(task._endDate,
                    steps);
                  redrawTask();
                  var w = xScale(task.endDate) - xScale(task.startDate);
                  drawMask(xScale(task.startDate), w);
                }
                return false;
              })
            .on("zoomend", function() {
              redrawMenu();
              clearMask();
              if (typeof config.changeEndTimeHandler ===
                'function') {
                config.changeEndTimeHandler(taskBox.data()[0]);
              }
            });

          //结束时间调整结束


          leftBtn = muFactory(d3, config, menu, 'leftBtn');
          rightBtn = muFactory(d3, config, menu, 'rightBtn');
          percentBtn = muFactory(d3, config, menu, 'percentBtn');
          var rightX = w + rightOffFix;
          var px = ((w * task.percent || 0));
          leftBtn.attr('transform', "translate(" + leftOffFix +
            ", 13)").call(startTimeListener);
          rightBtn.attr('transform', "translate(" + rightX +
            ", 13)").call(endTimeListener);
          percentBtn.attr('transform', "translate(" + px +
            ", 19)").call(percentListener);
        }

        var percentX = function() {
          var task = taskBox.data()[0];
          var x = 0;
          // console.log(leftBtn.attr('x'));
          // console.log(rightBtn.attr('x'));
          // var left = parseFloat(leftBtn.attr('x')) + 10;
          // var right = parseFloat(rightBtn.attr('x')) - 10;
          // x = left + (right - left) * (task.percent || 0);
          // console.log('left=' + left + '\t=' + right + '\t' + x);
          return x;
        }

        //click
        var curx, cury;
        var clickHandler = function() {
          var event = d3.event;
          if (curx == event.clientX && cury == event.clientY)
            return;
          curx = event.clientX;
          cury = event.clientY;
          var el = document.elementFromPoint(d3.event.clientX,
            d3.event.clientY);
          var taskBox = d3.select(el);
          if (taskBox) {
            // redrawMenu();
            var task = taskBox.data()[0];
            window.config.selectId = task.name;
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
                ', 13)'
            })
            .attr('height', 20)
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

        var drawMask = function(x, w) {
          var box = d3.select('#container-box');
          box.select('.lline').remove();
          var g = box.append('g')
            // .attr('opacity', '0.4')
            .attr('class', 'lline')
            .attr('transform', 'translate(' + x + ', 0)');
          g.append('rect')
            .style('fill', "#0cc")
            .attr('opacity', '0.1')
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

        var clearMask = function() {
          var box = d3.select('#container-box');
          box.select('.lline').remove();
        }

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
                return 'translate(' + x + ', 13)';
              });
              redrawMenu();
              /////////////////////
              drawMask(x, w);
            }
            return false;
          }).on("zoomend", function() {
          var box = d3.select('#container-box');
          box.select('.lline').remove();
          if (typeof config.changeTimeHandler === 'function') {
            config.changeTimeHandler(taskBox.data()[0]);
          }
        });
      });
    };
    configurable(eventLine, config);
    return eventLine;
  };
};

},{"./filterData":3,"./leftBtn":5,"./muItems":7,"./rightBtn":8,"./task":9,"./util/configurable":10}],3:[function(require,module,exports){
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
    var y = yScale(datum.uuid);
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
/* global require, module, d3 */

var configurable = require('./util/configurable');
var filterData = require('./filterData');

var defaultConfig = {
  xScale: null
};

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
    var leftBtn = function leftBtn(selection) {
      selection.each(function(data) {
        d3.select(this).selectAll('.leftBtn').remove();
        var leftLine = d3.select(this)
          .append('g')
          .attr('transform', "translate(-19, 13)")
          .attr('class', 'btn leftBtn');
        leftLine.append('path')
          .attr('d',
            'M 0 0 L 11 0 q -2 2 -2 7 L 11 11 L  0 11 z')
          .attr('stroke', '#888')
          .attr('stroke-width', '1')
          .attr('fill', '#1f96d8')
        leftLine.append('line')
          .attr('x1', '3')
          .attr('y1', '2')
          .attr('x2', '3')
          .attr('y2', '9')
          .attr('fill', 'white')
        leftLine.append('line')
          .attr('x1', '6')
          .attr('y1', '2')
          .attr('x2', '6')
          .attr('y2', '9')
          .attr('fill', 'white')
      });
    };

    configurable(leftBtn, config);

    return leftBtn;
  };
};

},{"./filterData":3,"./util/configurable":10}],6:[function(require,module,exports){
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

},{"./app":1}],7:[function(require,module,exports){
module.exports = function(d3, config, graph, where) {


  var items = {};

  var buildLeft = function() {
    items['leftBtn'] = graph.selectAll('.leftBtn').remove();
    var leftLine = graph
      .append('g')
      .attr('transform', "translate(0, 13)")
      .attr('class', 'btn leftBtn');
    leftLine.append('path')
      .attr('d',
        'M 0 0 L 11 0 q -2 2 -2 7 L 11 11 L  0 11 z')
      .attr('stroke', '#888')
      .attr('stroke-width', '1')
      .attr('fill', '#1f96d8')
    leftLine.append('line')
      .attr('x1', '3')
      .attr('y1', '2')
      .attr('x2', '3')
      .attr('y2', '9')
      .attr('fill', 'white')
    leftLine.append('line')
      .attr('x1', '6')
      .attr('y1', '2')
      .attr('x2', '6')
      .attr('y2', '9')
      .attr('fill', 'white')
    return leftLine;
  }


  var buildRight = function() {
    items['rightBtn'] = graph.selectAll('.rightBtn').remove();
    var rightBtn = graph
      .append('g')
      .attr('transform', "translate(0, 13)")
      .attr('class', 'btn rightBtn');
    rightBtn.append('path')
      .attr('d',
        'M 0 0  q 2 2 2 8  L  0 11  L 11 11 L 11 0 z')
      .attr('stroke', '#888')
      .attr('stroke-width', '1')
      .attr('fill', '#1f96d8')
    rightBtn.append('line')
      .attr('x1', '5')
      .attr('y1', '2')
      .attr('x2', '5')
      .attr('y2', '9')
      .attr('fill', 'white')
    rightBtn.append('line')
      .attr('x1', '8')
      .attr('y1', '2')
      .attr('x2', '8')
      .attr('y2', '9')
      .attr('fill', 'white')
    return rightBtn;
  }

  var buildPercent = function() {
    items['percentBtn'] = graph.selectAll('.percentBtn').remove();
    var percentBtn = graph
      .append('polyline')
      .attr('stroke', "#a0a0a0")
      .attr('class', "percentBtn")
      .attr('transform', 'translate(0, 18)')
      .attr('points', '0,0 6,7 6,13, -6,13 -6,7 0,0')
      .attr('style', 'fill:white;stroke-width:1')
    return percentBtn;
  }

  var drawXAxis = function drawXAxis() {
    // console.log('where===' + where);
    switch (where) {
      case 'leftBtn':
        return buildLeft();
        break;
      case 'rightBtn':
        return buildRight();
        break;
      case 'percentBtn':
        return buildPercent();
        break;
      default:

    }
  };

  return drawXAxis();
};

},{}],8:[function(require,module,exports){
"use strict";
/* global require, module, d3 */

var configurable = require('./util/configurable');
var filterData = require('./filterData');

var defaultConfig = {
  xScale: null
};

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
    var rightBtn = function rightBtn(selection) {
      selection.each(function(data) {
        d3.select(this).selectAll('.rightBtn').remove();
        var leftLine = d3.select(this)
          .append('g')
          .attr('transform', "translate(-19, 13)")
          .attr('class', 'btn rightBtn');
        leftLine.append('path')
          .attr('d',
            'M 0 0 L 11 0 q -2 2 -2 7 L 11 11 L  0 11 z')
          .attr('stroke', '#888')
          .attr('stroke-width', '1')
          .attr('fill', '#1f96d8')
        leftLine.append('line')
          .attr('x1', '3')
          .attr('y1', '2')
          .attr('x2', '3')
          .attr('y2', '9')
          .attr('fill', 'white')
        leftLine.append('line')
          .attr('x1', '6')
          .attr('y1', '2')
          .attr('x2', '6')
          .attr('y2', '9')
          .attr('fill', 'white')
      });
    };

    configurable(rightBtn, config);

    return rightBtn;
  };
};

},{"./filterData":3,"./util/configurable":10}],9:[function(require,module,exports){
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
        // console.log(data);
        // console.log('画任务');
        // 矩形显示方案
        var container = d3.select(this);
        container.selectAll('.task').remove();

        var showTask = function() {

          var fillColor = "#0cc";
          if (data.endDate < new Date()) {
            fillColor = 'red';
          }

          var background = container.append('rect')
            .style('fill', "transparent")
            .attr('class', "task background")
            .attr('height', 10)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('stroke', "#a0a0a0")
            .attr('stroke-width', 1)
            .attr('width', function() {
              // console.log(data.endDate + '\t' + data.startDate +
              //   '\t' + (xScale(data.endDate) - xScale(data.startDate))
              // );
              return (xScale(data.endDate) - xScale(data.startDate))
            });

          var pre = container.append('rect')
            .style('fill', "#6df3d2")
            .attr('stroke', "#a0a0a0")
            .attr('class', "task pre")
            .attr('transform', "translate(0, 0.5)")
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('height', 10)
            .attr('width', function() {
              return (config.xScale(data.endDate) - config.xScale(
                data.startDate)) * data.percent || 0;
            });

        };

        var showPackage = function() {

          var fillColor = "#0cc";
          if (data.endDate < new Date()) {
            fillColor = 'red';
          }

          var w = xScale(data.endDate) - xScale(data.startDate);
          var pw = w * data.percent || 0;
          var background = container.append('polyline')
            .attr('stroke', "#a0a0a0")
            .attr('class', "task pre")
            .attr('transform', "translate(0, 0.5)")
            .attr('points', '0,0 ' + w + ',0 ' + w + ',20 ' + (w -
              5) + ',7 5,7 0,20 0,0')
            .attr('style', 'fill:white;stroke-width:1');


          var pre = container.append('polyline')
            .attr('stroke', "#a0a0a0")
            .attr('class', "task pre")
            .attr('transform', "translate(0, 0.5)")
            .attr('style', 'fill:ff9c4c;stroke-width:1');

          if (pw < 5) {
            pre.attr('points', '0,0 ' + pw + ',0 ' + pw +
              ',7 ' + pw + ',7 0,20 0,0');
          } else if (pw >= 5 && pw < (w - 5)) {
            pre.attr('points', '0,0 ' + pw + ',0 ' + pw +
              ',7 5,7 0,20 0,0');
          } else if (pw >= (w - 5)) {
            pre.attr('points', '0,0 ' + pw + ',0 ' + pw +
              ',20 ' + (w - 5) + ',7 5,7 0,20 0,0');
          }
        };

        if (data.package) {
          showPackage();
        } else {
          showTask();
        }
      });
    };

    configurable(task, config);

    return task;
  };
};

},{"./filterData":3,"./util/configurable":10}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}]},{},[6])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvYXBwLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2V2ZW50TGluZS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9maWx0ZXJEYXRhLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2ZpbHRlckxpbmUuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvbGVmdEJ0bi5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9tYWluLmpzIiwicHVibGljL2phdmFzY3JpcHRzL211SXRlbXMuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvcmlnaHRCdG4uanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvdGFzay5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy91dGlsL2NvbmZpZ3VyYWJsZS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy94QXhpcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xudmFyIGNvbmZpZ3VyYWJsZSA9IHJlcXVpcmUoJy4vdXRpbC9jb25maWd1cmFibGUnKTtcbnZhciB4QXhpc0ZhY3RvcnkgPSByZXF1aXJlKCcuL3hBeGlzJyk7XG52YXIgZmlsdGVyTGluZSA9IHJlcXVpcmUoJy4vZmlsdGVyTGluZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGQzKSB7XG4gIHZhciBldmVudExpbmUgPSByZXF1aXJlKCcuL2V2ZW50TGluZScpKGQzKTtcblxuICAvL+S4gOS6m+m7mOiupOeahOmFjee9rlxuICB2YXIgZGVmYXVsdENvbmZpZyA9IHtcbiAgICBuYW1lOiAncHJvamVjdCBtYW5hZ2VyJyxcbiAgICBzdGFydDogZDMudGltZS5kYXkobmV3IERhdGUoKSksXG4gICAgZW5kOiBkMy50aW1lLmRheS5vZmZzZXQoZDMudGltZS5kYXkobmV3IERhdGUoKSksIDcpLFxuICAgIG1pblNjYWxlOiAwLFxuICAgIG1heFNjYWxlOiAxMDAsXG4gICAgbWFyZ2luOiB7XG4gICAgICB0b3A6IDQ1LFxuICAgICAgbGVmdDogMCxcbiAgICAgIGJvdHRvbTogNDUsXG4gICAgICByaWdodDogMFxuICAgIH0sXG4gICAgdGlja0Zvcm1hdDogW1xuICAgICAgW1wiLiVMXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuZ2V0TWlsbGlzZWNvbmRzKCk7XG4gICAgICB9XSxcbiAgICAgIFtcIjolU1wiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLmdldFNlY29uZHMoKTtcbiAgICAgIH1dLFxuICAgICAgW1wiJUk6JU1cIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXRNaW51dGVzKCk7XG4gICAgICB9XSxcbiAgICAgIFtcIiVJICVwXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuZ2V0SG91cnMoKTtcbiAgICAgIH1dLFxuICAgICAgW1wiJWEgJWRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXREYXkoKSAmJiBkLmdldERhdGUoKSAhPSAxO1xuICAgICAgfV0sXG4gICAgICBbXCIlYiAlZFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLmdldERhdGUoKSAhPSAxO1xuICAgICAgfV0sXG4gICAgICBbXCIlQlwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLmdldE1vbnRoKCk7XG4gICAgICB9XSxcbiAgICAgIFtcIiVZXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1dXG4gICAgXSxcbiAgICB3aWR0aDogMTAwMFxuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiBhcHAoY29uZmlnKSB7XG4gICAgLy8gY29uc29sZS5sb2coY29uZmlnKTtcbiAgICB2YXIgeFNjYWxlID0gZDMudGltZS5zY2FsZSgpO1xuICAgIHZhciB5U2NhbGUgPSBkMy5zY2FsZS5vcmRpbmFsKCk7XG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIGZvciAodmFyIGtleSBpbiBkZWZhdWx0Q29uZmlnKSB7XG4gICAgICBjb25maWdba2V5XSA9IGNvbmZpZ1trZXldIHx8IGRlZmF1bHRDb25maWdba2V5XTtcbiAgICB9XG5cblxuXG4gICAgZnVuY3Rpb24gaW5pdChzZWxlY3Rpb24pIHtcblxuICAgICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgZ3JhcGhIZWlnaHQgPSAwO1xuICAgICAgICB2YXIgZ3JhcGhXaWR0aCA9IGNvbmZpZy53aWR0aDtcbiAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnNlbGVjdCgnc3ZnJykucmVtb3ZlKCk7XG5cbiAgICAgICAgdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpLnNjYWxlRXh0ZW50KFtjb25maWcubWluU2NhbGUsXG4gICAgICAgICAgICBjb25maWcubWF4U2NhbGVcbiAgICAgICAgICBdKVxuICAgICAgICAgIC5vbignem9vbXN0YXJ0Jywgem9vbXN0YXJ0KVxuICAgICAgICAgIC5vbihcInpvb21cIiwgdXBkYXRlWm9vbSlcbiAgICAgICAgICAub24oXCJ6b29tZW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3pvb21lbmQnKTtcbiAgICAgICAgICAgIC8vIHJlZHJhdyhmYWxzZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGRheXMgPSBkMy50aW1lLmRheXMoY29uZmlnLnN0YXJ0LCBjb25maWcuZW5kKTtcbiAgICAgICAgeFNjYWxlLnJhbmdlKFswLCBncmFwaFdpZHRoXSlcbiAgICAgICAgICAuZG9tYWluKFtjb25maWcuc3RhcnQsIGNvbmZpZy5lbmRdKVxuICAgICAgICAgIC5uaWNlKGQzLnRpbWUuZGF5KTtcbiAgICAgICAgem9vbS54KHhTY2FsZSk7XG4gICAgICAgIHpvb20uc2l6ZShbZ3JhcGhXaWR0aCwgZ3JhcGhIZWlnaHRdKTtcblxuXG5cbiAgICAgICAgZ3JhcGhIZWlnaHQgPSBkYXRhLmxlbmd0aCAqIDQwO1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLmxlbmd0aCArICfkuKrku7vliqEnKTtcbiAgICAgICAgdmFyIHN2ZyA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2FwcCcpXG4gICAgICAgICAgLmF0dHIoJ3dpZHRoJywgZ3JhcGhXaWR0aClcbiAgICAgICAgICAuYXR0cignaGVpZ2h0JywgZ3JhcGhIZWlnaHQpO1xuXG5cbiAgICAgICAgdmFyIGdyYXBoID0gc3ZnLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmF0dHIoJ2lkJywgJ2NvbnRhaW5lci1ib3gnKTtcblxuICAgICAgICB2YXIgeURvbWFpbiA9IFtdO1xuICAgICAgICB2YXIgeVJhbmdlID0gW107XG5cblxuICAgICAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24odGFzaywgaW5kZXgpIHtcbiAgICAgICAgICB5RG9tYWluLnB1c2godGFzay51dWlkKTtcbiAgICAgICAgICB5UmFuZ2UucHVzaChpbmRleCAqIDQwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgeVNjYWxlLmRvbWFpbih5RG9tYWluKS5yYW5nZSh5UmFuZ2UpO1xuXG5cbiAgICAgICAgdmFyIHlBeGlzRWwgPSBncmFwaC5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5jbGFzc2VkKCd5LWF4aXMgYXhpcycsIHRydWUpXG4gICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwgLTEpJylcbiAgICAgICAgICAuYXR0cignb3BhY2l0eScsICcwLjQnKTtcblxuICAgICAgICB2YXIgeVRpY2sgPSB5QXhpc0VsLmFwcGVuZCgnZycpLnNlbGVjdEFsbCgnZycpLmRhdGEoeURvbWFpbik7XG5cbiAgICAgICAgeVRpY2suZW50ZXIoKVxuICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgwLCAnICsgKHlTY2FsZShkKSAtIDEpICsgJyknO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgLmNsYXNzZWQoJ3ktdGljaycsIHRydWUpXG4gICAgICAgICAgLmF0dHIoXCJzdHJva2UtZGFzaGFycmF5XCIsIFwiMTAsIDEwXCIpXG4gICAgICAgICAgLmF0dHIoJ3gxJywgY29uZmlnLm1hcmdpbi5sZWZ0KVxuICAgICAgICAgIC5hdHRyKCd4MicsIGNvbmZpZy5tYXJnaW4ubGVmdCArIGdyYXBoV2lkdGgpO1xuXG4gICAgICAgIHlUaWNrLmV4aXQoKS5yZW1vdmUoKTtcblxuXG5cbiAgICAgICAgZnVuY3Rpb24gZHJhd1pvb20oKSB7XG4gICAgICAgICAgdmFyIGN1cngsIGN1cnk7XG4gICAgICAgICAgdmFyIHpvb21SZWN0ID0gZ3JhcGhcbiAgICAgICAgICAgIC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLmNhbGwoem9vbSlcbiAgICAgICAgICAgIC5jbGFzc2VkKCd6b29tJywgdHJ1ZSlcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGdyYXBoV2lkdGgpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgZ3JhcGhIZWlnaHQpXG4gICAgICAgICAgICAvLyAuYXR0cignZGlzcGxheScsICdub25lJylcbiAgICAgICAgICAgIC8vIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBjb25maWcubWFyZ2luLmxlZnQgK1xuICAgICAgICAgICAgLy8gICAnLCAzNSknKVxuICAgICAgICAgIDtcblxuICAgICAgICAgIC8vIGlmICh0eXBlb2YgY29uZmlnLmV2ZW50SG92ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAvLyAgIHpvb21SZWN0Lm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbihkLCBlKSB7XG4gICAgICAgICAgLy8gICAgIHZhciBldmVudCA9IGQzLmV2ZW50O1xuICAgICAgICAgIC8vICAgICBpZiAoY3VyeCA9PSBldmVudC5jbGllbnRYICYmIGN1cnkgPT0gZXZlbnQuY2xpZW50WSlcbiAgICAgICAgICAvLyAgICAgICByZXR1cm47XG4gICAgICAgICAgLy8gICAgIGN1cnggPSBldmVudC5jbGllbnRYO1xuICAgICAgICAgIC8vICAgICBjdXJ5ID0gZXZlbnQuY2xpZW50WTtcbiAgICAgICAgICAvLyAgICAgem9vbVJlY3QuYXR0cignZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgLy8gICAgIHZhciBlbCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZDMuZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAvLyAgICAgICBkMy5ldmVudC5jbGllbnRZKTtcbiAgICAgICAgICAvLyAgICAgem9vbVJlY3QuYXR0cignZGlzcGxheScsICdibG9jaycpO1xuICAgICAgICAgIC8vICAgICBpZiAoZWwudGFnTmFtZSAhPT0gJ2NpcmNsZScpIHJldHVybjtcbiAgICAgICAgICAvLyAgICAgY29uZmlnLmV2ZW50SG92ZXIoZWwpO1xuICAgICAgICAgIC8vICAgfSk7XG4gICAgICAgICAgLy8gfVxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gaWYgKHR5cGVvZiBjb25maWcuZXZlbnRDbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIC8vICAgem9vbVJlY3Qub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gICAgIHpvb21SZWN0LmF0dHIoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICAgIC8vICAgICB2YXIgZWwgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGQzLmV2ZW50LmNsaWVudFgsXG4gICAgICAgICAgLy8gICAgICAgZDNcbiAgICAgICAgICAvLyAgICAgICAuZXZlbnQuY2xpZW50WSk7XG4gICAgICAgICAgLy8gICAgIHpvb21SZWN0LmF0dHIoJ2Rpc3BsYXknLCAnYmxvY2snKTtcbiAgICAgICAgICAvLyAgICAgaWYgKGVsLnRhZ05hbWUgIT09ICdjaXJjbGUnKSByZXR1cm47XG4gICAgICAgICAgLy8gICAgIGNvbmZpZy5ldmVudENsaWNrKGVsKTtcbiAgICAgICAgICAvLyAgIH0pO1xuICAgICAgICAgIC8vIH1cbiAgICAgICAgICByZXR1cm4gem9vbVJlY3Q7XG4gICAgICAgIH1cbiAgICAgICAgZHJhd1pvb20oKTtcblxuXG5cbiAgICAgICAgZ3JhcGguc2VsZWN0KCcuZ3JhcGgtYm9keScpLnJlbW92ZSgpO1xuICAgICAgICB2YXIgZ3JhcGhCb2R5ID0gZ3JhcGhcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAuY2xhc3NlZCgnZ3JhcGgtYm9keScsIHRydWUpXG4gICAgICAgICAgLy8gLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIGNvbmZpZy5tYXJnaW4ubGVmdCArICcsICcgK1xuICAgICAgICAgIC8vICAgKGNvbmZpZy5tYXJnaW4udG9wIC0gMTUpICsgJyknKVxuICAgICAgICA7XG5cbiAgICAgICAgLy8gdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpLnNjYWxlRXh0ZW50KFtjb25maWcubWluU2NhbGUsXG4gICAgICAgIC8vICAgY29uZmlnLm1heFNjYWxlXG4gICAgICAgIC8vIF0pLm9uKFwiem9vbVwiLCB1cGRhdGVab29tKTtcbiAgICAgICAgdmFyIHRpbWVyID0gbnVsbDtcblxuICAgICAgICBmdW5jdGlvbiB6b29tc3RhcnQoKSB7XG4gICAgICAgICAgY29uZmlnLnNjYWxlID0gbnVsbDtcbiAgICAgICAgICBjb25maWcudHJhbnNsYXRlID0gbnVsbDtcbiAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICdbb2JqZWN0IFdoZWVsRXZlbnRdJykge1xuICAgICAgICAgICAgaWYgKCFkMy5ldmVudC5zb3VyY2VFdmVudC5hbHRLZXkpIHtcbiAgICAgICAgICAgICAgY29uZmlnLnNjYWxlID0gem9vbS5zY2FsZSgpO1xuICAgICAgICAgICAgICBjb25maWcudHJhbnNsYXRlID0gem9vbS50cmFuc2xhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVab29tKCkge1xuICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkM1xuICAgICAgICAgICAgLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09XG4gICAgICAgICAgICAnW29iamVjdCBNb3VzZUV2ZW50XScpIHtcbiAgICAgICAgICAgIHpvb20udHJhbnNsYXRlKFtkMy5ldmVudC50cmFuc2xhdGVbMF0sIDBdKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQuYWx0S2V5ICYmIGQzXG4gICAgICAgICAgICAuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICdbb2JqZWN0IFdoZWVsRXZlbnRdJykge1xuICAgICAgICAgICAgem9vbS5zY2FsZShkMy5ldmVudC5zY2FsZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjb25maWcuc2NhbGUgJiYgY29uZmlnLnRyYW5zbGF0ZSkge1xuICAgICAgICAgICAgem9vbS5zY2FsZShjb25maWcuc2NhbGUpO1xuICAgICAgICAgICAgem9vbS50cmFuc2xhdGUoY29uZmlnLnRyYW5zbGF0ZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aW1lcikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVkcmF3KGZhbHNlKTtcbiAgICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWRyYXcodHJ1ZSk7XG4gICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgfVxuXG5cblxuICAgICAgICAvLyB2YXIgbGluZXMgPSBncmFwaEJvZHkuc2VsZWN0QWxsKCdnJykuZGF0YShmdW5jdGlvbihkKSB7XG4gICAgICAgIC8vICAgcmV0dXJuIGZpbHRlckxpbmUoZCwgeVNjYWxlLCB0cnVlKTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGxpbmVzLmVudGVyKClcbiAgICAgICAgLy8gICAuYXBwZW5kKCdnJylcbiAgICAgICAgLy8gICAuY2xhc3NlZCgnbGluZScsIHRydWUpXG4gICAgICAgIC8vICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgLy8gICAgIHJldHVybiAndHJhbnNsYXRlKDAsJyArICh5U2NhbGUoZC5uYW1lKSkgKyAnKSc7XG4gICAgICAgIC8vICAgfSlcbiAgICAgICAgLy8gICAuc3R5bGUoJ2ZpbGwnLCBjb25maWcuZXZlbnRMaW5lQ29sb3IpO1xuICAgICAgICAvL1xuICAgICAgICAvLyBsaW5lcy5leGl0KCkucmVtb3ZlKCk7XG5cbiAgICAgICAgdmFyIGxpbmVzID0gbnVsbDtcbiAgICAgICAgbGluZXMgPSBncmFwaEJvZHkuc2VsZWN0QWxsKCdnJykuZGF0YShkYXRhKTtcblxuICAgICAgICBsaW5lcy5lbnRlcigpXG4gICAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmNsYXNzZWQoJ2xpbmUnLCB0cnVlKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgwLCcgKyAoeVNjYWxlKGQudXVpZCkpICsgJyknO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLnN0eWxlKCdmaWxsJywgY29uZmlnLmV2ZW50TGluZUNvbG9yKTtcblxuICAgICAgICBsaW5lcy5leGl0KCkucmVtb3ZlKCk7XG5cblxuICAgICAgICBmdW5jdGlvbiByZWRyYXcoZnVsbFJlZHJhdykge1xuICAgICAgICAgIHZhciBzdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgICAgICAgdmFyIHh0b3AgPSBkMy5zZWxlY3QoJyNoZWFkZXInKTtcbiAgICAgICAgICB4dG9wLnNlbGVjdCgnZycpLnJlbW92ZSgpO1xuICAgICAgICAgIHZhciB4QXhpc1RvcCA9IHhBeGlzRmFjdG9yeShkMywgY29uZmlnLCB4U2NhbGUsIHh0b3AsXG4gICAgICAgICAgICBncmFwaEhlaWdodCwgJ3RvcCcpO1xuXG4gICAgICAgICAgdmFyIHhib3R0b20gPSBkMy5zZWxlY3QoJyNmb290ZXInKTtcbiAgICAgICAgICB4Ym90dG9tLnNlbGVjdCgnZycpLnJlbW92ZSgpO1xuICAgICAgICAgIHZhciB4QXhpc0JvdHRvbSA9IHhBeGlzRmFjdG9yeShkMywgY29uZmlnLCB4U2NhbGUsIHhib3R0b20sXG4gICAgICAgICAgICBncmFwaEhlaWdodCwgJ2JvdHRvbScpO1xuXG4gICAgICAgICAgbGluZXMuY2FsbChldmVudExpbmUoe1xuICAgICAgICAgICAgbWFyZ2luOiBjb25maWcubWFyZ2luLFxuICAgICAgICAgICAgZ3JhcGhIZWlnaHQ6IGdyYXBoSGVpZ2h0LFxuICAgICAgICAgICAgeVNjYWxlOiB5U2NhbGUsXG4gICAgICAgICAgICB4U2NhbGU6IHhTY2FsZSxcbiAgICAgICAgICAgIGZ1bGxSZWRyYXc6IGZ1bGxSZWRyYXcsXG4gICAgICAgICAgICBldmVudENvbG9yOiBjb25maWcuZXZlbnRDb2xvcixcbiAgICAgICAgICAgIGNoYW5nZVRpbWVIYW5kbGVyOiBjb25maWcuY2hhbmdlVGltZUhhbmRsZXIsXG4gICAgICAgICAgICBjaGFuZ2VTdGFydFRpbWVIYW5kbGVyOiBjb25maWcuY2hhbmdlU3RhcnRUaW1lSGFuZGxlcixcbiAgICAgICAgICAgIGNoYW5nZUVuZFRpbWVIYW5kbGVyOiBjb25maWcuY2hhbmdlRW5kVGltZUhhbmRsZXIsXG4gICAgICAgICAgICBjaGFuZ2VQZXJjZW50SGFuZGxlcjogY29uZmlnLmNoYW5nZVBlcmNlbnRIYW5kbGVyXG4gICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgdmFyIGV0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ+mHjeeUu+aVtOS9kycgKyBmdWxsUmVkcmF3ICsgJz0nICsgKGV0IC0gc3QpICsgJ21zJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmVkcmF3KGZhbHNlKTtcblxuXG5cbiAgICAgIH0pO1xuICAgICAgbG9hZGVkKCk7XG4gICAgfVxuXG4gICAgY29uZmlndXJhYmxlKGluaXQsIGNvbmZpZyk7XG4gICAgcmV0dXJuIGluaXQ7XG4gIH07XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBkMyAqL1xuXG52YXIgY29uZmlndXJhYmxlID0gcmVxdWlyZSgnLi91dGlsL2NvbmZpZ3VyYWJsZScpO1xudmFyIGZpbHRlckRhdGEgPSByZXF1aXJlKCcuL2ZpbHRlckRhdGEnKTtcbnZhciBtdUZhY3RvcnkgPSByZXF1aXJlKCcuL211SXRlbXMnKTtcblxudmFyIGRlZmF1bHRDb25maWcgPSB7XG4gIHhTY2FsZTogbnVsbFxufTtcbnZhciBmb3JtYXRlciA9IGQzLnRpbWUuZm9ybWF0KFwiJVktJW0tJWQgJUg6JU06JVNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkMykge1xuICB2YXIgdGFzayA9IHJlcXVpcmUoJy4vdGFzaycpKGQzKTtcbiAgdmFyIGxlZnRCdG4gPSByZXF1aXJlKCcuL2xlZnRCdG4nKShkMyk7XG4gIHZhciByaWdodEJ0biA9IHJlcXVpcmUoJy4vcmlnaHRCdG4nKShkMyk7XG4gIHJldHVybiBmdW5jdGlvbihjb25maWcpIHtcbiAgICBjb25maWcgPSBjb25maWcgfHwge1xuICAgICAgeFNjYWxlOiBudWxsLFxuICAgICAgcmVkcmF3OiB0cnVlLFxuICAgICAgZXZlbnRDb2xvcjogbnVsbFxuICAgIH07XG4gICAgZm9yICh2YXIga2V5IGluIGRlZmF1bHRDb25maWcpIHtcbiAgICAgIGNvbmZpZ1trZXldID0gY29uZmlnW2tleV0gfHwgZGVmYXVsdENvbmZpZ1trZXldO1xuICAgIH1cbiAgICAvL+i/h+a7pOeUqFxuICAgIHZhciBzY3JvbGxUb3BPZmZzZXQgPSAkKCcjc2Nyb2xsZXInKS5vZmZzZXQoKS50b3A7XG4gICAgdmFyIHlNaW4gPSAwIC0gc2Nyb2xsVG9wT2Zmc2V0O1xuICAgIHZhciB5TWF4ID0gMCAtIHNjcm9sbFRvcE9mZnNldCArICQoJyN3cmFwcGVyJykuaGVpZ2h0KCkgKyA4MDtcbiAgICAvL+W9k+WJjemAieS4reeahOaYr+WTquS4gOS4quS7u+WKoVxuICAgIHZhciBzZWxlY3RlZFRhc2sgPSBudWxsO1xuICAgIHZhciB4U2NhbGUgPSBjb25maWcueFNjYWxlO1xuICAgIC8vXG4gICAgdmFyIGV2ZW50TGluZSA9IGZ1bmN0aW9uIGV2ZW50TGluZShzZWxlY3Rpb24pIHtcbiAgICAgIHNlbGVjdGlvbi5lYWNoKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIGxpbmVTdmcgPSBkMy5zZWxlY3QodGhpcyk7XG4gICAgICAgIGxpbmVTdmcuc2VsZWN0QWxsKCcuaXRlbScpLnJlbW92ZSgpO1xuICAgICAgICB2YXIgdGFza0JveCA9IGxpbmVTdmdcbiAgICAgICAgICAuc2VsZWN0QWxsKCcuaXRlbScpXG4gICAgICAgICAgLmRhdGEoZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckRhdGEoZC50YXNrcywgY29uZmlnLnhTY2FsZSwgY29uZmlnLnlTY2FsZSxcbiAgICAgICAgICAgICAgeU1pbiwgeU1heCwgY29uZmlnLmZ1bGxSZWRyYXcpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB2YXIgbW92ZUxpc3RlbmVyID0gZDMuYmVoYXZpb3Iuem9vbSgpLmNlbnRlcihudWxsKTtcblxuICAgICAgICAvL+WkhOeQhuaPkOekuuS/oeaBr1xuICAgICAgICB2YXIgdG9vbHRpcCA9IGQzLmhlbHBlci50b29sdGlwKClcbiAgICAgICAgICAucGFkZGluZygxNiwgMjUpXG4gICAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgdmFyIHggPSB0YXNrQm94LmF0dHIoJ3gnKTtcbiAgICAgICAgICAgIHZhciB0aW1lT25TY2FsZSA9IGNvbmZpZy54U2NhbGUuaW52ZXJ0KHgpO1xuICAgICAgICAgICAgdmFyIHN0YXQgPSBkLnN0YXR1cyA9PSAnZmluaXNoJyA/ICflroznu5MnIDogJ+i/m+ihjOS4rSc7XG4gICAgICAgICAgICB2YXIgaHRtbCA9IFtdO1xuICAgICAgICAgICAgaHRtbC5wdXNoKCc8aDE+JyArIGQubmFtZSArICc8L2gxPicpO1xuICAgICAgICAgICAgaHRtbC5wdXNoKCc8dWw+JylcbiAgICAgICAgICAgIGh0bWwucHVzaCgnPGxpIGNsYXNzPVwiaVwiPuW8gOWni+aXtumXtDogICcgKyBmb3JtYXRlcihkLnN0YXJ0RGF0ZSkgK1xuICAgICAgICAgICAgICAnPC9saT4nKVxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8bGkgY2xhc3M9XCJpXCI+57uT5p2f5pe26Ze0OiAgJyArIGZvcm1hdGVyKGQuZW5kRGF0ZSkgK1xuICAgICAgICAgICAgICAnPC9saT4nKVxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8bGkgY2xhc3M9XCJpXCI+5Lu75Yqh54q25oCBOiAgJyArIHN0YXQgKyAnPC9saT4nKVxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8bGkgY2xhc3M9XCJpXCI+6L+b5bqmOiAgJyArIChkLnBlcmNlbnQgfHwgMCkgKlxuICAgICAgICAgICAgICAxMDAgK1xuICAgICAgICAgICAgICAnJTwvbGk+JylcbiAgICAgICAgICAgIHJldHVybiBodG1sLmpvaW4oJycpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAvL+eUu+iPnOWNlVxuXG5cbiAgICAgICAgdmFyIGxlZnRCdG4sIHBlcmNlbnRCdG4sIHJpZ2h0QnRuO1xuICAgICAgICB2YXIgbGVmdE9mZkZpeCA9IC0xOSxcbiAgICAgICAgICByaWdodE9mZkZpeCA9IDU7IC8v55+p5b2i5YGP56e7XG4gICAgICAgIHZhciByZWRyYXdNZW51ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHRhc2sgPSB0YXNrQm94LmRhdGEoKVswXTtcbiAgICAgICAgICBpZiAodGFzayA9PSBudWxsIHx8IHdpbmRvdy5jb25maWcuc2VsZWN0SWQgIT0gdGFzay5uYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIC8v55uu5b2VXG4gICAgICAgICAgZDMuc2VsZWN0KCcuZ3JhcGgtYm9keScpLnNlbGVjdCgnLm1lbnUnKS5yZW1vdmUoKTtcbiAgICAgICAgICB2YXIgbWVudSA9IGxpbmVTdmcuYXBwZW5kKCdnJykuYXR0cignY2xhc3MnLCBcIm1lbnVcIik7XG4gICAgICAgICAgdmFyIHBlcmNlbnRMaXN0ZW5lciA9IGQzLmJlaGF2aW9yLnpvb20oKS5jZW50ZXIobnVsbCk7XG4gICAgICAgICAgdmFyIHN0YXJ0VGltZUxpc3RlbmVyID0gZDMuYmVoYXZpb3Iuem9vbSgpLmNlbnRlcihudWxsKTtcbiAgICAgICAgICB2YXIgZW5kVGltZUxpc3RlbmVyID0gZDMuYmVoYXZpb3Iuem9vbSgpLmNlbnRlcihudWxsKTtcbiAgICAgICAgICB2YXIgeCA9IGNvbmZpZy54U2NhbGUodGFzay5zdGFydERhdGUpO1xuICAgICAgICAgIHZhciB3ID0gY29uZmlnLnhTY2FsZSh0YXNrLmVuZERhdGUpIC0gY29uZmlnLnhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgbWVudS5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB4ICsgJywgMCknKTtcblxuICAgICAgICAgIC8v55m+5YiG5q+UXG4gICAgICAgICAgcGVyY2VudExpc3RlbmVyLm9uKCd6b29tc3RhcnQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgdGFzay5fcGVyY2VudCA9IHRhc2sucGVyY2VudCB8fCAwO1xuICAgICAgICAgICAgICB0YXNrLl94Q3VyciA9IGQzLmV2ZW50LnNvdXJjZUV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiem9vbXN0YXJ0OlwiICsgdGFzay5feEN1cnIpO1xuICAgICAgICAgICAgfSkub24oXCJ6b29tXCIsXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PVxuICAgICAgICAgICAgICAgICAgJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgY2xpZW50WCA9IGQzLmV2ZW50LnNvdXJjZUV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gY2xpZW50WCAtIHRhc2suX3hDdXJyO1xuICAgICAgICAgICAgICAgICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgICAgICAgICAgICAgICB2YXIgeE1pbiA9IDA7IC8vXG4gICAgICAgICAgICAgICAgICB2YXIgeE1heCA9IHc7XG4gICAgICAgICAgICAgICAgICB2YXIgeEN1cnIgPSB3ICogdGFzay5fcGVyY2VudCArIG9mZnNldDtcbiAgICAgICAgICAgICAgICAgIHhDdXJyID0gTWF0aC5taW4oeEN1cnIsIHhNYXgpO1xuICAgICAgICAgICAgICAgICAgeEN1cnIgPSBNYXRoLm1heCh4Q3VyciwgeE1pbik7XG4gICAgICAgICAgICAgICAgICB2YXIgX3BlcmNlbnQgPSAoeEN1cnIgLSB4TWluKSAvIHc7XG4gICAgICAgICAgICAgICAgICB0YXNrLnBlcmNlbnQgPSBNYXRoLnJvdW5kKF9wZXJjZW50ICogMTApIC8gMTBcbiAgICAgICAgICAgICAgICAgIHhDdXJyID0geE1pbiArIHcgKiB0YXNrLnBlcmNlbnQ7XG4gICAgICAgICAgICAgICAgICBwZXJjZW50QnRuLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKFwiICsgeEN1cnIgK1xuICAgICAgICAgICAgICAgICAgICBcIiwgMTkpIHJvdGF0ZSgwKVwiKVxuICAgICAgICAgICAgICAgICAgcmVkcmF3VGFzaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcInpvb21lbmRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJlZHJhd01lbnUoKTtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcuY2hhbmdlUGVyY2VudEhhbmRsZXIgPT09XG4gICAgICAgICAgICAgICAgJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5jaGFuZ2VQZXJjZW50SGFuZGxlcih0YXNrQm94LmRhdGEoKVswXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdmFyIHN0ZXBzID0gMDtcbiAgICAgICAgICBzdGFydFRpbWVMaXN0ZW5lci5vbignem9vbXN0YXJ0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHRhc2suX3N0YXJ0RGF0ZSA9IHRhc2suc3RhcnREYXRlO1xuICAgICAgICAgICAgICB0YXNrLl9lbmREYXRlID0gdGFzay5lbmREYXRlO1xuICAgICAgICAgICAgICB0YXNrLl9zdGVwcyA9IDA7XG4gICAgICAgICAgICAgIHRhc2suX3BlcmNlbnQgPSB0YXNrLnBlcmNlbnQgfHwgMDtcbiAgICAgICAgICAgICAgdGFzay5feEN1cnIgPSBkMy5ldmVudC5zb3VyY2VFdmVudC5jbGllbnRYO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInpvb21zdGFydDpcIiArIHRhc2suX3hDdXJyKTtcbiAgICAgICAgICAgIH0pLm9uKFwiem9vbVwiLFxuICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICAgICAgICdbb2JqZWN0IE1vdXNlRXZlbnRdJykge1xuICAgICAgICAgICAgICAgICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgICAgICAgICAgICAgICB2YXIgY2xpZW50WCA9IGQzLmV2ZW50LnNvdXJjZUV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gY2xpZW50WCAtIHRhc2suX3hDdXJyO1xuICAgICAgICAgICAgICAgICAgdmFyIG1heERhdGUgPSBkMy50aW1lLmRheS5vZmZzZXQodGFzay5fZW5kRGF0ZSwgLVxuICAgICAgICAgICAgICAgICAgICAxKTtcbiAgICAgICAgICAgICAgICAgIG9mZnNldCA9IE1hdGgubWluKG9mZnNldCwgKHhTY2FsZShtYXhEYXRlKSAtXG4gICAgICAgICAgICAgICAgICAgIHhTY2FsZSh0YXNrLl9zdGFydERhdGUpKSkgKyBsZWZ0T2ZmRml4O1xuICAgICAgICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICB2YXIgZGF5V2lkdGggPSB4U2NhbGUoZDMudGltZS5kYXkub2Zmc2V0KG5vdywgMSkpIC1cbiAgICAgICAgICAgICAgICAgICAgeFNjYWxlKG5vdyk7XG4gICAgICAgICAgICAgICAgICBzdGVwcyA9IE1hdGgucm91bmQob2Zmc2V0IC8gZGF5V2lkdGgpO1xuICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gc3RlcHMgKiBkYXlXaWR0aCArIGxlZnRPZmZGaXg7XG4gICAgICAgICAgICAgICAgICBsZWZ0QnRuLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKFwiICsgb2Zmc2V0ICtcbiAgICAgICAgICAgICAgICAgICAgXCIsIDEzKVwiKVxuICAgICAgICAgICAgICAgICAgdGFzay5zdGFydERhdGUgPSBkMy50aW1lLmRheS5vZmZzZXQodGFzay5fc3RhcnREYXRlLFxuICAgICAgICAgICAgICAgICAgICBzdGVwcyk7XG4gICAgICAgICAgICAgICAgICByZWRyYXdUYXNrKCk7XG4gICAgICAgICAgICAgICAgICB2YXIgeDEgPSBwZXJjZW50WCgpO1xuICAgICAgICAgICAgICAgICAgcGVyY2VudEJ0bi5hdHRyKFwieFwiLCB4MSk7XG4gICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgdyA9IHhTY2FsZSh0YXNrLmVuZERhdGUpIC0geFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgICAgICAgICAgIHZhciBtYXNrWCA9IHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgICAgICAgICBkcmF3TWFzayhtYXNrWCwgdyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcInpvb21lbmRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJlZHJhd01lbnUoKTtcbiAgICAgICAgICAgICAgY2xlYXJNYXNrKCk7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgY29uZmlnLmNoYW5nZVN0YXJ0VGltZUhhbmRsZXIgPT09XG4gICAgICAgICAgICAgICAgJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5jaGFuZ2VFbmRUaW1lSGFuZGxlcih0YXNrQm94LmRhdGEoKVswXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAvL+e7k+adn+aXtumXtOiwg+aVtOW8gOWni1xuICAgICAgICAgIGVuZFRpbWVMaXN0ZW5lci5vbignem9vbXN0YXJ0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHRhc2suX3N0YXJ0RGF0ZSA9IHRhc2suc3RhcnREYXRlO1xuICAgICAgICAgICAgICB0YXNrLl9lbmREYXRlID0gdGFzay5lbmREYXRlO1xuICAgICAgICAgICAgICB0YXNrLl9zdGVwcyA9IDA7XG4gICAgICAgICAgICAgIHRhc2suX3hDdXJyID0gZDMuZXZlbnQuc291cmNlRXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgICAgdGFzay5fd2lkdGggPSB4U2NhbGUodGFzay5lbmREYXRlKSAtIHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiem9vbXN0YXJ0OlwiICsgdGFzay5feEN1cnIpO1xuICAgICAgICAgICAgfSkub24oXCJ6b29tXCIsXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PVxuICAgICAgICAgICAgICAgICAgJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgeFNjYWxlID0gY29uZmlnLnhTY2FsZTtcbiAgICAgICAgICAgICAgICAgIHZhciBjbGllbnRYID0gZDMuZXZlbnQuc291cmNlRXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSBjbGllbnRYIC0gdGFzay5feEN1cnI7XG4gICAgICAgICAgICAgICAgICAvL+i/meS4quS7u+WKoeacieWHoOWkqVxuICAgICAgICAgICAgICAgICAgdmFyIGRheXMgPSBkMy50aW1lLmRheXModGFzay5fc3RhcnREYXRlLCB0YXNrLl9lbmREYXRlKTtcbiAgICAgICAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgdmFyIGRheVdpZHRoID0geFNjYWxlKGQzLnRpbWUuZGF5Lm9mZnNldChub3csIDEpKSAtXG4gICAgICAgICAgICAgICAgICAgIHhTY2FsZShub3cpO1xuICAgICAgICAgICAgICAgICAgc3RlcHMgPSBNYXRoLnJvdW5kKG9mZnNldCAvIGRheVdpZHRoKTtcbiAgICAgICAgICAgICAgICAgIHN0ZXBzID0gTWF0aC5tYXgoMCAtIGRheXMubGVuZ3RoICsgMSwgc3RlcHMpO1xuICAgICAgICAgICAgICAgICAgdmFyIHhDdXJyID0gdGFzay5fd2lkdGggKyByaWdodE9mZkZpeCArIHN0ZXBzICpcbiAgICAgICAgICAgICAgICAgICAgZGF5V2lkdGg7XG4gICAgICAgICAgICAgICAgICByaWdodEJ0bi5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB4Q3VyciArXG4gICAgICAgICAgICAgICAgICAgICcsIDEzKScpO1xuICAgICAgICAgICAgICAgICAgdGFzay5lbmREYXRlID0gZDMudGltZS5kYXkub2Zmc2V0KHRhc2suX2VuZERhdGUsXG4gICAgICAgICAgICAgICAgICAgIHN0ZXBzKTtcbiAgICAgICAgICAgICAgICAgIHJlZHJhd1Rhc2soKTtcbiAgICAgICAgICAgICAgICAgIHZhciB3ID0geFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpO1xuICAgICAgICAgICAgICAgICAgZHJhd01hc2soeFNjYWxlKHRhc2suc3RhcnREYXRlKSwgdyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcInpvb21lbmRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJlZHJhd01lbnUoKTtcbiAgICAgICAgICAgICAgY2xlYXJNYXNrKCk7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgY29uZmlnLmNoYW5nZUVuZFRpbWVIYW5kbGVyID09PVxuICAgICAgICAgICAgICAgICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuY2hhbmdlRW5kVGltZUhhbmRsZXIodGFza0JveC5kYXRhKClbMF0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8v57uT5p2f5pe26Ze06LCD5pW057uT5p2fXG5cblxuICAgICAgICAgIGxlZnRCdG4gPSBtdUZhY3RvcnkoZDMsIGNvbmZpZywgbWVudSwgJ2xlZnRCdG4nKTtcbiAgICAgICAgICByaWdodEJ0biA9IG11RmFjdG9yeShkMywgY29uZmlnLCBtZW51LCAncmlnaHRCdG4nKTtcbiAgICAgICAgICBwZXJjZW50QnRuID0gbXVGYWN0b3J5KGQzLCBjb25maWcsIG1lbnUsICdwZXJjZW50QnRuJyk7XG4gICAgICAgICAgdmFyIHJpZ2h0WCA9IHcgKyByaWdodE9mZkZpeDtcbiAgICAgICAgICB2YXIgcHggPSAoKHcgKiB0YXNrLnBlcmNlbnQgfHwgMCkpO1xuICAgICAgICAgIGxlZnRCdG4uYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoXCIgKyBsZWZ0T2ZmRml4ICtcbiAgICAgICAgICAgIFwiLCAxMylcIikuY2FsbChzdGFydFRpbWVMaXN0ZW5lcik7XG4gICAgICAgICAgcmlnaHRCdG4uYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoXCIgKyByaWdodFggK1xuICAgICAgICAgICAgXCIsIDEzKVwiKS5jYWxsKGVuZFRpbWVMaXN0ZW5lcik7XG4gICAgICAgICAgcGVyY2VudEJ0bi5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZShcIiArIHB4ICtcbiAgICAgICAgICAgIFwiLCAxOSlcIikuY2FsbChwZXJjZW50TGlzdGVuZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBlcmNlbnRYID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHRhc2sgPSB0YXNrQm94LmRhdGEoKVswXTtcbiAgICAgICAgICB2YXIgeCA9IDA7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2cobGVmdEJ0bi5hdHRyKCd4JykpO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHJpZ2h0QnRuLmF0dHIoJ3gnKSk7XG4gICAgICAgICAgLy8gdmFyIGxlZnQgPSBwYXJzZUZsb2F0KGxlZnRCdG4uYXR0cigneCcpKSArIDEwO1xuICAgICAgICAgIC8vIHZhciByaWdodCA9IHBhcnNlRmxvYXQocmlnaHRCdG4uYXR0cigneCcpKSAtIDEwO1xuICAgICAgICAgIC8vIHggPSBsZWZ0ICsgKHJpZ2h0IC0gbGVmdCkgKiAodGFzay5wZXJjZW50IHx8IDApO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdsZWZ0PScgKyBsZWZ0ICsgJ1xcdD0nICsgcmlnaHQgKyAnXFx0JyArIHgpO1xuICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLy9jbGlja1xuICAgICAgICB2YXIgY3VyeCwgY3VyeTtcbiAgICAgICAgdmFyIGNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBldmVudCA9IGQzLmV2ZW50O1xuICAgICAgICAgIGlmIChjdXJ4ID09IGV2ZW50LmNsaWVudFggJiYgY3VyeSA9PSBldmVudC5jbGllbnRZKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIGN1cnggPSBldmVudC5jbGllbnRYO1xuICAgICAgICAgIGN1cnkgPSBldmVudC5jbGllbnRZO1xuICAgICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZDMuZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIGQzLmV2ZW50LmNsaWVudFkpO1xuICAgICAgICAgIHZhciB0YXNrQm94ID0gZDMuc2VsZWN0KGVsKTtcbiAgICAgICAgICBpZiAodGFza0JveCkge1xuICAgICAgICAgICAgLy8gcmVkcmF3TWVudSgpO1xuICAgICAgICAgICAgdmFyIHRhc2sgPSB0YXNrQm94LmRhdGEoKVswXTtcbiAgICAgICAgICAgIHdpbmRvdy5jb25maWcuc2VsZWN0SWQgPSB0YXNrLm5hbWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZHJhd01lbnUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8v55S76KGMXG4gICAgICAgIHZhciByZWRyYXdUYXNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ+mHjeeUu+S7u+WKoScpO1xuICAgICAgICAgIGxpbmVTdmcuc2VsZWN0QWxsKCcuaXRlbScpLnJlbW92ZSgpO1xuICAgICAgICAgIHRhc2tCb3guZW50ZXIoKVxuICAgICAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgICAgICAub24oJ2NsaWNrJywgY2xpY2tIYW5kbGVyKVxuICAgICAgICAgICAgLmNhbGwobW92ZUxpc3RlbmVyKVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgY29uZmlnLmV2ZW50Q29sb3IpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCBcIml0ZW1cIilcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyBjb25maWcueFNjYWxlKGQuc3RhcnREYXRlKSArXG4gICAgICAgICAgICAgICAgJywgMTMpJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCAyMClcbiAgICAgICAgICAgIC5vbignbW91c2VvdmVyJywgdG9vbHRpcC5tb3VzZW92ZXIpXG4gICAgICAgICAgICAub24oJ21vdXNlb3V0JywgdG9vbHRpcC5tb3VzZW91dClcbiAgICAgICAgICAgIC5vbignbW91c2Vtb3ZlJywgdG9vbHRpcC5tb3VzZW1vdmUpXG4gICAgICAgICAgICAuY2FsbCh0YXNrKHtcbiAgICAgICAgICAgICAgeFNjYWxlOiBjb25maWcueFNjYWxlLFxuICAgICAgICAgICAgICBldmVudENvbG9yOiBjb25maWcuZXZlbnRDb2xvclxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIHRhc2tCb3guZXhpdCgpLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJlZHJhd1Rhc2soKTtcblxuICAgICAgICAvL+eCueWHu+S7u+WKoeWQjuaYvuekuuS7u+WKoeeahOiwg+aVtOaooeW8j1xuICAgICAgICByZWRyYXdNZW51KCk7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgICAgICB2YXIgZHJhd01hc2sgPSBmdW5jdGlvbih4LCB3KSB7XG4gICAgICAgICAgdmFyIGJveCA9IGQzLnNlbGVjdCgnI2NvbnRhaW5lci1ib3gnKTtcbiAgICAgICAgICBib3guc2VsZWN0KCcubGxpbmUnKS5yZW1vdmUoKTtcbiAgICAgICAgICB2YXIgZyA9IGJveC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLy8gLmF0dHIoJ29wYWNpdHknLCAnMC40JylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdsbGluZScpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgeCArICcsIDApJyk7XG4gICAgICAgICAgZy5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgXCIjMGNjXCIpXG4gICAgICAgICAgICAuYXR0cignb3BhY2l0eScsICcwLjEnKVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGNvbmZpZy5ncmFwaEhlaWdodClcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIHcpXG5cbiAgICAgICAgICBnLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgICAuYXR0cigneDEnLCAwKVxuICAgICAgICAgICAgLmF0dHIoJ3kxJywgY29uZmlnLm1hcmdpbi50b3AgLSA0MClcbiAgICAgICAgICAgIC5hdHRyKCd4MicsIDApXG4gICAgICAgICAgICAuYXR0cigneTInLCBjb25maWcuZ3JhcGhIZWlnaHQgKyA0MCk7XG5cbiAgICAgICAgICBnLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgICAuYXR0cigneDEnLCB3KVxuICAgICAgICAgICAgLmF0dHIoJ3kxJywgY29uZmlnLm1hcmdpbi50b3AgLSA0MClcbiAgICAgICAgICAgIC5hdHRyKCd4MicsIHcpXG4gICAgICAgICAgICAuYXR0cigneTInLCBjb25maWcuZ3JhcGhIZWlnaHQgKyA0MCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2xlYXJNYXNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGJveCA9IGQzLnNlbGVjdCgnI2NvbnRhaW5lci1ib3gnKTtcbiAgICAgICAgICBib3guc2VsZWN0KCcubGxpbmUnKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWkhOeQhuS7u+WKoeW3puWPs+enu+WKqOeahOmXrumimFxuICAgICAgICBtb3ZlTGlzdGVuZXIub24oXCJ6b29tXCIsXG4gICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICAgJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZDMuZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgICBkMy5ldmVudC5jbGllbnRZKTtcbiAgICAgICAgICAgICAgdmFyIHggPSAwLFxuICAgICAgICAgICAgICAgIHcgPSAwO1xuICAgICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgICAgICAgdGFza0JveC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgICAgICAgICAgICAgdyA9IHhTY2FsZShkLmVuZERhdGUpIC0geFNjYWxlKGQuc3RhcnREYXRlKTtcbiAgICAgICAgICAgICAgICB4ID0geFNjYWxlKGQuc3RhcnREYXRlKSArIGQzLmV2ZW50LnRyYW5zbGF0ZVtcbiAgICAgICAgICAgICAgICAgIDBdOyAvL+enu+WKqOWQjueahOi3neemu1xuICAgICAgICAgICAgICAgIHZhciBkYXRlVGltZSA9IHhTY2FsZS5pbnZlcnQoeCk7IC8v6L2s5o2i5oiQ5paw55qE5pe26Ze0XG4gICAgICAgICAgICAgICAgdmFyIGRhdGUgPSBkMy50aW1lLmRheShkYXRlVGltZSk7IC8v5a+55pe26Ze06L+b6KGM5Y+W5pW0XG4gICAgICAgICAgICAgICAgeCA9IHhTY2FsZShkYXRlKTsgLy/ml7bpl7Tlj5bmlbTlkI7nmoTot53nprtcbiAgICAgICAgICAgICAgICBkLnN0YXJ0RGF0ZSA9IGRhdGU7XG4gICAgICAgICAgICAgICAgZC5lbmREYXRlID0geFNjYWxlLmludmVydCh4ICsgdyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHggKyAnLCAxMyknO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmVkcmF3TWVudSgpO1xuICAgICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgICAgICAgZHJhd01hc2soeCwgdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSkub24oXCJ6b29tZW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBib3ggPSBkMy5zZWxlY3QoJyNjb250YWluZXItYm94Jyk7XG4gICAgICAgICAgYm94LnNlbGVjdCgnLmxsaW5lJykucmVtb3ZlKCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcuY2hhbmdlVGltZUhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNvbmZpZy5jaGFuZ2VUaW1lSGFuZGxlcih0YXNrQm94LmRhdGEoKVswXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgY29uZmlndXJhYmxlKGV2ZW50TGluZSwgY29uZmlnKTtcbiAgICByZXR1cm4gZXZlbnRMaW5lO1xuICB9O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIG1vZHVsZSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZpbHRlckRhdGUoZGF0YSwgeFNjYWxlLCB5U2NhbGUsIHlNaW4sIHlNYXgsXG4gIGZ1bGxSZWRyYXcpIHtcbiAgZGF0YSA9IGRhdGEgfHwgW107XG4gIHZhciBmaWx0ZXJlZERhdGEgPSBbXTtcbiAgdmFyIGJvdW5kYXJ5ID0geFNjYWxlLnJhbmdlKCk7XG4gIHZhciBtaW4gPSBib3VuZGFyeVswXTtcbiAgdmFyIG1heCA9IGJvdW5kYXJ5WzFdO1xuICBkYXRhLmZvckVhY2goZnVuY3Rpb24oZGF0dW0pIHtcbiAgICB2YXIgc3RhcnQgPSB4U2NhbGUoZGF0dW0uc3RhcnREYXRlKTtcbiAgICB2YXIgZW5kID0geFNjYWxlKGRhdHVtLmVuZERhdGUpO1xuICAgIHZhciB5ID0geVNjYWxlKGRhdHVtLnV1aWQpO1xuICAgIGlmIChlbmQgPCBtaW4gfHwgc3RhcnQgPiBtYXgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFmdWxsUmVkcmF3ICYmICh5IDwgeU1pbiB8fCB5ID4geU1heCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZmlsdGVyZWREYXRhLnB1c2goZGF0dW0pO1xuICB9KTtcbiAgcmV0dXJuIGZpbHRlcmVkRGF0YTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCBtb2R1bGUgKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmaWx0ZXJEYXRlKGRhdGEsIHNjYWxlLCBsaXRlKSB7XG4gIGRhdGEgPSBkYXRhIHx8IFtdO1xuICB2YXIgZmlsdGVyZWREYXRhID0gW107XG4gIHZhciBvZmZzZXQgPSAkKCcjc2Nyb2xsZXInKS5vZmZzZXQoKS50b3A7XG4gIHZhciB5TWluID0gMCAtIG9mZnNldDtcbiAgdmFyIHlNYXggPSAwIC0gb2Zmc2V0ICsgJCgnI3dyYXBwZXInKS5oZWlnaHQoKTtcbiAgdmFyIGNvdW50ID0gMDtcbiAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAvLyBpZiAobGl0ZSkge1xuICAgIC8vICAgdmFyIG5hbWUgPSBkLm5hbWU7XG4gICAgLy8gICB2YXIgeSA9IHNjYWxlKG5hbWUpO1xuICAgIC8vICAgY29uc29sZS5sb2coW3ksIHlNaW4sIHlNYXhdLmpvaW4oJywnKSlcbiAgICAvLyAgIHZhciBfZCA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkKTtcbiAgICAvLyAgIGlmICh5IDwgeU1pbiB8fCB5ID4geU1heCkge1xuICAgIC8vICAgICBfZC50YXNrcy5sZW5ndGggPSAwO1xuICAgIC8vICAgfSBlbHNlIHtcbiAgICAvLyAgICAgY291bnQrKztcbiAgICAvLyAgIH1cbiAgICAvLyAgIGZpbHRlcmVkRGF0YS5wdXNoKF9kKTtcbiAgICAvLyB9IGVsc2Uge1xuICAgIGZpbHRlcmVkRGF0YS5wdXNoKGQpO1xuICAgIC8vIH1cbiAgfSk7XG4gIGNvbnNvbGUubG9nKCdjb3VudD09PScgKyBjb3VudCk7XG5cbiAgcmV0dXJuIGZpbHRlcmVkRGF0YTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCByZXF1aXJlLCBtb2R1bGUsIGQzICovXG5cbnZhciBjb25maWd1cmFibGUgPSByZXF1aXJlKCcuL3V0aWwvY29uZmlndXJhYmxlJyk7XG52YXIgZmlsdGVyRGF0YSA9IHJlcXVpcmUoJy4vZmlsdGVyRGF0YScpO1xuXG52YXIgZGVmYXVsdENvbmZpZyA9IHtcbiAgeFNjYWxlOiBudWxsXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGQzKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb25maWcpIHtcblxuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7XG4gICAgICB4U2NhbGU6IG51bGwsXG4gICAgICB5U2NhbGU6IG51bGxcbiAgICB9O1xuICAgIGZvciAodmFyIGtleSBpbiBkZWZhdWx0Q29uZmlnKSB7XG4gICAgICBjb25maWdba2V5XSA9IGNvbmZpZ1trZXldIHx8IGRlZmF1bHRDb25maWdba2V5XTtcbiAgICB9XG4gICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgdmFyIGxlZnRCdG4gPSBmdW5jdGlvbiBsZWZ0QnRuKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCcubGVmdEJ0bicpLnJlbW92ZSgpO1xuICAgICAgICB2YXIgbGVmdExpbmUgPSBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoLTE5LCAxMylcIilcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnYnRuIGxlZnRCdG4nKTtcbiAgICAgICAgbGVmdExpbmUuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgICAuYXR0cignZCcsXG4gICAgICAgICAgICAnTSAwIDAgTCAxMSAwIHEgLTIgMiAtMiA3IEwgMTEgMTEgTCAgMCAxMSB6JylcbiAgICAgICAgICAuYXR0cignc3Ryb2tlJywgJyM4ODgnKVxuICAgICAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAnMScpXG4gICAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnIzFmOTZkOCcpXG4gICAgICAgIGxlZnRMaW5lLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgLmF0dHIoJ3gxJywgJzMnKVxuICAgICAgICAgIC5hdHRyKCd5MScsICcyJylcbiAgICAgICAgICAuYXR0cigneDInLCAnMycpXG4gICAgICAgICAgLmF0dHIoJ3kyJywgJzknKVxuICAgICAgICAgIC5hdHRyKCdmaWxsJywgJ3doaXRlJylcbiAgICAgICAgbGVmdExpbmUuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgICAuYXR0cigneDEnLCAnNicpXG4gICAgICAgICAgLmF0dHIoJ3kxJywgJzInKVxuICAgICAgICAgIC5hdHRyKCd4MicsICc2JylcbiAgICAgICAgICAuYXR0cigneTInLCAnOScpXG4gICAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbmZpZ3VyYWJsZShsZWZ0QnRuLCBjb25maWcpO1xuXG4gICAgcmV0dXJuIGxlZnRCdG47XG4gIH07XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBhcHAgPSByZXF1aXJlKCcuL2FwcCcpO1xuXG5pZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgZGVmaW5lKCdkMy5jaGFydC5hcHAnLCBbXCJkM1wiXSwgZnVuY3Rpb24oZDMpIHtcbiAgICBkMy5jaGFydCA9IGQzLmNoYXJ0IHx8IHt9O1xuICAgIGQzLmNoYXJ0LmFwcCA9IGFwcChkMyk7XG4gIH0pO1xufSBlbHNlIGlmICh3aW5kb3cpIHtcbiAgd2luZG93LmQzLmNoYXJ0ID0gd2luZG93LmQzLmNoYXJ0IHx8IHt9O1xuICB3aW5kb3cuZDMuY2hhcnQuYXBwID0gYXBwKHdpbmRvdy5kMyk7XG59IGVsc2Uge1xuICBtb2R1bGUuZXhwb3J0cyA9IGFwcDtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZDMsIGNvbmZpZywgZ3JhcGgsIHdoZXJlKSB7XG5cblxuICB2YXIgaXRlbXMgPSB7fTtcblxuICB2YXIgYnVpbGRMZWZ0ID0gZnVuY3Rpb24oKSB7XG4gICAgaXRlbXNbJ2xlZnRCdG4nXSA9IGdyYXBoLnNlbGVjdEFsbCgnLmxlZnRCdG4nKS5yZW1vdmUoKTtcbiAgICB2YXIgbGVmdExpbmUgPSBncmFwaFxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoMCwgMTMpXCIpXG4gICAgICAuYXR0cignY2xhc3MnLCAnYnRuIGxlZnRCdG4nKTtcbiAgICBsZWZ0TGluZS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2QnLFxuICAgICAgICAnTSAwIDAgTCAxMSAwIHEgLTIgMiAtMiA3IEwgMTEgMTEgTCAgMCAxMSB6JylcbiAgICAgIC5hdHRyKCdzdHJva2UnLCAnIzg4OCcpXG4gICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgJzEnKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnIzFmOTZkOCcpXG4gICAgbGVmdExpbmUuYXBwZW5kKCdsaW5lJylcbiAgICAgIC5hdHRyKCd4MScsICczJylcbiAgICAgIC5hdHRyKCd5MScsICcyJylcbiAgICAgIC5hdHRyKCd4MicsICczJylcbiAgICAgIC5hdHRyKCd5MicsICc5JylcbiAgICAgIC5hdHRyKCdmaWxsJywgJ3doaXRlJylcbiAgICBsZWZ0TGluZS5hcHBlbmQoJ2xpbmUnKVxuICAgICAgLmF0dHIoJ3gxJywgJzYnKVxuICAgICAgLmF0dHIoJ3kxJywgJzInKVxuICAgICAgLmF0dHIoJ3gyJywgJzYnKVxuICAgICAgLmF0dHIoJ3kyJywgJzknKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgIHJldHVybiBsZWZ0TGluZTtcbiAgfVxuXG5cbiAgdmFyIGJ1aWxkUmlnaHQgPSBmdW5jdGlvbigpIHtcbiAgICBpdGVtc1sncmlnaHRCdG4nXSA9IGdyYXBoLnNlbGVjdEFsbCgnLnJpZ2h0QnRuJykucmVtb3ZlKCk7XG4gICAgdmFyIHJpZ2h0QnRuID0gZ3JhcGhcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKDAsIDEzKVwiKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2J0biByaWdodEJ0bicpO1xuICAgIHJpZ2h0QnRuLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignZCcsXG4gICAgICAgICdNIDAgMCAgcSAyIDIgMiA4ICBMICAwIDExICBMIDExIDExIEwgMTEgMCB6JylcbiAgICAgIC5hdHRyKCdzdHJva2UnLCAnIzg4OCcpXG4gICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgJzEnKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnIzFmOTZkOCcpXG4gICAgcmlnaHRCdG4uYXBwZW5kKCdsaW5lJylcbiAgICAgIC5hdHRyKCd4MScsICc1JylcbiAgICAgIC5hdHRyKCd5MScsICcyJylcbiAgICAgIC5hdHRyKCd4MicsICc1JylcbiAgICAgIC5hdHRyKCd5MicsICc5JylcbiAgICAgIC5hdHRyKCdmaWxsJywgJ3doaXRlJylcbiAgICByaWdodEJ0bi5hcHBlbmQoJ2xpbmUnKVxuICAgICAgLmF0dHIoJ3gxJywgJzgnKVxuICAgICAgLmF0dHIoJ3kxJywgJzInKVxuICAgICAgLmF0dHIoJ3gyJywgJzgnKVxuICAgICAgLmF0dHIoJ3kyJywgJzknKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgIHJldHVybiByaWdodEJ0bjtcbiAgfVxuXG4gIHZhciBidWlsZFBlcmNlbnQgPSBmdW5jdGlvbigpIHtcbiAgICBpdGVtc1sncGVyY2VudEJ0biddID0gZ3JhcGguc2VsZWN0QWxsKCcucGVyY2VudEJ0bicpLnJlbW92ZSgpO1xuICAgIHZhciBwZXJjZW50QnRuID0gZ3JhcGhcbiAgICAgIC5hcHBlbmQoJ3BvbHlsaW5lJylcbiAgICAgIC5hdHRyKCdzdHJva2UnLCBcIiNhMGEwYTBcIilcbiAgICAgIC5hdHRyKCdjbGFzcycsIFwicGVyY2VudEJ0blwiKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwgMTgpJylcbiAgICAgIC5hdHRyKCdwb2ludHMnLCAnMCwwIDYsNyA2LDEzLCAtNiwxMyAtNiw3IDAsMCcpXG4gICAgICAuYXR0cignc3R5bGUnLCAnZmlsbDp3aGl0ZTtzdHJva2Utd2lkdGg6MScpXG4gICAgcmV0dXJuIHBlcmNlbnRCdG47XG4gIH1cblxuICB2YXIgZHJhd1hBeGlzID0gZnVuY3Rpb24gZHJhd1hBeGlzKCkge1xuICAgIC8vIGNvbnNvbGUubG9nKCd3aGVyZT09PScgKyB3aGVyZSk7XG4gICAgc3dpdGNoICh3aGVyZSkge1xuICAgICAgY2FzZSAnbGVmdEJ0bic6XG4gICAgICAgIHJldHVybiBidWlsZExlZnQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdyaWdodEJ0bic6XG4gICAgICAgIHJldHVybiBidWlsZFJpZ2h0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncGVyY2VudEJ0bic6XG4gICAgICAgIHJldHVybiBidWlsZFBlcmNlbnQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuXG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBkcmF3WEF4aXMoKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCByZXF1aXJlLCBtb2R1bGUsIGQzICovXG5cbnZhciBjb25maWd1cmFibGUgPSByZXF1aXJlKCcuL3V0aWwvY29uZmlndXJhYmxlJyk7XG52YXIgZmlsdGVyRGF0YSA9IHJlcXVpcmUoJy4vZmlsdGVyRGF0YScpO1xuXG52YXIgZGVmYXVsdENvbmZpZyA9IHtcbiAgeFNjYWxlOiBudWxsXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGQzKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb25maWcpIHtcblxuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7XG4gICAgICB4U2NhbGU6IG51bGwsXG4gICAgICB5U2NhbGU6IG51bGxcbiAgICB9O1xuICAgIGZvciAodmFyIGtleSBpbiBkZWZhdWx0Q29uZmlnKSB7XG4gICAgICBjb25maWdba2V5XSA9IGNvbmZpZ1trZXldIHx8IGRlZmF1bHRDb25maWdba2V5XTtcbiAgICB9XG4gICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgdmFyIHJpZ2h0QnRuID0gZnVuY3Rpb24gcmlnaHRCdG4oc2VsZWN0aW9uKSB7XG4gICAgICBzZWxlY3Rpb24uZWFjaChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zZWxlY3RBbGwoJy5yaWdodEJ0bicpLnJlbW92ZSgpO1xuICAgICAgICB2YXIgbGVmdExpbmUgPSBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoLTE5LCAxMylcIilcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnYnRuIHJpZ2h0QnRuJyk7XG4gICAgICAgIGxlZnRMaW5lLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgLmF0dHIoJ2QnLFxuICAgICAgICAgICAgJ00gMCAwIEwgMTEgMCBxIC0yIDIgLTIgNyBMIDExIDExIEwgIDAgMTEgeicpXG4gICAgICAgICAgLmF0dHIoJ3N0cm9rZScsICcjODg4JylcbiAgICAgICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgJzEnKVxuICAgICAgICAgIC5hdHRyKCdmaWxsJywgJyMxZjk2ZDgnKVxuICAgICAgICBsZWZ0TGluZS5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgIC5hdHRyKCd4MScsICczJylcbiAgICAgICAgICAuYXR0cigneTEnLCAnMicpXG4gICAgICAgICAgLmF0dHIoJ3gyJywgJzMnKVxuICAgICAgICAgIC5hdHRyKCd5MicsICc5JylcbiAgICAgICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgICAgIGxlZnRMaW5lLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgLmF0dHIoJ3gxJywgJzYnKVxuICAgICAgICAgIC5hdHRyKCd5MScsICcyJylcbiAgICAgICAgICAuYXR0cigneDInLCAnNicpXG4gICAgICAgICAgLmF0dHIoJ3kyJywgJzknKVxuICAgICAgICAgIC5hdHRyKCdmaWxsJywgJ3doaXRlJylcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25maWd1cmFibGUocmlnaHRCdG4sIGNvbmZpZyk7XG5cbiAgICByZXR1cm4gcmlnaHRCdG47XG4gIH07XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBkMyAqL1xuXG52YXIgY29uZmlndXJhYmxlID0gcmVxdWlyZSgnLi91dGlsL2NvbmZpZ3VyYWJsZScpO1xudmFyIGZpbHRlckRhdGEgPSByZXF1aXJlKCcuL2ZpbHRlckRhdGEnKTtcblxudmFyIGRlZmF1bHRDb25maWcgPSB7XG4gIHhTY2FsZTogbnVsbFxufTtcblxudmFyIGZvcm1hdGVyID0gZDMudGltZS5mb3JtYXQoXCIlWS0lbS0lZCAlSDolTTolU1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGQzKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb25maWcpIHtcblxuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7XG4gICAgICB4U2NhbGU6IG51bGwsXG4gICAgICB5U2NhbGU6IG51bGxcbiAgICB9O1xuICAgIGZvciAodmFyIGtleSBpbiBkZWZhdWx0Q29uZmlnKSB7XG4gICAgICBjb25maWdba2V5XSA9IGNvbmZpZ1trZXldIHx8IGRlZmF1bHRDb25maWdba2V5XTtcbiAgICB9XG4gICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgdmFyIHRhc2sgPSBmdW5jdGlvbiB0YXNrKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ+eUu+S7u+WKoScpO1xuICAgICAgICAvLyDnn6nlvaLmmL7npLrmlrnmoYhcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IGQzLnNlbGVjdCh0aGlzKTtcbiAgICAgICAgY29udGFpbmVyLnNlbGVjdEFsbCgnLnRhc2snKS5yZW1vdmUoKTtcblxuICAgICAgICB2YXIgc2hvd1Rhc2sgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgIHZhciBmaWxsQ29sb3IgPSBcIiMwY2NcIjtcbiAgICAgICAgICBpZiAoZGF0YS5lbmREYXRlIDwgbmV3IERhdGUoKSkge1xuICAgICAgICAgICAgZmlsbENvbG9yID0gJ3JlZCc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGJhY2tncm91bmQgPSBjb250YWluZXIuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIFwidHJhbnNwYXJlbnRcIilcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwidGFzayBiYWNrZ3JvdW5kXCIpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgMTApXG4gICAgICAgICAgICAuYXR0cigncngnLCA0KVxuICAgICAgICAgICAgLmF0dHIoJ3J5JywgNClcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCBcIiNhMGEwYTBcIilcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAxKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGRhdGEuZW5kRGF0ZSArICdcXHQnICsgZGF0YS5zdGFydERhdGUgK1xuICAgICAgICAgICAgICAvLyAgICdcXHQnICsgKHhTY2FsZShkYXRhLmVuZERhdGUpIC0geFNjYWxlKGRhdGEuc3RhcnREYXRlKSlcbiAgICAgICAgICAgICAgLy8gKTtcbiAgICAgICAgICAgICAgcmV0dXJuICh4U2NhbGUoZGF0YS5lbmREYXRlKSAtIHhTY2FsZShkYXRhLnN0YXJ0RGF0ZSkpXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIHZhciBwcmUgPSBjb250YWluZXIuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIFwiIzZkZjNkMlwiKVxuICAgICAgICAgICAgLmF0dHIoJ3N0cm9rZScsIFwiI2EwYTBhMFwiKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgXCJ0YXNrIHByZVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKDAsIDAuNSlcIilcbiAgICAgICAgICAgIC5hdHRyKCdyeCcsIDQpXG4gICAgICAgICAgICAuYXR0cigncnknLCA0KVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDEwKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiAoY29uZmlnLnhTY2FsZShkYXRhLmVuZERhdGUpIC0gY29uZmlnLnhTY2FsZShcbiAgICAgICAgICAgICAgICBkYXRhLnN0YXJ0RGF0ZSkpICogZGF0YS5wZXJjZW50IHx8IDA7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBzaG93UGFja2FnZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgdmFyIGZpbGxDb2xvciA9IFwiIzBjY1wiO1xuICAgICAgICAgIGlmIChkYXRhLmVuZERhdGUgPCBuZXcgRGF0ZSgpKSB7XG4gICAgICAgICAgICBmaWxsQ29sb3IgPSAncmVkJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgdyA9IHhTY2FsZShkYXRhLmVuZERhdGUpIC0geFNjYWxlKGRhdGEuc3RhcnREYXRlKTtcbiAgICAgICAgICB2YXIgcHcgPSB3ICogZGF0YS5wZXJjZW50IHx8IDA7XG4gICAgICAgICAgdmFyIGJhY2tncm91bmQgPSBjb250YWluZXIuYXBwZW5kKCdwb2x5bGluZScpXG4gICAgICAgICAgICAuYXR0cignc3Ryb2tlJywgXCIjYTBhMGEwXCIpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCBcInRhc2sgcHJlXCIpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoMCwgMC41KVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3BvaW50cycsICcwLDAgJyArIHcgKyAnLDAgJyArIHcgKyAnLDIwICcgKyAodyAtXG4gICAgICAgICAgICAgIDUpICsgJyw3IDUsNyAwLDIwIDAsMCcpXG4gICAgICAgICAgICAuYXR0cignc3R5bGUnLCAnZmlsbDp3aGl0ZTtzdHJva2Utd2lkdGg6MScpO1xuXG5cbiAgICAgICAgICB2YXIgcHJlID0gY29udGFpbmVyLmFwcGVuZCgncG9seWxpbmUnKVxuICAgICAgICAgICAgLmF0dHIoJ3N0cm9rZScsIFwiI2EwYTBhMFwiKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgXCJ0YXNrIHByZVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKDAsIDAuNSlcIilcbiAgICAgICAgICAgIC5hdHRyKCdzdHlsZScsICdmaWxsOmZmOWM0YztzdHJva2Utd2lkdGg6MScpO1xuXG4gICAgICAgICAgaWYgKHB3IDwgNSkge1xuICAgICAgICAgICAgcHJlLmF0dHIoJ3BvaW50cycsICcwLDAgJyArIHB3ICsgJywwICcgKyBwdyArXG4gICAgICAgICAgICAgICcsNyAnICsgcHcgKyAnLDcgMCwyMCAwLDAnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHB3ID49IDUgJiYgcHcgPCAodyAtIDUpKSB7XG4gICAgICAgICAgICBwcmUuYXR0cigncG9pbnRzJywgJzAsMCAnICsgcHcgKyAnLDAgJyArIHB3ICtcbiAgICAgICAgICAgICAgJyw3IDUsNyAwLDIwIDAsMCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAocHcgPj0gKHcgLSA1KSkge1xuICAgICAgICAgICAgcHJlLmF0dHIoJ3BvaW50cycsICcwLDAgJyArIHB3ICsgJywwICcgKyBwdyArXG4gICAgICAgICAgICAgICcsMjAgJyArICh3IC0gNSkgKyAnLDcgNSw3IDAsMjAgMCwwJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChkYXRhLnBhY2thZ2UpIHtcbiAgICAgICAgICBzaG93UGFja2FnZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNob3dUYXNrKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25maWd1cmFibGUodGFzaywgY29uZmlnKTtcblxuICAgIHJldHVybiB0YXNrO1xuICB9O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY29uZmlndXJhYmxlKHRhcmdldEZ1bmN0aW9uLCBjb25maWcsIGxpc3RlbmVycykge1xuICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMgfHwge307XG4gIGZvciAodmFyIGl0ZW0gaW4gY29uZmlnKSB7XG4gICAgKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHRhcmdldEZ1bmN0aW9uW2l0ZW1dID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gY29uZmlnW2l0ZW1dO1xuICAgICAgICBjb25maWdbaXRlbV0gPSB2YWx1ZTtcbiAgICAgICAgaWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShpdGVtKSkge1xuICAgICAgICAgIGxpc3RlbmVyc1tpdGVtXSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRhcmdldEZ1bmN0aW9uO1xuICAgICAgfTtcbiAgICB9KShpdGVtKTsgLy8gZm9yIGRvZXNuJ3QgY3JlYXRlIGEgY2xvc3VyZSwgZm9yY2luZyBpdFxuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkMywgY29uZmlnLCB4U2NhbGUsIGdyYXBoLCBncmFwaEhlaWdodCwgd2hlcmUpIHtcbiAgdmFyIHhBeGlzID0ge307XG4gIHZhciB4QXhpc0VscyA9IHt9O1xuXG4gIHZhciB0aWNrRm9ybWF0RGF0YSA9IFtdO1xuXG4gIGNvbmZpZy50aWNrRm9ybWF0LmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgIHZhciB0aWNrID0gaXRlbS5zbGljZSgwKTtcbiAgICB0aWNrRm9ybWF0RGF0YS5wdXNoKHRpY2spO1xuICB9KTtcblxuICB2YXIgdGlja0Zvcm1hdCA9IGNvbmZpZy5sb2NhbGUgPyBjb25maWcubG9jYWxlLnRpbWVGb3JtYXQubXVsdGkoXG4gICAgdGlja0Zvcm1hdERhdGEpIDogZDMudGltZS5mb3JtYXQubXVsdGkodGlja0Zvcm1hdERhdGEpO1xuXG4gIHhBeGlzW3doZXJlXSA9IGQzLnN2Zy5heGlzKClcbiAgICAuc2NhbGUoeFNjYWxlKVxuICAgIC5vcmllbnQod2hlcmUpXG4gICAgLnRpY2tTaXplKDYpXG4gICAgLnRpY2tQYWRkaW5nKDEwKVxuICAgIC50aWNrRm9ybWF0KHRpY2tGb3JtYXQpO1xuXG4gIGlmICh0eXBlb2YgY29uZmlnLmF4aXNGb3JtYXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25maWcuYXhpc0Zvcm1hdCh4QXhpcyk7XG4gIH1cblxuICB2YXIgeSA9ICh3aGVyZSA9PSAnYm90dG9tJykgPyAwIDogY29uZmlnLm1hcmdpbi50b3AgLSAxO1xuXG5cbiAgeEF4aXNFbHNbd2hlcmVdID0gZ3JhcGhcbiAgICAuYXBwZW5kKCdnJylcbiAgICAuY2xhc3NlZCgneC1heGlzIGF4aXMnLCB0cnVlKVxuICAgIC5jbGFzc2VkKHdoZXJlLCB0cnVlKVxuICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBjb25maWcubWFyZ2luLmxlZnQgKyAnLCAnICsgeSArICcpJylcbiAgICAuY2FsbCh4QXhpc1t3aGVyZV0pO1xuXG4gIHZhciBkcmF3WEF4aXMgPSBmdW5jdGlvbiBkcmF3WEF4aXMoKSB7XG4gICAgeEF4aXNFbHNbd2hlcmVdXG4gICAgICAuY2FsbCh4QXhpc1t3aGVyZV0pO1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgZHJhd1hBeGlzOiBkcmF3WEF4aXNcbiAgfTtcbn07XG4iXX0=
