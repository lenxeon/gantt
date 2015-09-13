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
            // redraw(false);
            if (typeof config.zoomHandler ===
              'function') {
              config.zoomHandler({
                scale: zoom.scale(),
                translateX: zoom.translate()[0]
              });
            }
          });

        config.stepWidth = 40;
        config.step = graphWidth / config.stepWidth;
        config.end = d3.time.day.offset(config.start, config.step);


        var days = d3.time.days(config.start, config.end);
        xScale.range([0, graphWidth])
          .domain([config.start, config.end])
          .nice(d3.time.day);
        console.log(config.start);
        console.log(config.end);



        zoom.x(xScale);
        if (config.zoomScale) {
          zoom.scale(config.zoomScale);
        }
        if (config.translateX) {
          zoom.translate([config.translateX, 0])
        }
        zoom.size([graphWidth, graphHeight]);

        var wrapperHeight = $('#wrapper').height();
        graphHeight = data.length * 40;
        graphHeight = graphHeight < wrapperHeight ? wrapperHeight :
          graphHeight;
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

        var wrapperHeight = $('#wrapper').height();
        console.log("graphHeight==" + graphHeight + '/' + wrapperHeight);

        function drawZoom() {
          var curx, cury;
          var zoomRect = graph
            .append('rect')
            .call(zoom)
            .classed('zoom', true)
            .attr('fill', 'green')
            .attr('width', graphWidth)
            .attr('height', wrapperHeight);
          return zoomRect;
        }
        drawZoom();

        graph.select('.graph-body').remove();
        var graphBody = graph
          .append('g')
          .classed('graph-body', true);

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
            readonly: config.readonly,
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
        window.redraw = redraw;
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
          if (config.readonly) {
            return;
          }
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
          percentBtn.on('mouseover', tooltip.mouseover)
            .on('mouseout', tooltip.mouseout)
            .on('mousemove', tooltip.mousemove);
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
            .style('fill', config.eventColor)
            .attr('class', "item")
            .attr('transform', function(d) {
              return 'translate(' + config.xScale(d.startDate) +
                ', 13)'
            })
            .attr('height', 20)
            .call(task({
              xScale: config.xScale,
              eventColor: config.eventColor
            }));
          if (!config.readonly) {
            taskBox.call(moveListener);
          }
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
            .attr('points', '0,0 ' + w + ',0 ' + w + ',10 ' + (w -
              5) + ',7 5,7 0,10 0,0')
            .attr('style', 'fill:white;stroke-width:1');


          var pre = container.append('polyline')
            .attr('stroke', "#a0a0a0")
            .attr('class', "task pre")
            .attr('transform', "translate(0, 0.5)")
            .attr('style', 'fill:ff9c4c;stroke-width:1');

          if (pw < 5) {
            pre.attr('points', '0,0 ' + pw + ',0 ' + pw +
              ',7 ' + pw + ',7 0,10 0,0');
          } else if (pw >= 5 && pw < (w - 5)) {
            pre.attr('points', '0,0 ' + pw + ',0 ' + pw +
              ',7 5,7 0,10 0,0');
          } else if (pw >= (w - 5)) {
            pre.attr('points', '0,0 ' + pw + ',0 ' + pw +
              ',7 ' + (w - 5) + ',7 5,7 0,10 0,0');
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
    .ticks(config.step)
    // .tickSize(6, 10)
    // .innerTickSize(6)
    // .outerTickSize(4)
    // .tickPadding(10)
    .tickFormat(tickFormat);

  var lineY = (where == 'bottom') ? 0 : config.margin.top - 2;


  //------------------------------------------------------------------------
  window.xScale = xScale;

  var scale = xScale.domain();
  var start = d3.time.day.offset(scale[0], -7);
  var end = d3.time.day.offset(scale[1], +7);
  var days = d3.time.days(start, end);

  var xAxisBox = null;
  graph.selectAll('.xAxisBox').remove();
  var box = graph.append('g').classed('xAxisBox', true);
  xAxisBox = box.selectAll('g').data(days);

  var o = xAxisBox.enter()
    .append('g')
    .attr('class', function(d) {
      var day = d.getDay();
      if (day == 0 || day == 6) {
        return 'd h'
      } else {
        return 'd'
      }
    })
    .attr('transform', function(d) {
      return 'translate(' + (xScale(d)) + ',0)';
    });

  o.append('rect')
    .attr('width', function(d) {
      var next = d3.time.day.offset(d, 1);
      return xScale(next) - xScale(d) - 1;
    })
    .attr('height', 20)

  o.append('text')
    .attr("dx", 10)
    .attr("dy", 13)
    .text(function(d) {
      return d.getUTCDate();
    });

  xAxisBox.exit().remove();



  var start = d3.time.day.offset(scale[0], -40);
  var end = d3.time.day.offset(scale[1], +40);
  var months = d3.time.months(start, end);

  var xAxisMonthBox = null;
  graph.selectAll('.xAxisMonthBox').remove();
  var boxMonth = graph.append('g').classed('xAxisMonthBox', true);
  xAxisMonthBox = boxMonth.selectAll('g').data(months);

  var o = xAxisMonthBox.enter()
    .append('g')
    .attr('transform', function(d) {
      var dx = d3.time.day.offset(d, +1)
      return 'translate(' + (xScale(dx)) + ',0)';
    })
    // .style('fill', config.eventLineColor)

  o.append('rect')
    .attr('width', function(d) {
      var next = d3.time.day.offset(d, 31);
      next = d3.time.month(next);
      return xScale(next) - xScale(d) - 1;
    })
    .attr('fill', '#dddddd')
    .attr('height', 20)

  o.append('text')
    .attr("dx", 10)
    .attr("dy", 13)
    .attr('transform', 'translate(600, 0)')
    .text(function(d) {
      return d.getUTCFullYear() + '年' + d.getUTCMonth() + '月';
    });

  xAxisMonthBox.exit().remove();

  if (where == 'top') {
    box.attr('transform', 'translate(0, 22)');
    boxMonth.attr('transform', 'translate(0, 1)');
  } else {
    box.attr('transform', 'translate(0, 2)');
    boxMonth.attr('transform', 'translate(0, 23)');
  }

  graph.selectAll('line').remove();
  var line = graph.append('line')
    .attr('x1', 0)
    .attr('x2', config.width)
    .attr('y1', lineY)
    .attr('y2', lineY);

  //------------------------------------------------------------------------
  if (typeof config.axisFormat === 'function') {
    config.axisFormat(xAxis);
  }

  // xAxisEls[where] = graph
  //   .append('g')
  //   .classed('x-axis axis', true)
  //   .classed(where, true)
  //   .attr('transform', 'translate(' + config.margin.left + ', ' + y + ')')
  //   .call(xAxis[where]);

  var drawXAxis = function drawXAxis() {
    xAxisEls[where]
      .call(xAxis[where]);
  };

  return {
    drawXAxis: drawXAxis
  };
};
},{}]},{},[6])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvYXBwLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2V2ZW50TGluZS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9maWx0ZXJEYXRhLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2ZpbHRlckxpbmUuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvbGVmdEJ0bi5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9tYWluLmpzIiwicHVibGljL2phdmFzY3JpcHRzL211SXRlbXMuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvcmlnaHRCdG4uanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvdGFzay5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy91dGlsL2NvbmZpZ3VyYWJsZS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy94QXhpcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgY29uZmlndXJhYmxlID0gcmVxdWlyZSgnLi91dGlsL2NvbmZpZ3VyYWJsZScpO1xudmFyIHhBeGlzRmFjdG9yeSA9IHJlcXVpcmUoJy4veEF4aXMnKTtcbnZhciBmaWx0ZXJMaW5lID0gcmVxdWlyZSgnLi9maWx0ZXJMaW5lJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZDMpIHtcbiAgdmFyIGV2ZW50TGluZSA9IHJlcXVpcmUoJy4vZXZlbnRMaW5lJykoZDMpO1xuXG4gIC8v5LiA5Lqb6buY6K6k55qE6YWN572uXG4gIHZhciBkZWZhdWx0Q29uZmlnID0ge1xuICAgIG5hbWU6ICdwcm9qZWN0IG1hbmFnZXInLFxuICAgIHN0YXJ0OiBkMy50aW1lLmRheShuZXcgRGF0ZSgpKSxcbiAgICBlbmQ6IGQzLnRpbWUuZGF5Lm9mZnNldChkMy50aW1lLmRheShuZXcgRGF0ZSgpKSwgNyksXG4gICAgbWluU2NhbGU6IDAsXG4gICAgbWF4U2NhbGU6IDEwMCxcbiAgICBtYXJnaW46IHtcbiAgICAgIHRvcDogNDUsXG4gICAgICBsZWZ0OiAwLFxuICAgICAgYm90dG9tOiA0NSxcbiAgICAgIHJpZ2h0OiAwXG4gICAgfSxcbiAgICB0aWNrRm9ybWF0OiBbXG4gICAgICBbXCIuJUxcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXRNaWxsaXNlY29uZHMoKTtcbiAgICAgIH1dLFxuICAgICAgW1wiOiVTXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuZ2V0U2Vjb25kcygpO1xuICAgICAgfV0sXG4gICAgICBbXCIlSTolTVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLmdldE1pbnV0ZXMoKTtcbiAgICAgIH1dLFxuICAgICAgW1wiJUkgJXBcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXRIb3VycygpO1xuICAgICAgfV0sXG4gICAgICBbXCIlYSAlZFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLmdldERheSgpICYmIGQuZ2V0RGF0ZSgpICE9IDE7XG4gICAgICB9XSxcbiAgICAgIFtcIiViICVkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuZ2V0RGF0ZSgpICE9IDE7XG4gICAgICB9XSxcbiAgICAgIFtcIiVCXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuZ2V0TW9udGgoKTtcbiAgICAgIH1dLFxuICAgICAgW1wiJVlcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfV1cbiAgICBdLFxuICAgIHdpZHRoOiAxMDAwXG4gIH07XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGFwcChjb25maWcpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhjb25maWcpO1xuICAgIHZhciB4U2NhbGUgPSBkMy50aW1lLnNjYWxlKCk7XG4gICAgdmFyIHlTY2FsZSA9IGQzLnNjYWxlLm9yZGluYWwoKTtcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgZm9yICh2YXIga2V5IGluIGRlZmF1bHRDb25maWcpIHtcbiAgICAgIGNvbmZpZ1trZXldID0gY29uZmlnW2tleV0gfHwgZGVmYXVsdENvbmZpZ1trZXldO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbml0KHNlbGVjdGlvbikge1xuXG4gICAgICBzZWxlY3Rpb24uZWFjaChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBncmFwaEhlaWdodCA9IDA7XG4gICAgICAgIHZhciBncmFwaFdpZHRoID0gY29uZmlnLndpZHRoO1xuICAgICAgICBkMy5zZWxlY3QodGhpcykuc2VsZWN0KCdzdmcnKS5yZW1vdmUoKTtcblxuICAgICAgICB2YXIgem9vbSA9IGQzLmJlaGF2aW9yLnpvb20oKS5jZW50ZXIobnVsbCkuc2NhbGVFeHRlbnQoW2NvbmZpZy5taW5TY2FsZSxcbiAgICAgICAgICAgIGNvbmZpZy5tYXhTY2FsZVxuICAgICAgICAgIF0pXG4gICAgICAgICAgLm9uKCd6b29tc3RhcnQnLCB6b29tc3RhcnQpXG4gICAgICAgICAgLm9uKFwiem9vbVwiLCB1cGRhdGVab29tKVxuICAgICAgICAgIC5vbihcInpvb21lbmRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyByZWRyYXcoZmFsc2UpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcuem9vbUhhbmRsZXIgPT09XG4gICAgICAgICAgICAgICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgY29uZmlnLnpvb21IYW5kbGVyKHtcbiAgICAgICAgICAgICAgICBzY2FsZTogem9vbS5zY2FsZSgpLFxuICAgICAgICAgICAgICAgIHRyYW5zbGF0ZVg6IHpvb20udHJhbnNsYXRlKClbMF1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgY29uZmlnLnN0ZXBXaWR0aCA9IDQwO1xuICAgICAgICBjb25maWcuc3RlcCA9IGdyYXBoV2lkdGggLyBjb25maWcuc3RlcFdpZHRoO1xuICAgICAgICBjb25maWcuZW5kID0gZDMudGltZS5kYXkub2Zmc2V0KGNvbmZpZy5zdGFydCwgY29uZmlnLnN0ZXApO1xuXG5cbiAgICAgICAgdmFyIGRheXMgPSBkMy50aW1lLmRheXMoY29uZmlnLnN0YXJ0LCBjb25maWcuZW5kKTtcbiAgICAgICAgeFNjYWxlLnJhbmdlKFswLCBncmFwaFdpZHRoXSlcbiAgICAgICAgICAuZG9tYWluKFtjb25maWcuc3RhcnQsIGNvbmZpZy5lbmRdKVxuICAgICAgICAgIC5uaWNlKGQzLnRpbWUuZGF5KTtcbiAgICAgICAgY29uc29sZS5sb2coY29uZmlnLnN0YXJ0KTtcbiAgICAgICAgY29uc29sZS5sb2coY29uZmlnLmVuZCk7XG5cblxuXG4gICAgICAgIHpvb20ueCh4U2NhbGUpO1xuICAgICAgICBpZiAoY29uZmlnLnpvb21TY2FsZSkge1xuICAgICAgICAgIHpvb20uc2NhbGUoY29uZmlnLnpvb21TY2FsZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbmZpZy50cmFuc2xhdGVYKSB7XG4gICAgICAgICAgem9vbS50cmFuc2xhdGUoW2NvbmZpZy50cmFuc2xhdGVYLCAwXSlcbiAgICAgICAgfVxuICAgICAgICB6b29tLnNpemUoW2dyYXBoV2lkdGgsIGdyYXBoSGVpZ2h0XSk7XG5cbiAgICAgICAgdmFyIHdyYXBwZXJIZWlnaHQgPSAkKCcjd3JhcHBlcicpLmhlaWdodCgpO1xuICAgICAgICBncmFwaEhlaWdodCA9IGRhdGEubGVuZ3RoICogNDA7XG4gICAgICAgIGdyYXBoSGVpZ2h0ID0gZ3JhcGhIZWlnaHQgPCB3cmFwcGVySGVpZ2h0ID8gd3JhcHBlckhlaWdodCA6XG4gICAgICAgICAgZ3JhcGhIZWlnaHQ7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEubGVuZ3RoICsgJ+S4quS7u+WKoScpO1xuICAgICAgICB2YXIgc3ZnID0gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgLmFwcGVuZCgnc3ZnJylcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnYXBwJylcbiAgICAgICAgICAuYXR0cignd2lkdGgnLCBncmFwaFdpZHRoKVxuICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBncmFwaEhlaWdodCk7XG5cbiAgICAgICAgdmFyIGdyYXBoID0gc3ZnLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmF0dHIoJ2lkJywgJ2NvbnRhaW5lci1ib3gnKTtcblxuICAgICAgICB2YXIgeURvbWFpbiA9IFtdO1xuICAgICAgICB2YXIgeVJhbmdlID0gW107XG5cbiAgICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKHRhc2ssIGluZGV4KSB7XG4gICAgICAgICAgeURvbWFpbi5wdXNoKHRhc2sudXVpZCk7XG4gICAgICAgICAgeVJhbmdlLnB1c2goaW5kZXggKiA0MCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHlTY2FsZS5kb21haW4oeURvbWFpbikucmFuZ2UoeVJhbmdlKTtcblxuXG4gICAgICAgIHZhciB5QXhpc0VsID0gZ3JhcGguYXBwZW5kKCdnJylcbiAgICAgICAgICAuY2xhc3NlZCgneS1heGlzIGF4aXMnLCB0cnVlKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIC0xKScpXG4gICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAnMC40Jyk7XG5cbiAgICAgICAgdmFyIHlUaWNrID0geUF4aXNFbC5hcHBlbmQoJ2cnKS5zZWxlY3RBbGwoJ2cnKS5kYXRhKHlEb21haW4pO1xuXG4gICAgICAgIHlUaWNrLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoMCwgJyArICh5U2NhbGUoZCkgLSAxKSArICcpJztcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgIC5jbGFzc2VkKCd5LXRpY2snLCB0cnVlKVxuICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLWRhc2hhcnJheVwiLCBcIjEwLCAxMFwiKVxuICAgICAgICAgIC5hdHRyKCd4MScsIGNvbmZpZy5tYXJnaW4ubGVmdClcbiAgICAgICAgICAuYXR0cigneDInLCBjb25maWcubWFyZ2luLmxlZnQgKyBncmFwaFdpZHRoKTtcblxuICAgICAgICB5VGljay5leGl0KCkucmVtb3ZlKCk7XG5cbiAgICAgICAgdmFyIHdyYXBwZXJIZWlnaHQgPSAkKCcjd3JhcHBlcicpLmhlaWdodCgpO1xuICAgICAgICBjb25zb2xlLmxvZyhcImdyYXBoSGVpZ2h0PT1cIiArIGdyYXBoSGVpZ2h0ICsgJy8nICsgd3JhcHBlckhlaWdodCk7XG5cbiAgICAgICAgZnVuY3Rpb24gZHJhd1pvb20oKSB7XG4gICAgICAgICAgdmFyIGN1cngsIGN1cnk7XG4gICAgICAgICAgdmFyIHpvb21SZWN0ID0gZ3JhcGhcbiAgICAgICAgICAgIC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLmNhbGwoem9vbSlcbiAgICAgICAgICAgIC5jbGFzc2VkKCd6b29tJywgdHJ1ZSlcbiAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgJ2dyZWVuJylcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGdyYXBoV2lkdGgpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0Jywgd3JhcHBlckhlaWdodCk7XG4gICAgICAgICAgcmV0dXJuIHpvb21SZWN0O1xuICAgICAgICB9XG4gICAgICAgIGRyYXdab29tKCk7XG5cbiAgICAgICAgZ3JhcGguc2VsZWN0KCcuZ3JhcGgtYm9keScpLnJlbW92ZSgpO1xuICAgICAgICB2YXIgZ3JhcGhCb2R5ID0gZ3JhcGhcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAuY2xhc3NlZCgnZ3JhcGgtYm9keScsIHRydWUpO1xuXG4gICAgICAgIHZhciB0aW1lciA9IG51bGw7XG5cbiAgICAgICAgZnVuY3Rpb24gem9vbXN0YXJ0KCkge1xuICAgICAgICAgIGNvbmZpZy5zY2FsZSA9IG51bGw7XG4gICAgICAgICAgY29uZmlnLnRyYW5zbGF0ZSA9IG51bGw7XG4gICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09XG4gICAgICAgICAgICAnW29iamVjdCBXaGVlbEV2ZW50XScpIHtcbiAgICAgICAgICAgIGlmICghZDMuZXZlbnQuc291cmNlRXZlbnQuYWx0S2V5KSB7XG4gICAgICAgICAgICAgIGNvbmZpZy5zY2FsZSA9IHpvb20uc2NhbGUoKTtcbiAgICAgICAgICAgICAgY29uZmlnLnRyYW5zbGF0ZSA9IHpvb20udHJhbnNsYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdXBkYXRlWm9vbSgpIHtcbiAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDNcbiAgICAgICAgICAgIC5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PVxuICAgICAgICAgICAgJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICB6b29tLnRyYW5zbGF0ZShbZDMuZXZlbnQudHJhbnNsYXRlWzBdLCAwXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LmFsdEtleSAmJiBkM1xuICAgICAgICAgICAgLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09XG4gICAgICAgICAgICAnW29iamVjdCBXaGVlbEV2ZW50XScpIHtcbiAgICAgICAgICAgIHpvb20uc2NhbGUoZDMuZXZlbnQuc2NhbGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY29uZmlnLnNjYWxlICYmIGNvbmZpZy50cmFuc2xhdGUpIHtcbiAgICAgICAgICAgIHpvb20uc2NhbGUoY29uZmlnLnNjYWxlKTtcbiAgICAgICAgICAgIHpvb20udHJhbnNsYXRlKGNvbmZpZy50cmFuc2xhdGUpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGltZXIpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZHJhdyhmYWxzZSk7XG4gICAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVkcmF3KHRydWUpO1xuICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGluZXMgPSBudWxsO1xuICAgICAgICBsaW5lcyA9IGdyYXBoQm9keS5zZWxlY3RBbGwoJ2cnKS5kYXRhKGRhdGEpO1xuXG4gICAgICAgIGxpbmVzLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAuY2xhc3NlZCgnbGluZScsIHRydWUpXG4gICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKDAsJyArICh5U2NhbGUoZC51dWlkKSkgKyAnKSc7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBjb25maWcuZXZlbnRMaW5lQ29sb3IpO1xuXG4gICAgICAgIGxpbmVzLmV4aXQoKS5yZW1vdmUoKTtcblxuXG4gICAgICAgIGZ1bmN0aW9uIHJlZHJhdyhmdWxsUmVkcmF3KSB7XG4gICAgICAgICAgdmFyIHN0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgICB2YXIgeHRvcCA9IGQzLnNlbGVjdCgnI2hlYWRlcicpO1xuICAgICAgICAgIHh0b3Auc2VsZWN0KCdnJykucmVtb3ZlKCk7XG4gICAgICAgICAgdmFyIHhBeGlzVG9wID0geEF4aXNGYWN0b3J5KGQzLCBjb25maWcsIHhTY2FsZSwgeHRvcCxcbiAgICAgICAgICAgIGdyYXBoSGVpZ2h0LCAndG9wJyk7XG5cbiAgICAgICAgICB2YXIgeGJvdHRvbSA9IGQzLnNlbGVjdCgnI2Zvb3RlcicpO1xuICAgICAgICAgIHhib3R0b20uc2VsZWN0KCdnJykucmVtb3ZlKCk7XG4gICAgICAgICAgdmFyIHhBeGlzQm90dG9tID0geEF4aXNGYWN0b3J5KGQzLCBjb25maWcsIHhTY2FsZSwgeGJvdHRvbSxcbiAgICAgICAgICAgIGdyYXBoSGVpZ2h0LCAnYm90dG9tJyk7XG5cbiAgICAgICAgICBsaW5lcy5jYWxsKGV2ZW50TGluZSh7XG4gICAgICAgICAgICByZWFkb25seTogY29uZmlnLnJlYWRvbmx5LFxuICAgICAgICAgICAgbWFyZ2luOiBjb25maWcubWFyZ2luLFxuICAgICAgICAgICAgZ3JhcGhIZWlnaHQ6IGdyYXBoSGVpZ2h0LFxuICAgICAgICAgICAgeVNjYWxlOiB5U2NhbGUsXG4gICAgICAgICAgICB4U2NhbGU6IHhTY2FsZSxcbiAgICAgICAgICAgIGZ1bGxSZWRyYXc6IGZ1bGxSZWRyYXcsXG4gICAgICAgICAgICBldmVudENvbG9yOiBjb25maWcuZXZlbnRDb2xvcixcbiAgICAgICAgICAgIGNoYW5nZVRpbWVIYW5kbGVyOiBjb25maWcuY2hhbmdlVGltZUhhbmRsZXIsXG4gICAgICAgICAgICBjaGFuZ2VTdGFydFRpbWVIYW5kbGVyOiBjb25maWcuY2hhbmdlU3RhcnRUaW1lSGFuZGxlcixcbiAgICAgICAgICAgIGNoYW5nZUVuZFRpbWVIYW5kbGVyOiBjb25maWcuY2hhbmdlRW5kVGltZUhhbmRsZXIsXG4gICAgICAgICAgICBjaGFuZ2VQZXJjZW50SGFuZGxlcjogY29uZmlnLmNoYW5nZVBlcmNlbnRIYW5kbGVyXG4gICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgdmFyIGV0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ+mHjeeUu+aVtOS9kycgKyBmdWxsUmVkcmF3ICsgJz0nICsgKGV0IC0gc3QpICsgJ21zJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmVkcmF3KGZhbHNlKTtcbiAgICAgICAgd2luZG93LnJlZHJhdyA9IHJlZHJhdztcbiAgICAgIH0pO1xuICAgICAgbG9hZGVkKCk7XG4gICAgfVxuICAgIGNvbmZpZ3VyYWJsZShpbml0LCBjb25maWcpO1xuICAgIHJldHVybiBpbml0O1xuICB9O1xufTsiLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCByZXF1aXJlLCBtb2R1bGUsIGQzICovXG5cbnZhciBjb25maWd1cmFibGUgPSByZXF1aXJlKCcuL3V0aWwvY29uZmlndXJhYmxlJyk7XG52YXIgZmlsdGVyRGF0YSA9IHJlcXVpcmUoJy4vZmlsdGVyRGF0YScpO1xudmFyIG11RmFjdG9yeSA9IHJlcXVpcmUoJy4vbXVJdGVtcycpO1xuXG52YXIgZGVmYXVsdENvbmZpZyA9IHtcbiAgeFNjYWxlOiBudWxsXG59O1xudmFyIGZvcm1hdGVyID0gZDMudGltZS5mb3JtYXQoXCIlWS0lbS0lZCAlSDolTTolU1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGQzKSB7XG4gIHZhciB0YXNrID0gcmVxdWlyZSgnLi90YXNrJykoZDMpO1xuICB2YXIgbGVmdEJ0biA9IHJlcXVpcmUoJy4vbGVmdEJ0bicpKGQzKTtcbiAgdmFyIHJpZ2h0QnRuID0gcmVxdWlyZSgnLi9yaWdodEJ0bicpKGQzKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7XG4gICAgICB4U2NhbGU6IG51bGwsXG4gICAgICByZWRyYXc6IHRydWUsXG4gICAgICBldmVudENvbG9yOiBudWxsXG4gICAgfTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdENvbmZpZykge1xuICAgICAgY29uZmlnW2tleV0gPSBjb25maWdba2V5XSB8fCBkZWZhdWx0Q29uZmlnW2tleV07XG4gICAgfVxuICAgIC8v6L+H5ruk55SoXG4gICAgdmFyIHNjcm9sbFRvcE9mZnNldCA9ICQoJyNzY3JvbGxlcicpLm9mZnNldCgpLnRvcDtcbiAgICB2YXIgeU1pbiA9IDAgLSBzY3JvbGxUb3BPZmZzZXQ7XG4gICAgdmFyIHlNYXggPSAwIC0gc2Nyb2xsVG9wT2Zmc2V0ICsgJCgnI3dyYXBwZXInKS5oZWlnaHQoKSArIDgwO1xuICAgIC8v5b2T5YmN6YCJ5Lit55qE5piv5ZOq5LiA5Liq5Lu75YqhXG4gICAgdmFyIHNlbGVjdGVkVGFzayA9IG51bGw7XG4gICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgLy9cbiAgICB2YXIgZXZlbnRMaW5lID0gZnVuY3Rpb24gZXZlbnRMaW5lKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgbGluZVN2ZyA9IGQzLnNlbGVjdCh0aGlzKTtcbiAgICAgICAgbGluZVN2Zy5zZWxlY3RBbGwoJy5pdGVtJykucmVtb3ZlKCk7XG4gICAgICAgIHZhciB0YXNrQm94ID0gbGluZVN2Z1xuICAgICAgICAgIC5zZWxlY3RBbGwoJy5pdGVtJylcbiAgICAgICAgICAuZGF0YShmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyRGF0YShkLnRhc2tzLCBjb25maWcueFNjYWxlLCBjb25maWcueVNjYWxlLFxuICAgICAgICAgICAgICB5TWluLCB5TWF4LCBjb25maWcuZnVsbFJlZHJhdyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHZhciBtb3ZlTGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpO1xuXG4gICAgICAgIC8v5aSE55CG5o+Q56S65L+h5oGvXG4gICAgICAgIHZhciB0b29sdGlwID0gZDMuaGVscGVyLnRvb2x0aXAoKVxuICAgICAgICAgIC5wYWRkaW5nKDE2LCAyNSlcbiAgICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICB2YXIgeCA9IHRhc2tCb3guYXR0cigneCcpO1xuICAgICAgICAgICAgdmFyIHRpbWVPblNjYWxlID0gY29uZmlnLnhTY2FsZS5pbnZlcnQoeCk7XG4gICAgICAgICAgICB2YXIgc3RhdCA9IGQuc3RhdHVzID09ICdmaW5pc2gnID8gJ+WujOe7kycgOiAn6L+b6KGM5LitJztcbiAgICAgICAgICAgIHZhciBodG1sID0gW107XG4gICAgICAgICAgICBodG1sLnB1c2goJzxoMT4nICsgZC5uYW1lICsgJzwvaDE+Jyk7XG4gICAgICAgICAgICBodG1sLnB1c2goJzx1bD4nKVxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8bGkgY2xhc3M9XCJpXCI+5byA5aeL5pe26Ze0OiAgJyArIGZvcm1hdGVyKGQuc3RhcnREYXRlKSArXG4gICAgICAgICAgICAgICc8L2xpPicpXG4gICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cImlcIj7nu5PmnZ/ml7bpl7Q6ICAnICsgZm9ybWF0ZXIoZC5lbmREYXRlKSArXG4gICAgICAgICAgICAgICc8L2xpPicpXG4gICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cImlcIj7ku7vliqHnirbmgIE6ICAnICsgc3RhdCArICc8L2xpPicpXG4gICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cImlcIj7ov5vluqY6ICAnICsgKGQucGVyY2VudCB8fCAwKSAqXG4gICAgICAgICAgICAgIDEwMCArXG4gICAgICAgICAgICAgICclPC9saT4nKVxuICAgICAgICAgICAgcmV0dXJuIGh0bWwuam9pbignJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIC8v55S76I+c5Y2VXG5cblxuICAgICAgICB2YXIgbGVmdEJ0biwgcGVyY2VudEJ0biwgcmlnaHRCdG47XG4gICAgICAgIHZhciBsZWZ0T2ZmRml4ID0gLTE5LFxuICAgICAgICAgIHJpZ2h0T2ZmRml4ID0gNTsgLy/nn6nlvaLlgY/np7tcbiAgICAgICAgdmFyIHJlZHJhd01lbnUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoY29uZmlnLnJlYWRvbmx5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciB0YXNrID0gdGFza0JveC5kYXRhKClbMF07XG4gICAgICAgICAgaWYgKHRhc2sgPT0gbnVsbCB8fCB3aW5kb3cuY29uZmlnLnNlbGVjdElkICE9IHRhc2submFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvL+ebruW9lVxuICAgICAgICAgIGQzLnNlbGVjdCgnLmdyYXBoLWJvZHknKS5zZWxlY3QoJy5tZW51JykucmVtb3ZlKCk7XG4gICAgICAgICAgdmFyIG1lbnUgPSBsaW5lU3ZnLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgXCJtZW51XCIpO1xuICAgICAgICAgIHZhciBwZXJjZW50TGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpO1xuICAgICAgICAgIHZhciBzdGFydFRpbWVMaXN0ZW5lciA9IGQzLmJlaGF2aW9yLnpvb20oKS5jZW50ZXIobnVsbCk7XG4gICAgICAgICAgdmFyIGVuZFRpbWVMaXN0ZW5lciA9IGQzLmJlaGF2aW9yLnpvb20oKS5jZW50ZXIobnVsbCk7XG4gICAgICAgICAgdmFyIHggPSBjb25maWcueFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgICB2YXIgdyA9IGNvbmZpZy54U2NhbGUodGFzay5lbmREYXRlKSAtIGNvbmZpZy54U2NhbGUodGFzay5zdGFydERhdGUpO1xuICAgICAgICAgIG1lbnUuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgeCArICcsIDApJyk7XG5cbiAgICAgICAgICAvL+eZvuWIhuavlFxuICAgICAgICAgIHBlcmNlbnRMaXN0ZW5lci5vbignem9vbXN0YXJ0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHRhc2suX3BlcmNlbnQgPSB0YXNrLnBlcmNlbnQgfHwgMDtcbiAgICAgICAgICAgICAgdGFzay5feEN1cnIgPSBkMy5ldmVudC5zb3VyY2VFdmVudC5jbGllbnRYO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInpvb21zdGFydDpcIiArIHRhc2suX3hDdXJyKTtcbiAgICAgICAgICAgIH0pLm9uKFwiem9vbVwiLFxuICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICAgICAgICdbb2JqZWN0IE1vdXNlRXZlbnRdJykge1xuICAgICAgICAgICAgICAgICAgdmFyIGNsaWVudFggPSBkMy5ldmVudC5zb3VyY2VFdmVudC5jbGllbnRYO1xuICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IGNsaWVudFggLSB0YXNrLl94Q3VycjtcbiAgICAgICAgICAgICAgICAgIHZhciB4U2NhbGUgPSBjb25maWcueFNjYWxlO1xuICAgICAgICAgICAgICAgICAgdmFyIHhNaW4gPSAwOyAvL1xuICAgICAgICAgICAgICAgICAgdmFyIHhNYXggPSB3O1xuICAgICAgICAgICAgICAgICAgdmFyIHhDdXJyID0gdyAqIHRhc2suX3BlcmNlbnQgKyBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgICB4Q3VyciA9IE1hdGgubWluKHhDdXJyLCB4TWF4KTtcbiAgICAgICAgICAgICAgICAgIHhDdXJyID0gTWF0aC5tYXgoeEN1cnIsIHhNaW4pO1xuICAgICAgICAgICAgICAgICAgdmFyIF9wZXJjZW50ID0gKHhDdXJyIC0geE1pbikgLyB3O1xuICAgICAgICAgICAgICAgICAgdGFzay5wZXJjZW50ID0gTWF0aC5yb3VuZChfcGVyY2VudCAqIDEwKSAvIDEwXG4gICAgICAgICAgICAgICAgICB4Q3VyciA9IHhNaW4gKyB3ICogdGFzay5wZXJjZW50O1xuICAgICAgICAgICAgICAgICAgcGVyY2VudEJ0bi5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZShcIiArIHhDdXJyICtcbiAgICAgICAgICAgICAgICAgICAgXCIsIDE5KSByb3RhdGUoMClcIilcbiAgICAgICAgICAgICAgICAgIHJlZHJhd1Rhc2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJ6b29tZW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZWRyYXdNZW51KCk7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgY29uZmlnLmNoYW5nZVBlcmNlbnRIYW5kbGVyID09PVxuICAgICAgICAgICAgICAgICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuY2hhbmdlUGVyY2VudEhhbmRsZXIodGFza0JveC5kYXRhKClbMF0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIHZhciBzdGVwcyA9IDA7XG4gICAgICAgICAgc3RhcnRUaW1lTGlzdGVuZXIub24oJ3pvb21zdGFydCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB0YXNrLl9zdGFydERhdGUgPSB0YXNrLnN0YXJ0RGF0ZTtcbiAgICAgICAgICAgICAgdGFzay5fZW5kRGF0ZSA9IHRhc2suZW5kRGF0ZTtcbiAgICAgICAgICAgICAgdGFzay5fc3RlcHMgPSAwO1xuICAgICAgICAgICAgICB0YXNrLl9wZXJjZW50ID0gdGFzay5wZXJjZW50IHx8IDA7XG4gICAgICAgICAgICAgIHRhc2suX3hDdXJyID0gZDMuZXZlbnQuc291cmNlRXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6b29tc3RhcnQ6XCIgKyB0YXNrLl94Q3Vycik7XG4gICAgICAgICAgICB9KS5vbihcInpvb21cIixcbiAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09XG4gICAgICAgICAgICAgICAgICAnW29iamVjdCBNb3VzZUV2ZW50XScpIHtcbiAgICAgICAgICAgICAgICAgIHZhciB4U2NhbGUgPSBjb25maWcueFNjYWxlO1xuICAgICAgICAgICAgICAgICAgdmFyIGNsaWVudFggPSBkMy5ldmVudC5zb3VyY2VFdmVudC5jbGllbnRYO1xuICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IGNsaWVudFggLSB0YXNrLl94Q3VycjtcbiAgICAgICAgICAgICAgICAgIHZhciBtYXhEYXRlID0gZDMudGltZS5kYXkub2Zmc2V0KHRhc2suX2VuZERhdGUsIC1cbiAgICAgICAgICAgICAgICAgICAgMSk7XG4gICAgICAgICAgICAgICAgICBvZmZzZXQgPSBNYXRoLm1pbihvZmZzZXQsICh4U2NhbGUobWF4RGF0ZSkgLVxuICAgICAgICAgICAgICAgICAgICB4U2NhbGUodGFzay5fc3RhcnREYXRlKSkpICsgbGVmdE9mZkZpeDtcbiAgICAgICAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgdmFyIGRheVdpZHRoID0geFNjYWxlKGQzLnRpbWUuZGF5Lm9mZnNldChub3csIDEpKSAtXG4gICAgICAgICAgICAgICAgICAgIHhTY2FsZShub3cpO1xuICAgICAgICAgICAgICAgICAgc3RlcHMgPSBNYXRoLnJvdW5kKG9mZnNldCAvIGRheVdpZHRoKTtcbiAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHN0ZXBzICogZGF5V2lkdGggKyBsZWZ0T2ZmRml4O1xuICAgICAgICAgICAgICAgICAgbGVmdEJ0bi5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZShcIiArIG9mZnNldCArXG4gICAgICAgICAgICAgICAgICAgIFwiLCAxMylcIilcbiAgICAgICAgICAgICAgICAgIHRhc2suc3RhcnREYXRlID0gZDMudGltZS5kYXkub2Zmc2V0KHRhc2suX3N0YXJ0RGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgc3RlcHMpO1xuICAgICAgICAgICAgICAgICAgcmVkcmF3VGFzaygpO1xuICAgICAgICAgICAgICAgICAgdmFyIHgxID0gcGVyY2VudFgoKTtcbiAgICAgICAgICAgICAgICAgIHBlcmNlbnRCdG4uYXR0cihcInhcIiwgeDEpO1xuICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgIHcgPSB4U2NhbGUodGFzay5lbmREYXRlKSAtIHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgICAgICAgICB2YXIgbWFza1ggPSB4U2NhbGUodGFzay5zdGFydERhdGUpO1xuICAgICAgICAgICAgICAgICAgZHJhd01hc2sobWFza1gsIHcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJ6b29tZW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZWRyYXdNZW51KCk7XG4gICAgICAgICAgICAgIGNsZWFyTWFzaygpO1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5jaGFuZ2VTdGFydFRpbWVIYW5kbGVyID09PVxuICAgICAgICAgICAgICAgICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuY2hhbmdlRW5kVGltZUhhbmRsZXIodGFza0JveC5kYXRhKClbMF0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgLy/nu5PmnZ/ml7bpl7TosIPmlbTlvIDlp4tcbiAgICAgICAgICBlbmRUaW1lTGlzdGVuZXIub24oJ3pvb21zdGFydCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB0YXNrLl9zdGFydERhdGUgPSB0YXNrLnN0YXJ0RGF0ZTtcbiAgICAgICAgICAgICAgdGFzay5fZW5kRGF0ZSA9IHRhc2suZW5kRGF0ZTtcbiAgICAgICAgICAgICAgdGFzay5fc3RlcHMgPSAwO1xuICAgICAgICAgICAgICB0YXNrLl94Q3VyciA9IGQzLmV2ZW50LnNvdXJjZUV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICAgIHRhc2suX3dpZHRoID0geFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInpvb21zdGFydDpcIiArIHRhc2suX3hDdXJyKTtcbiAgICAgICAgICAgIH0pLm9uKFwiem9vbVwiLFxuICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICAgICAgICdbb2JqZWN0IE1vdXNlRXZlbnRdJykge1xuICAgICAgICAgICAgICAgICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgICAgICAgICAgICAgICB2YXIgY2xpZW50WCA9IGQzLmV2ZW50LnNvdXJjZUV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gY2xpZW50WCAtIHRhc2suX3hDdXJyO1xuICAgICAgICAgICAgICAgICAgLy/ov5nkuKrku7vliqHmnInlh6DlpKlcbiAgICAgICAgICAgICAgICAgIHZhciBkYXlzID0gZDMudGltZS5kYXlzKHRhc2suX3N0YXJ0RGF0ZSwgdGFzay5fZW5kRGF0ZSk7XG4gICAgICAgICAgICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgIHZhciBkYXlXaWR0aCA9IHhTY2FsZShkMy50aW1lLmRheS5vZmZzZXQobm93LCAxKSkgLVxuICAgICAgICAgICAgICAgICAgICB4U2NhbGUobm93KTtcbiAgICAgICAgICAgICAgICAgIHN0ZXBzID0gTWF0aC5yb3VuZChvZmZzZXQgLyBkYXlXaWR0aCk7XG4gICAgICAgICAgICAgICAgICBzdGVwcyA9IE1hdGgubWF4KDAgLSBkYXlzLmxlbmd0aCArIDEsIHN0ZXBzKTtcbiAgICAgICAgICAgICAgICAgIHZhciB4Q3VyciA9IHRhc2suX3dpZHRoICsgcmlnaHRPZmZGaXggKyBzdGVwcyAqXG4gICAgICAgICAgICAgICAgICAgIGRheVdpZHRoO1xuICAgICAgICAgICAgICAgICAgcmlnaHRCdG4uYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgeEN1cnIgK1xuICAgICAgICAgICAgICAgICAgICAnLCAxMyknKTtcbiAgICAgICAgICAgICAgICAgIHRhc2suZW5kRGF0ZSA9IGQzLnRpbWUuZGF5Lm9mZnNldCh0YXNrLl9lbmREYXRlLFxuICAgICAgICAgICAgICAgICAgICBzdGVwcyk7XG4gICAgICAgICAgICAgICAgICByZWRyYXdUYXNrKCk7XG4gICAgICAgICAgICAgICAgICB2YXIgdyA9IHhTY2FsZSh0YXNrLmVuZERhdGUpIC0geFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgICAgICAgICAgIGRyYXdNYXNrKHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSksIHcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJ6b29tZW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZWRyYXdNZW51KCk7XG4gICAgICAgICAgICAgIGNsZWFyTWFzaygpO1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5jaGFuZ2VFbmRUaW1lSGFuZGxlciA9PT1cbiAgICAgICAgICAgICAgICAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLmNoYW5nZUVuZFRpbWVIYW5kbGVyKHRhc2tCb3guZGF0YSgpWzBdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAvL+e7k+adn+aXtumXtOiwg+aVtOe7k+adn1xuXG5cbiAgICAgICAgICBsZWZ0QnRuID0gbXVGYWN0b3J5KGQzLCBjb25maWcsIG1lbnUsICdsZWZ0QnRuJyk7XG4gICAgICAgICAgcmlnaHRCdG4gPSBtdUZhY3RvcnkoZDMsIGNvbmZpZywgbWVudSwgJ3JpZ2h0QnRuJyk7XG4gICAgICAgICAgcGVyY2VudEJ0biA9IG11RmFjdG9yeShkMywgY29uZmlnLCBtZW51LCAncGVyY2VudEJ0bicpO1xuICAgICAgICAgIHZhciByaWdodFggPSB3ICsgcmlnaHRPZmZGaXg7XG4gICAgICAgICAgdmFyIHB4ID0gKCh3ICogdGFzay5wZXJjZW50IHx8IDApKTtcbiAgICAgICAgICBsZWZ0QnRuLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKFwiICsgbGVmdE9mZkZpeCArXG4gICAgICAgICAgICBcIiwgMTMpXCIpLmNhbGwoc3RhcnRUaW1lTGlzdGVuZXIpO1xuICAgICAgICAgIHJpZ2h0QnRuLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKFwiICsgcmlnaHRYICtcbiAgICAgICAgICAgIFwiLCAxMylcIikuY2FsbChlbmRUaW1lTGlzdGVuZXIpO1xuICAgICAgICAgIHBlcmNlbnRCdG4uYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoXCIgKyBweCArXG4gICAgICAgICAgICBcIiwgMTkpXCIpLmNhbGwocGVyY2VudExpc3RlbmVyKTtcbiAgICAgICAgICBwZXJjZW50QnRuLm9uKCdtb3VzZW92ZXInLCB0b29sdGlwLm1vdXNlb3ZlcilcbiAgICAgICAgICAgIC5vbignbW91c2VvdXQnLCB0b29sdGlwLm1vdXNlb3V0KVxuICAgICAgICAgICAgLm9uKCdtb3VzZW1vdmUnLCB0b29sdGlwLm1vdXNlbW92ZSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGVyY2VudFggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgdGFzayA9IHRhc2tCb3guZGF0YSgpWzBdO1xuICAgICAgICAgIHZhciB4ID0gMDtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhsZWZ0QnRuLmF0dHIoJ3gnKSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2cocmlnaHRCdG4uYXR0cigneCcpKTtcbiAgICAgICAgICAvLyB2YXIgbGVmdCA9IHBhcnNlRmxvYXQobGVmdEJ0bi5hdHRyKCd4JykpICsgMTA7XG4gICAgICAgICAgLy8gdmFyIHJpZ2h0ID0gcGFyc2VGbG9hdChyaWdodEJ0bi5hdHRyKCd4JykpIC0gMTA7XG4gICAgICAgICAgLy8geCA9IGxlZnQgKyAocmlnaHQgLSBsZWZ0KSAqICh0YXNrLnBlcmNlbnQgfHwgMCk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ2xlZnQ9JyArIGxlZnQgKyAnXFx0PScgKyByaWdodCArICdcXHQnICsgeCk7XG4gICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH1cblxuICAgICAgICAvL2NsaWNrXG4gICAgICAgIHZhciBjdXJ4LCBjdXJ5O1xuICAgICAgICB2YXIgY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGV2ZW50ID0gZDMuZXZlbnQ7XG4gICAgICAgICAgaWYgKGN1cnggPT0gZXZlbnQuY2xpZW50WCAmJiBjdXJ5ID09IGV2ZW50LmNsaWVudFkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgY3VyeCA9IGV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgY3VyeSA9IGV2ZW50LmNsaWVudFk7XG4gICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChkMy5ldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgZDMuZXZlbnQuY2xpZW50WSk7XG4gICAgICAgICAgdmFyIHRhc2tCb3ggPSBkMy5zZWxlY3QoZWwpO1xuICAgICAgICAgIGlmICh0YXNrQm94KSB7XG4gICAgICAgICAgICAvLyByZWRyYXdNZW51KCk7XG4gICAgICAgICAgICB2YXIgdGFzayA9IHRhc2tCb3guZGF0YSgpWzBdO1xuICAgICAgICAgICAgd2luZG93LmNvbmZpZy5zZWxlY3RJZCA9IHRhc2submFtZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVkcmF3TWVudSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy/nlLvooYxcbiAgICAgICAgdmFyIHJlZHJhd1Rhc2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygn6YeN55S75Lu75YqhJyk7XG4gICAgICAgICAgbGluZVN2Zy5zZWxlY3RBbGwoJy5pdGVtJykucmVtb3ZlKCk7XG4gICAgICAgICAgdGFza0JveC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAgIC5vbignY2xpY2snLCBjbGlja0hhbmRsZXIpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBjb25maWcuZXZlbnRDb2xvcilcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwiaXRlbVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIGNvbmZpZy54U2NhbGUoZC5zdGFydERhdGUpICtcbiAgICAgICAgICAgICAgICAnLCAxMyknXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDIwKVxuICAgICAgICAgICAgLmNhbGwodGFzayh7XG4gICAgICAgICAgICAgIHhTY2FsZTogY29uZmlnLnhTY2FsZSxcbiAgICAgICAgICAgICAgZXZlbnRDb2xvcjogY29uZmlnLmV2ZW50Q29sb3JcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICBpZiAoIWNvbmZpZy5yZWFkb25seSkge1xuICAgICAgICAgICAgdGFza0JveC5jYWxsKG1vdmVMaXN0ZW5lcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRhc2tCb3guZXhpdCgpLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJlZHJhd1Rhc2soKTtcblxuICAgICAgICAvL+eCueWHu+S7u+WKoeWQjuaYvuekuuS7u+WKoeeahOiwg+aVtOaooeW8j1xuICAgICAgICByZWRyYXdNZW51KCk7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgICAgICB2YXIgZHJhd01hc2sgPSBmdW5jdGlvbih4LCB3KSB7XG4gICAgICAgICAgdmFyIGJveCA9IGQzLnNlbGVjdCgnI2NvbnRhaW5lci1ib3gnKTtcbiAgICAgICAgICBib3guc2VsZWN0KCcubGxpbmUnKS5yZW1vdmUoKTtcbiAgICAgICAgICB2YXIgZyA9IGJveC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLy8gLmF0dHIoJ29wYWNpdHknLCAnMC40JylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdsbGluZScpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgeCArICcsIDApJyk7XG4gICAgICAgICAgZy5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgXCIjMGNjXCIpXG4gICAgICAgICAgICAuYXR0cignb3BhY2l0eScsICcwLjEnKVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGNvbmZpZy5ncmFwaEhlaWdodClcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIHcpXG5cbiAgICAgICAgICBnLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgICAuYXR0cigneDEnLCAwKVxuICAgICAgICAgICAgLmF0dHIoJ3kxJywgY29uZmlnLm1hcmdpbi50b3AgLSA0MClcbiAgICAgICAgICAgIC5hdHRyKCd4MicsIDApXG4gICAgICAgICAgICAuYXR0cigneTInLCBjb25maWcuZ3JhcGhIZWlnaHQgKyA0MCk7XG5cbiAgICAgICAgICBnLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgICAuYXR0cigneDEnLCB3KVxuICAgICAgICAgICAgLmF0dHIoJ3kxJywgY29uZmlnLm1hcmdpbi50b3AgLSA0MClcbiAgICAgICAgICAgIC5hdHRyKCd4MicsIHcpXG4gICAgICAgICAgICAuYXR0cigneTInLCBjb25maWcuZ3JhcGhIZWlnaHQgKyA0MCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2xlYXJNYXNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGJveCA9IGQzLnNlbGVjdCgnI2NvbnRhaW5lci1ib3gnKTtcbiAgICAgICAgICBib3guc2VsZWN0KCcubGxpbmUnKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWkhOeQhuS7u+WKoeW3puWPs+enu+WKqOeahOmXrumimFxuICAgICAgICBtb3ZlTGlzdGVuZXIub24oXCJ6b29tXCIsXG4gICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICAgJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZDMuZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgICBkMy5ldmVudC5jbGllbnRZKTtcbiAgICAgICAgICAgICAgdmFyIHggPSAwLFxuICAgICAgICAgICAgICAgIHcgPSAwO1xuICAgICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgICAgICAgdGFza0JveC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgICAgICAgICAgICAgdyA9IHhTY2FsZShkLmVuZERhdGUpIC0geFNjYWxlKGQuc3RhcnREYXRlKTtcbiAgICAgICAgICAgICAgICB4ID0geFNjYWxlKGQuc3RhcnREYXRlKSArIGQzLmV2ZW50LnRyYW5zbGF0ZVtcbiAgICAgICAgICAgICAgICAgIDBdOyAvL+enu+WKqOWQjueahOi3neemu1xuICAgICAgICAgICAgICAgIHZhciBkYXRlVGltZSA9IHhTY2FsZS5pbnZlcnQoeCk7IC8v6L2s5o2i5oiQ5paw55qE5pe26Ze0XG4gICAgICAgICAgICAgICAgdmFyIGRhdGUgPSBkMy50aW1lLmRheShkYXRlVGltZSk7IC8v5a+55pe26Ze06L+b6KGM5Y+W5pW0XG4gICAgICAgICAgICAgICAgeCA9IHhTY2FsZShkYXRlKTsgLy/ml7bpl7Tlj5bmlbTlkI7nmoTot53nprtcbiAgICAgICAgICAgICAgICBkLnN0YXJ0RGF0ZSA9IGRhdGU7XG4gICAgICAgICAgICAgICAgZC5lbmREYXRlID0geFNjYWxlLmludmVydCh4ICsgdyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHggKyAnLCAxMyknO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmVkcmF3TWVudSgpO1xuICAgICAgICAgICAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgICAgICAgZHJhd01hc2soeCwgdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSkub24oXCJ6b29tZW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBib3ggPSBkMy5zZWxlY3QoJyNjb250YWluZXItYm94Jyk7XG4gICAgICAgICAgYm94LnNlbGVjdCgnLmxsaW5lJykucmVtb3ZlKCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcuY2hhbmdlVGltZUhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNvbmZpZy5jaGFuZ2VUaW1lSGFuZGxlcih0YXNrQm94LmRhdGEoKVswXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgY29uZmlndXJhYmxlKGV2ZW50TGluZSwgY29uZmlnKTtcbiAgICByZXR1cm4gZXZlbnRMaW5lO1xuICB9O1xufTsiLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCBtb2R1bGUgKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmaWx0ZXJEYXRlKGRhdGEsIHhTY2FsZSwgeVNjYWxlLCB5TWluLCB5TWF4LFxuICBmdWxsUmVkcmF3KSB7XG4gIGRhdGEgPSBkYXRhIHx8IFtdO1xuICB2YXIgZmlsdGVyZWREYXRhID0gW107XG4gIHZhciBib3VuZGFyeSA9IHhTY2FsZS5yYW5nZSgpO1xuICB2YXIgbWluID0gYm91bmRhcnlbMF07XG4gIHZhciBtYXggPSBib3VuZGFyeVsxXTtcbiAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGRhdHVtKSB7XG4gICAgdmFyIHN0YXJ0ID0geFNjYWxlKGRhdHVtLnN0YXJ0RGF0ZSk7XG4gICAgdmFyIGVuZCA9IHhTY2FsZShkYXR1bS5lbmREYXRlKTtcbiAgICB2YXIgeSA9IHlTY2FsZShkYXR1bS51dWlkKTtcbiAgICBpZiAoZW5kIDwgbWluIHx8IHN0YXJ0ID4gbWF4KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghZnVsbFJlZHJhdyAmJiAoeSA8IHlNaW4gfHwgeSA+IHlNYXgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZpbHRlcmVkRGF0YS5wdXNoKGRhdHVtKTtcbiAgfSk7XG4gIHJldHVybiBmaWx0ZXJlZERhdGE7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgbW9kdWxlICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZmlsdGVyRGF0ZShkYXRhLCBzY2FsZSwgbGl0ZSkge1xuICBkYXRhID0gZGF0YSB8fCBbXTtcbiAgdmFyIGZpbHRlcmVkRGF0YSA9IFtdO1xuICB2YXIgb2Zmc2V0ID0gJCgnI3Njcm9sbGVyJykub2Zmc2V0KCkudG9wO1xuICB2YXIgeU1pbiA9IDAgLSBvZmZzZXQ7XG4gIHZhciB5TWF4ID0gMCAtIG9mZnNldCArICQoJyN3cmFwcGVyJykuaGVpZ2h0KCk7XG4gIHZhciBjb3VudCA9IDA7XG4gIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgLy8gaWYgKGxpdGUpIHtcbiAgICAvLyAgIHZhciBuYW1lID0gZC5uYW1lO1xuICAgIC8vICAgdmFyIHkgPSBzY2FsZShuYW1lKTtcbiAgICAvLyAgIGNvbnNvbGUubG9nKFt5LCB5TWluLCB5TWF4XS5qb2luKCcsJykpXG4gICAgLy8gICB2YXIgX2QgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZCk7XG4gICAgLy8gICBpZiAoeSA8IHlNaW4gfHwgeSA+IHlNYXgpIHtcbiAgICAvLyAgICAgX2QudGFza3MubGVuZ3RoID0gMDtcbiAgICAvLyAgIH0gZWxzZSB7XG4gICAgLy8gICAgIGNvdW50Kys7XG4gICAgLy8gICB9XG4gICAgLy8gICBmaWx0ZXJlZERhdGEucHVzaChfZCk7XG4gICAgLy8gfSBlbHNlIHtcbiAgICBmaWx0ZXJlZERhdGEucHVzaChkKTtcbiAgICAvLyB9XG4gIH0pO1xuICBjb25zb2xlLmxvZygnY291bnQ9PT0nICsgY291bnQpO1xuXG4gIHJldHVybiBmaWx0ZXJlZERhdGE7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBkMyAqL1xuXG52YXIgY29uZmlndXJhYmxlID0gcmVxdWlyZSgnLi91dGlsL2NvbmZpZ3VyYWJsZScpO1xudmFyIGZpbHRlckRhdGEgPSByZXF1aXJlKCcuL2ZpbHRlckRhdGEnKTtcblxudmFyIGRlZmF1bHRDb25maWcgPSB7XG4gIHhTY2FsZTogbnVsbFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkMykge1xuICByZXR1cm4gZnVuY3Rpb24oY29uZmlnKSB7XG5cbiAgICBjb25maWcgPSBjb25maWcgfHwge1xuICAgICAgeFNjYWxlOiBudWxsLFxuICAgICAgeVNjYWxlOiBudWxsXG4gICAgfTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdENvbmZpZykge1xuICAgICAgY29uZmlnW2tleV0gPSBjb25maWdba2V5XSB8fCBkZWZhdWx0Q29uZmlnW2tleV07XG4gICAgfVxuICAgIHZhciB4U2NhbGUgPSBjb25maWcueFNjYWxlO1xuICAgIHZhciBsZWZ0QnRuID0gZnVuY3Rpb24gbGVmdEJ0bihzZWxlY3Rpb24pIHtcbiAgICAgIHNlbGVjdGlvbi5lYWNoKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnNlbGVjdEFsbCgnLmxlZnRCdG4nKS5yZW1vdmUoKTtcbiAgICAgICAgdmFyIGxlZnRMaW5lID0gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKC0xOSwgMTMpXCIpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2J0biBsZWZ0QnRuJyk7XG4gICAgICAgIGxlZnRMaW5lLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgLmF0dHIoJ2QnLFxuICAgICAgICAgICAgJ00gMCAwIEwgMTEgMCBxIC0yIDIgLTIgNyBMIDExIDExIEwgIDAgMTEgeicpXG4gICAgICAgICAgLmF0dHIoJ3N0cm9rZScsICcjODg4JylcbiAgICAgICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgJzEnKVxuICAgICAgICAgIC5hdHRyKCdmaWxsJywgJyMxZjk2ZDgnKVxuICAgICAgICBsZWZ0TGluZS5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgIC5hdHRyKCd4MScsICczJylcbiAgICAgICAgICAuYXR0cigneTEnLCAnMicpXG4gICAgICAgICAgLmF0dHIoJ3gyJywgJzMnKVxuICAgICAgICAgIC5hdHRyKCd5MicsICc5JylcbiAgICAgICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgICAgIGxlZnRMaW5lLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgLmF0dHIoJ3gxJywgJzYnKVxuICAgICAgICAgIC5hdHRyKCd5MScsICcyJylcbiAgICAgICAgICAuYXR0cigneDInLCAnNicpXG4gICAgICAgICAgLmF0dHIoJ3kyJywgJzknKVxuICAgICAgICAgIC5hdHRyKCdmaWxsJywgJ3doaXRlJylcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25maWd1cmFibGUobGVmdEJ0biwgY29uZmlnKTtcblxuICAgIHJldHVybiBsZWZ0QnRuO1xuICB9O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgYXBwID0gcmVxdWlyZSgnLi9hcHAnKTtcblxuaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gIGRlZmluZSgnZDMuY2hhcnQuYXBwJywgW1wiZDNcIl0sIGZ1bmN0aW9uKGQzKSB7XG4gICAgZDMuY2hhcnQgPSBkMy5jaGFydCB8fCB7fTtcbiAgICBkMy5jaGFydC5hcHAgPSBhcHAoZDMpO1xuICB9KTtcbn0gZWxzZSBpZiAod2luZG93KSB7XG4gIHdpbmRvdy5kMy5jaGFydCA9IHdpbmRvdy5kMy5jaGFydCB8fCB7fTtcbiAgd2luZG93LmQzLmNoYXJ0LmFwcCA9IGFwcCh3aW5kb3cuZDMpO1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBhcHA7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGQzLCBjb25maWcsIGdyYXBoLCB3aGVyZSkge1xuXG5cbiAgdmFyIGl0ZW1zID0ge307XG5cbiAgdmFyIGJ1aWxkTGVmdCA9IGZ1bmN0aW9uKCkge1xuICAgIGl0ZW1zWydsZWZ0QnRuJ10gPSBncmFwaC5zZWxlY3RBbGwoJy5sZWZ0QnRuJykucmVtb3ZlKCk7XG4gICAgdmFyIGxlZnRMaW5lID0gZ3JhcGhcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKDAsIDEzKVwiKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2J0biBsZWZ0QnRuJyk7XG4gICAgbGVmdExpbmUuYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdkJyxcbiAgICAgICAgJ00gMCAwIEwgMTEgMCBxIC0yIDIgLTIgNyBMIDExIDExIEwgIDAgMTEgeicpXG4gICAgICAuYXR0cignc3Ryb2tlJywgJyM4ODgnKVxuICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsICcxJylcbiAgICAgIC5hdHRyKCdmaWxsJywgJyMxZjk2ZDgnKVxuICAgIGxlZnRMaW5lLmFwcGVuZCgnbGluZScpXG4gICAgICAuYXR0cigneDEnLCAnMycpXG4gICAgICAuYXR0cigneTEnLCAnMicpXG4gICAgICAuYXR0cigneDInLCAnMycpXG4gICAgICAuYXR0cigneTInLCAnOScpXG4gICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgbGVmdExpbmUuYXBwZW5kKCdsaW5lJylcbiAgICAgIC5hdHRyKCd4MScsICc2JylcbiAgICAgIC5hdHRyKCd5MScsICcyJylcbiAgICAgIC5hdHRyKCd4MicsICc2JylcbiAgICAgIC5hdHRyKCd5MicsICc5JylcbiAgICAgIC5hdHRyKCdmaWxsJywgJ3doaXRlJylcbiAgICByZXR1cm4gbGVmdExpbmU7XG4gIH1cblxuXG4gIHZhciBidWlsZFJpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gICAgaXRlbXNbJ3JpZ2h0QnRuJ10gPSBncmFwaC5zZWxlY3RBbGwoJy5yaWdodEJ0bicpLnJlbW92ZSgpO1xuICAgIHZhciByaWdodEJ0biA9IGdyYXBoXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZSgwLCAxMylcIilcbiAgICAgIC5hdHRyKCdjbGFzcycsICdidG4gcmlnaHRCdG4nKTtcbiAgICByaWdodEJ0bi5hcHBlbmQoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2QnLFxuICAgICAgICAnTSAwIDAgIHEgMiAyIDIgOCAgTCAgMCAxMSAgTCAxMSAxMSBMIDExIDAgeicpXG4gICAgICAuYXR0cignc3Ryb2tlJywgJyM4ODgnKVxuICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsICcxJylcbiAgICAgIC5hdHRyKCdmaWxsJywgJyMxZjk2ZDgnKVxuICAgIHJpZ2h0QnRuLmFwcGVuZCgnbGluZScpXG4gICAgICAuYXR0cigneDEnLCAnNScpXG4gICAgICAuYXR0cigneTEnLCAnMicpXG4gICAgICAuYXR0cigneDInLCAnNScpXG4gICAgICAuYXR0cigneTInLCAnOScpXG4gICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgcmlnaHRCdG4uYXBwZW5kKCdsaW5lJylcbiAgICAgIC5hdHRyKCd4MScsICc4JylcbiAgICAgIC5hdHRyKCd5MScsICcyJylcbiAgICAgIC5hdHRyKCd4MicsICc4JylcbiAgICAgIC5hdHRyKCd5MicsICc5JylcbiAgICAgIC5hdHRyKCdmaWxsJywgJ3doaXRlJylcbiAgICByZXR1cm4gcmlnaHRCdG47XG4gIH1cblxuICB2YXIgYnVpbGRQZXJjZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgaXRlbXNbJ3BlcmNlbnRCdG4nXSA9IGdyYXBoLnNlbGVjdEFsbCgnLnBlcmNlbnRCdG4nKS5yZW1vdmUoKTtcbiAgICB2YXIgcGVyY2VudEJ0biA9IGdyYXBoXG4gICAgICAuYXBwZW5kKCdwb2x5bGluZScpXG4gICAgICAuYXR0cignc3Ryb2tlJywgXCIjYTBhMGEwXCIpXG4gICAgICAuYXR0cignY2xhc3MnLCBcInBlcmNlbnRCdG5cIilcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIDE4KScpXG4gICAgICAuYXR0cigncG9pbnRzJywgJzAsMCA2LDcgNiwxMywgLTYsMTMgLTYsNyAwLDAnKVxuICAgICAgLmF0dHIoJ3N0eWxlJywgJ2ZpbGw6d2hpdGU7c3Ryb2tlLXdpZHRoOjEnKVxuICAgIHJldHVybiBwZXJjZW50QnRuO1xuICB9XG5cbiAgdmFyIGRyYXdYQXhpcyA9IGZ1bmN0aW9uIGRyYXdYQXhpcygpIHtcbiAgICAvLyBjb25zb2xlLmxvZygnd2hlcmU9PT0nICsgd2hlcmUpO1xuICAgIHN3aXRjaCAod2hlcmUpIHtcbiAgICAgIGNhc2UgJ2xlZnRCdG4nOlxuICAgICAgICByZXR1cm4gYnVpbGRMZWZ0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncmlnaHRCdG4nOlxuICAgICAgICByZXR1cm4gYnVpbGRSaWdodCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3BlcmNlbnRCdG4nOlxuICAgICAgICByZXR1cm4gYnVpbGRQZXJjZW50KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcblxuICAgIH1cbiAgfTtcblxuICByZXR1cm4gZHJhd1hBeGlzKCk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBkMyAqL1xuXG52YXIgY29uZmlndXJhYmxlID0gcmVxdWlyZSgnLi91dGlsL2NvbmZpZ3VyYWJsZScpO1xudmFyIGZpbHRlckRhdGEgPSByZXF1aXJlKCcuL2ZpbHRlckRhdGEnKTtcblxudmFyIGRlZmF1bHRDb25maWcgPSB7XG4gIHhTY2FsZTogbnVsbFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkMykge1xuICByZXR1cm4gZnVuY3Rpb24oY29uZmlnKSB7XG5cbiAgICBjb25maWcgPSBjb25maWcgfHwge1xuICAgICAgeFNjYWxlOiBudWxsLFxuICAgICAgeVNjYWxlOiBudWxsXG4gICAgfTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdENvbmZpZykge1xuICAgICAgY29uZmlnW2tleV0gPSBjb25maWdba2V5XSB8fCBkZWZhdWx0Q29uZmlnW2tleV07XG4gICAgfVxuICAgIHZhciB4U2NhbGUgPSBjb25maWcueFNjYWxlO1xuICAgIHZhciByaWdodEJ0biA9IGZ1bmN0aW9uIHJpZ2h0QnRuKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCcucmlnaHRCdG4nKS5yZW1vdmUoKTtcbiAgICAgICAgdmFyIGxlZnRMaW5lID0gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKC0xOSwgMTMpXCIpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2J0biByaWdodEJ0bicpO1xuICAgICAgICBsZWZ0TGluZS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAgIC5hdHRyKCdkJyxcbiAgICAgICAgICAgICdNIDAgMCBMIDExIDAgcSAtMiAyIC0yIDcgTCAxMSAxMSBMICAwIDExIHonKVxuICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCAnIzg4OCcpXG4gICAgICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsICcxJylcbiAgICAgICAgICAuYXR0cignZmlsbCcsICcjMWY5NmQ4JylcbiAgICAgICAgbGVmdExpbmUuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgICAuYXR0cigneDEnLCAnMycpXG4gICAgICAgICAgLmF0dHIoJ3kxJywgJzInKVxuICAgICAgICAgIC5hdHRyKCd4MicsICczJylcbiAgICAgICAgICAuYXR0cigneTInLCAnOScpXG4gICAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgICAgICBsZWZ0TGluZS5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgIC5hdHRyKCd4MScsICc2JylcbiAgICAgICAgICAuYXR0cigneTEnLCAnMicpXG4gICAgICAgICAgLmF0dHIoJ3gyJywgJzYnKVxuICAgICAgICAgIC5hdHRyKCd5MicsICc5JylcbiAgICAgICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uZmlndXJhYmxlKHJpZ2h0QnRuLCBjb25maWcpO1xuXG4gICAgcmV0dXJuIHJpZ2h0QnRuO1xuICB9O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIHJlcXVpcmUsIG1vZHVsZSwgZDMgKi9cblxudmFyIGNvbmZpZ3VyYWJsZSA9IHJlcXVpcmUoJy4vdXRpbC9jb25maWd1cmFibGUnKTtcbnZhciBmaWx0ZXJEYXRhID0gcmVxdWlyZSgnLi9maWx0ZXJEYXRhJyk7XG5cbnZhciBkZWZhdWx0Q29uZmlnID0ge1xuICB4U2NhbGU6IG51bGxcbn07XG5cbnZhciBmb3JtYXRlciA9IGQzLnRpbWUuZm9ybWF0KFwiJVktJW0tJWQgJUg6JU06JVNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkMykge1xuICByZXR1cm4gZnVuY3Rpb24oY29uZmlnKSB7XG5cbiAgICBjb25maWcgPSBjb25maWcgfHwge1xuICAgICAgeFNjYWxlOiBudWxsLFxuICAgICAgeVNjYWxlOiBudWxsXG4gICAgfTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdENvbmZpZykge1xuICAgICAgY29uZmlnW2tleV0gPSBjb25maWdba2V5XSB8fCBkZWZhdWx0Q29uZmlnW2tleV07XG4gICAgfVxuICAgIHZhciB4U2NhbGUgPSBjb25maWcueFNjYWxlO1xuICAgIHZhciB0YXNrID0gZnVuY3Rpb24gdGFzayhzZWxlY3Rpb24pIHtcbiAgICAgIHNlbGVjdGlvbi5lYWNoKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCfnlLvku7vliqEnKTtcbiAgICAgICAgLy8g55+p5b2i5pi+56S65pa55qGIXG4gICAgICAgIHZhciBjb250YWluZXIgPSBkMy5zZWxlY3QodGhpcyk7XG4gICAgICAgIGNvbnRhaW5lci5zZWxlY3RBbGwoJy50YXNrJykucmVtb3ZlKCk7XG5cbiAgICAgICAgdmFyIHNob3dUYXNrID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICB2YXIgZmlsbENvbG9yID0gXCIjMGNjXCI7XG4gICAgICAgICAgaWYgKGRhdGEuZW5kRGF0ZSA8IG5ldyBEYXRlKCkpIHtcbiAgICAgICAgICAgIGZpbGxDb2xvciA9ICdyZWQnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBiYWNrZ3JvdW5kID0gY29udGFpbmVyLmFwcGVuZCgncmVjdCcpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBcInRyYW5zcGFyZW50XCIpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCBcInRhc2sgYmFja2dyb3VuZFwiKVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDEwKVxuICAgICAgICAgICAgLmF0dHIoJ3J4JywgNClcbiAgICAgICAgICAgIC5hdHRyKCdyeScsIDQpXG4gICAgICAgICAgICAuYXR0cignc3Ryb2tlJywgXCIjYTBhMGEwXCIpXG4gICAgICAgICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgMSlcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkYXRhLmVuZERhdGUgKyAnXFx0JyArIGRhdGEuc3RhcnREYXRlICtcbiAgICAgICAgICAgICAgLy8gICAnXFx0JyArICh4U2NhbGUoZGF0YS5lbmREYXRlKSAtIHhTY2FsZShkYXRhLnN0YXJ0RGF0ZSkpXG4gICAgICAgICAgICAgIC8vICk7XG4gICAgICAgICAgICAgIHJldHVybiAoeFNjYWxlKGRhdGEuZW5kRGF0ZSkgLSB4U2NhbGUoZGF0YS5zdGFydERhdGUpKVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICB2YXIgcHJlID0gY29udGFpbmVyLmFwcGVuZCgncmVjdCcpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBcIiM2ZGYzZDJcIilcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCBcIiNhMGEwYTBcIilcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwidGFzayBwcmVcIilcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZSgwLCAwLjUpXCIpXG4gICAgICAgICAgICAuYXR0cigncngnLCA0KVxuICAgICAgICAgICAgLmF0dHIoJ3J5JywgNClcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCAxMClcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gKGNvbmZpZy54U2NhbGUoZGF0YS5lbmREYXRlKSAtIGNvbmZpZy54U2NhbGUoXG4gICAgICAgICAgICAgICAgZGF0YS5zdGFydERhdGUpKSAqIGRhdGEucGVyY2VudCB8fCAwO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgc2hvd1BhY2thZ2UgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgIHZhciBmaWxsQ29sb3IgPSBcIiMwY2NcIjtcbiAgICAgICAgICBpZiAoZGF0YS5lbmREYXRlIDwgbmV3IERhdGUoKSkge1xuICAgICAgICAgICAgZmlsbENvbG9yID0gJ3JlZCc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHcgPSB4U2NhbGUoZGF0YS5lbmREYXRlKSAtIHhTY2FsZShkYXRhLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgdmFyIHB3ID0gdyAqIGRhdGEucGVyY2VudCB8fCAwO1xuICAgICAgICAgIHZhciBiYWNrZ3JvdW5kID0gY29udGFpbmVyLmFwcGVuZCgncG9seWxpbmUnKVxuICAgICAgICAgICAgLmF0dHIoJ3N0cm9rZScsIFwiI2EwYTBhMFwiKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgXCJ0YXNrIHByZVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKDAsIDAuNSlcIilcbiAgICAgICAgICAgIC5hdHRyKCdwb2ludHMnLCAnMCwwICcgKyB3ICsgJywwICcgKyB3ICsgJywxMCAnICsgKHcgLVxuICAgICAgICAgICAgICA1KSArICcsNyA1LDcgMCwxMCAwLDAnKVxuICAgICAgICAgICAgLmF0dHIoJ3N0eWxlJywgJ2ZpbGw6d2hpdGU7c3Ryb2tlLXdpZHRoOjEnKTtcblxuXG4gICAgICAgICAgdmFyIHByZSA9IGNvbnRhaW5lci5hcHBlbmQoJ3BvbHlsaW5lJylcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCBcIiNhMGEwYTBcIilcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwidGFzayBwcmVcIilcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZSgwLCAwLjUpXCIpXG4gICAgICAgICAgICAuYXR0cignc3R5bGUnLCAnZmlsbDpmZjljNGM7c3Ryb2tlLXdpZHRoOjEnKTtcblxuICAgICAgICAgIGlmIChwdyA8IDUpIHtcbiAgICAgICAgICAgIHByZS5hdHRyKCdwb2ludHMnLCAnMCwwICcgKyBwdyArICcsMCAnICsgcHcgK1xuICAgICAgICAgICAgICAnLDcgJyArIHB3ICsgJyw3IDAsMTAgMCwwJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChwdyA+PSA1ICYmIHB3IDwgKHcgLSA1KSkge1xuICAgICAgICAgICAgcHJlLmF0dHIoJ3BvaW50cycsICcwLDAgJyArIHB3ICsgJywwICcgKyBwdyArXG4gICAgICAgICAgICAgICcsNyA1LDcgMCwxMCAwLDAnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHB3ID49ICh3IC0gNSkpIHtcbiAgICAgICAgICAgIHByZS5hdHRyKCdwb2ludHMnLCAnMCwwICcgKyBwdyArICcsMCAnICsgcHcgK1xuICAgICAgICAgICAgICAnLDcgJyArICh3IC0gNSkgKyAnLDcgNSw3IDAsMTAgMCwwJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChkYXRhLnBhY2thZ2UpIHtcbiAgICAgICAgICBzaG93UGFja2FnZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNob3dUYXNrKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBjb25maWd1cmFibGUodGFzaywgY29uZmlnKTtcblxuICAgIHJldHVybiB0YXNrO1xuICB9O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY29uZmlndXJhYmxlKHRhcmdldEZ1bmN0aW9uLCBjb25maWcsIGxpc3RlbmVycykge1xuICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMgfHwge307XG4gIGZvciAodmFyIGl0ZW0gaW4gY29uZmlnKSB7XG4gICAgKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHRhcmdldEZ1bmN0aW9uW2l0ZW1dID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gY29uZmlnW2l0ZW1dO1xuICAgICAgICBjb25maWdbaXRlbV0gPSB2YWx1ZTtcbiAgICAgICAgaWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShpdGVtKSkge1xuICAgICAgICAgIGxpc3RlbmVyc1tpdGVtXSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRhcmdldEZ1bmN0aW9uO1xuICAgICAgfTtcbiAgICB9KShpdGVtKTsgLy8gZm9yIGRvZXNuJ3QgY3JlYXRlIGEgY2xvc3VyZSwgZm9yY2luZyBpdFxuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkMywgY29uZmlnLCB4U2NhbGUsIGdyYXBoLCBncmFwaEhlaWdodCwgd2hlcmUpIHtcbiAgdmFyIHhBeGlzID0ge307XG4gIHZhciB4QXhpc0VscyA9IHt9O1xuXG4gIHZhciB0aWNrRm9ybWF0RGF0YSA9IFtdO1xuXG4gIGNvbmZpZy50aWNrRm9ybWF0LmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgIHZhciB0aWNrID0gaXRlbS5zbGljZSgwKTtcbiAgICB0aWNrRm9ybWF0RGF0YS5wdXNoKHRpY2spO1xuICB9KTtcblxuICB2YXIgdGlja0Zvcm1hdCA9IGNvbmZpZy5sb2NhbGUgPyBjb25maWcubG9jYWxlLnRpbWVGb3JtYXQubXVsdGkoXG4gICAgdGlja0Zvcm1hdERhdGEpIDogZDMudGltZS5mb3JtYXQubXVsdGkodGlja0Zvcm1hdERhdGEpO1xuXG4gIHhBeGlzW3doZXJlXSA9IGQzLnN2Zy5heGlzKClcbiAgICAuc2NhbGUoeFNjYWxlKVxuICAgIC5vcmllbnQod2hlcmUpXG4gICAgLnRpY2tzKGNvbmZpZy5zdGVwKVxuICAgIC8vIC50aWNrU2l6ZSg2LCAxMClcbiAgICAvLyAuaW5uZXJUaWNrU2l6ZSg2KVxuICAgIC8vIC5vdXRlclRpY2tTaXplKDQpXG4gICAgLy8gLnRpY2tQYWRkaW5nKDEwKVxuICAgIC50aWNrRm9ybWF0KHRpY2tGb3JtYXQpO1xuXG4gIHZhciBsaW5lWSA9ICh3aGVyZSA9PSAnYm90dG9tJykgPyAwIDogY29uZmlnLm1hcmdpbi50b3AgLSAyO1xuXG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgd2luZG93LnhTY2FsZSA9IHhTY2FsZTtcblxuICB2YXIgc2NhbGUgPSB4U2NhbGUuZG9tYWluKCk7XG4gIHZhciBzdGFydCA9IGQzLnRpbWUuZGF5Lm9mZnNldChzY2FsZVswXSwgLTcpO1xuICB2YXIgZW5kID0gZDMudGltZS5kYXkub2Zmc2V0KHNjYWxlWzFdLCArNyk7XG4gIHZhciBkYXlzID0gZDMudGltZS5kYXlzKHN0YXJ0LCBlbmQpO1xuXG4gIHZhciB4QXhpc0JveCA9IG51bGw7XG4gIGdyYXBoLnNlbGVjdEFsbCgnLnhBeGlzQm94JykucmVtb3ZlKCk7XG4gIHZhciBib3ggPSBncmFwaC5hcHBlbmQoJ2cnKS5jbGFzc2VkKCd4QXhpc0JveCcsIHRydWUpO1xuICB4QXhpc0JveCA9IGJveC5zZWxlY3RBbGwoJ2cnKS5kYXRhKGRheXMpO1xuXG4gIHZhciBvID0geEF4aXNCb3guZW50ZXIoKVxuICAgIC5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHZhciBkYXkgPSBkLmdldERheSgpO1xuICAgICAgaWYgKGRheSA9PSAwIHx8IGRheSA9PSA2KSB7XG4gICAgICAgIHJldHVybiAnZCBoJ1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICdkJ1xuICAgICAgfVxuICAgIH0pXG4gICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyAoeFNjYWxlKGQpKSArICcsMCknO1xuICAgIH0pO1xuXG4gIG8uYXBwZW5kKCdyZWN0JylcbiAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbihkKSB7XG4gICAgICB2YXIgbmV4dCA9IGQzLnRpbWUuZGF5Lm9mZnNldChkLCAxKTtcbiAgICAgIHJldHVybiB4U2NhbGUobmV4dCkgLSB4U2NhbGUoZCkgLSAxO1xuICAgIH0pXG4gICAgLmF0dHIoJ2hlaWdodCcsIDIwKVxuXG4gIG8uYXBwZW5kKCd0ZXh0JylcbiAgICAuYXR0cihcImR4XCIsIDEwKVxuICAgIC5hdHRyKFwiZHlcIiwgMTMpXG4gICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIGQuZ2V0VVRDRGF0ZSgpO1xuICAgIH0pO1xuXG4gIHhBeGlzQm94LmV4aXQoKS5yZW1vdmUoKTtcblxuXG5cbiAgdmFyIHN0YXJ0ID0gZDMudGltZS5kYXkub2Zmc2V0KHNjYWxlWzBdLCAtNDApO1xuICB2YXIgZW5kID0gZDMudGltZS5kYXkub2Zmc2V0KHNjYWxlWzFdLCArNDApO1xuICB2YXIgbW9udGhzID0gZDMudGltZS5tb250aHMoc3RhcnQsIGVuZCk7XG5cbiAgdmFyIHhBeGlzTW9udGhCb3ggPSBudWxsO1xuICBncmFwaC5zZWxlY3RBbGwoJy54QXhpc01vbnRoQm94JykucmVtb3ZlKCk7XG4gIHZhciBib3hNb250aCA9IGdyYXBoLmFwcGVuZCgnZycpLmNsYXNzZWQoJ3hBeGlzTW9udGhCb3gnLCB0cnVlKTtcbiAgeEF4aXNNb250aEJveCA9IGJveE1vbnRoLnNlbGVjdEFsbCgnZycpLmRhdGEobW9udGhzKTtcblxuICB2YXIgbyA9IHhBeGlzTW9udGhCb3guZW50ZXIoKVxuICAgIC5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICB2YXIgZHggPSBkMy50aW1lLmRheS5vZmZzZXQoZCwgKzEpXG4gICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgKHhTY2FsZShkeCkpICsgJywwKSc7XG4gICAgfSlcbiAgICAvLyAuc3R5bGUoJ2ZpbGwnLCBjb25maWcuZXZlbnRMaW5lQ29sb3IpXG5cbiAgby5hcHBlbmQoJ3JlY3QnKVxuICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHZhciBuZXh0ID0gZDMudGltZS5kYXkub2Zmc2V0KGQsIDMxKTtcbiAgICAgIG5leHQgPSBkMy50aW1lLm1vbnRoKG5leHQpO1xuICAgICAgcmV0dXJuIHhTY2FsZShuZXh0KSAtIHhTY2FsZShkKSAtIDE7XG4gICAgfSlcbiAgICAuYXR0cignZmlsbCcsICcjZGRkZGRkJylcbiAgICAuYXR0cignaGVpZ2h0JywgMjApXG5cbiAgby5hcHBlbmQoJ3RleHQnKVxuICAgIC5hdHRyKFwiZHhcIiwgMTApXG4gICAgLmF0dHIoXCJkeVwiLCAxMylcbiAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSg2MDAsIDApJylcbiAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gZC5nZXRVVENGdWxsWWVhcigpICsgJ+W5tCcgKyBkLmdldFVUQ01vbnRoKCkgKyAn5pyIJztcbiAgICB9KTtcblxuICB4QXhpc01vbnRoQm94LmV4aXQoKS5yZW1vdmUoKTtcblxuICBpZiAod2hlcmUgPT0gJ3RvcCcpIHtcbiAgICBib3guYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCAyMiknKTtcbiAgICBib3hNb250aC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIDEpJyk7XG4gIH0gZWxzZSB7XG4gICAgYm94LmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwgMiknKTtcbiAgICBib3hNb250aC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIDIzKScpO1xuICB9XG5cbiAgZ3JhcGguc2VsZWN0QWxsKCdsaW5lJykucmVtb3ZlKCk7XG4gIHZhciBsaW5lID0gZ3JhcGguYXBwZW5kKCdsaW5lJylcbiAgICAuYXR0cigneDEnLCAwKVxuICAgIC5hdHRyKCd4MicsIGNvbmZpZy53aWR0aClcbiAgICAuYXR0cigneTEnLCBsaW5lWSlcbiAgICAuYXR0cigneTInLCBsaW5lWSk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaWYgKHR5cGVvZiBjb25maWcuYXhpc0Zvcm1hdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbmZpZy5heGlzRm9ybWF0KHhBeGlzKTtcbiAgfVxuXG4gIC8vIHhBeGlzRWxzW3doZXJlXSA9IGdyYXBoXG4gIC8vICAgLmFwcGVuZCgnZycpXG4gIC8vICAgLmNsYXNzZWQoJ3gtYXhpcyBheGlzJywgdHJ1ZSlcbiAgLy8gICAuY2xhc3NlZCh3aGVyZSwgdHJ1ZSlcbiAgLy8gICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgY29uZmlnLm1hcmdpbi5sZWZ0ICsgJywgJyArIHkgKyAnKScpXG4gIC8vICAgLmNhbGwoeEF4aXNbd2hlcmVdKTtcblxuICB2YXIgZHJhd1hBeGlzID0gZnVuY3Rpb24gZHJhd1hBeGlzKCkge1xuICAgIHhBeGlzRWxzW3doZXJlXVxuICAgICAgLmNhbGwoeEF4aXNbd2hlcmVdKTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGRyYXdYQXhpczogZHJhd1hBeGlzXG4gIH07XG59OyJdfQ==
