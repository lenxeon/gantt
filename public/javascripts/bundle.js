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
            .attr('height', wrapperHeight)
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvYXBwLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2V2ZW50TGluZS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9maWx0ZXJEYXRhLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2ZpbHRlckxpbmUuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvbGVmdEJ0bi5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9tYWluLmpzIiwicHVibGljL2phdmFzY3JpcHRzL211SXRlbXMuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvcmlnaHRCdG4uanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvdGFzay5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy91dGlsL2NvbmZpZ3VyYWJsZS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy94QXhpcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xudmFyIGNvbmZpZ3VyYWJsZSA9IHJlcXVpcmUoJy4vdXRpbC9jb25maWd1cmFibGUnKTtcbnZhciB4QXhpc0ZhY3RvcnkgPSByZXF1aXJlKCcuL3hBeGlzJyk7XG52YXIgZmlsdGVyTGluZSA9IHJlcXVpcmUoJy4vZmlsdGVyTGluZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGQzKSB7XG4gIHZhciBldmVudExpbmUgPSByZXF1aXJlKCcuL2V2ZW50TGluZScpKGQzKTtcblxuICAvL+S4gOS6m+m7mOiupOeahOmFjee9rlxuICB2YXIgZGVmYXVsdENvbmZpZyA9IHtcbiAgICBuYW1lOiAncHJvamVjdCBtYW5hZ2VyJyxcbiAgICBzdGFydDogZDMudGltZS5kYXkobmV3IERhdGUoKSksXG4gICAgZW5kOiBkMy50aW1lLmRheS5vZmZzZXQoZDMudGltZS5kYXkobmV3IERhdGUoKSksIDcpLFxuICAgIG1pblNjYWxlOiAwLFxuICAgIG1heFNjYWxlOiAxMDAsXG4gICAgbWFyZ2luOiB7XG4gICAgICB0b3A6IDQ1LFxuICAgICAgbGVmdDogMCxcbiAgICAgIGJvdHRvbTogNDUsXG4gICAgICByaWdodDogMFxuICAgIH0sXG4gICAgdGlja0Zvcm1hdDogW1xuICAgICAgW1wiLiVMXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuZ2V0TWlsbGlzZWNvbmRzKCk7XG4gICAgICB9XSxcbiAgICAgIFtcIjolU1wiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLmdldFNlY29uZHMoKTtcbiAgICAgIH1dLFxuICAgICAgW1wiJUk6JU1cIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXRNaW51dGVzKCk7XG4gICAgICB9XSxcbiAgICAgIFtcIiVJICVwXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuZ2V0SG91cnMoKTtcbiAgICAgIH1dLFxuICAgICAgW1wiJWEgJWRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXREYXkoKSAmJiBkLmdldERhdGUoKSAhPSAxO1xuICAgICAgfV0sXG4gICAgICBbXCIlYiAlZFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLmdldERhdGUoKSAhPSAxO1xuICAgICAgfV0sXG4gICAgICBbXCIlQlwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLmdldE1vbnRoKCk7XG4gICAgICB9XSxcbiAgICAgIFtcIiVZXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1dXG4gICAgXSxcbiAgICB3aWR0aDogMTAwMFxuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiBhcHAoY29uZmlnKSB7XG4gICAgLy8gY29uc29sZS5sb2coY29uZmlnKTtcbiAgICB2YXIgeFNjYWxlID0gZDMudGltZS5zY2FsZSgpO1xuICAgIHZhciB5U2NhbGUgPSBkMy5zY2FsZS5vcmRpbmFsKCk7XG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIGZvciAodmFyIGtleSBpbiBkZWZhdWx0Q29uZmlnKSB7XG4gICAgICBjb25maWdba2V5XSA9IGNvbmZpZ1trZXldIHx8IGRlZmF1bHRDb25maWdba2V5XTtcbiAgICB9XG5cblxuXG4gICAgZnVuY3Rpb24gaW5pdChzZWxlY3Rpb24pIHtcblxuICAgICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgZ3JhcGhIZWlnaHQgPSAwO1xuICAgICAgICB2YXIgZ3JhcGhXaWR0aCA9IGNvbmZpZy53aWR0aDtcbiAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnNlbGVjdCgnc3ZnJykucmVtb3ZlKCk7XG5cbiAgICAgICAgdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpLnNjYWxlRXh0ZW50KFtjb25maWcubWluU2NhbGUsXG4gICAgICAgICAgICBjb25maWcubWF4U2NhbGVcbiAgICAgICAgICBdKVxuICAgICAgICAgIC5vbignem9vbXN0YXJ0Jywgem9vbXN0YXJ0KVxuICAgICAgICAgIC5vbihcInpvb21cIiwgdXBkYXRlWm9vbSlcbiAgICAgICAgICAub24oXCJ6b29tZW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3pvb21lbmQnKTtcbiAgICAgICAgICAgIC8vIHJlZHJhdyhmYWxzZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGRheXMgPSBkMy50aW1lLmRheXMoY29uZmlnLnN0YXJ0LCBjb25maWcuZW5kKTtcbiAgICAgICAgeFNjYWxlLnJhbmdlKFswLCBncmFwaFdpZHRoXSlcbiAgICAgICAgICAuZG9tYWluKFtjb25maWcuc3RhcnQsIGNvbmZpZy5lbmRdKVxuICAgICAgICAgIC5uaWNlKGQzLnRpbWUuZGF5KTtcbiAgICAgICAgem9vbS54KHhTY2FsZSk7XG4gICAgICAgIHpvb20uc2l6ZShbZ3JhcGhXaWR0aCwgZ3JhcGhIZWlnaHRdKTtcblxuICAgICAgICB2YXIgd3JhcHBlckhlaWdodCA9ICQoJyN3cmFwcGVyJykuaGVpZ2h0KCk7XG4gICAgICAgIGdyYXBoSGVpZ2h0ID0gZGF0YS5sZW5ndGggKiA0MDtcbiAgICAgICAgZ3JhcGhIZWlnaHQgPSBncmFwaEhlaWdodCA8IHdyYXBwZXJIZWlnaHQgPyB3cmFwcGVySGVpZ2h0IDpcbiAgICAgICAgICBncmFwaEhlaWdodDtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YS5sZW5ndGggKyAn5Liq5Lu75YqhJyk7XG4gICAgICAgIHZhciBzdmcgPSBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuYXBwZW5kKCdzdmcnKVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdhcHAnKVxuICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGdyYXBoV2lkdGgpXG4gICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGdyYXBoSGVpZ2h0KTtcblxuXG4gICAgICAgIHZhciBncmFwaCA9IHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5hdHRyKCdpZCcsICdjb250YWluZXItYm94Jyk7XG5cbiAgICAgICAgdmFyIHlEb21haW4gPSBbXTtcbiAgICAgICAgdmFyIHlSYW5nZSA9IFtdO1xuXG5cbiAgICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKHRhc2ssIGluZGV4KSB7XG4gICAgICAgICAgeURvbWFpbi5wdXNoKHRhc2sudXVpZCk7XG4gICAgICAgICAgeVJhbmdlLnB1c2goaW5kZXggKiA0MCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHlTY2FsZS5kb21haW4oeURvbWFpbikucmFuZ2UoeVJhbmdlKTtcblxuXG4gICAgICAgIHZhciB5QXhpc0VsID0gZ3JhcGguYXBwZW5kKCdnJylcbiAgICAgICAgICAuY2xhc3NlZCgneS1heGlzIGF4aXMnLCB0cnVlKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIC0xKScpXG4gICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAnMC40Jyk7XG5cbiAgICAgICAgdmFyIHlUaWNrID0geUF4aXNFbC5hcHBlbmQoJ2cnKS5zZWxlY3RBbGwoJ2cnKS5kYXRhKHlEb21haW4pO1xuXG4gICAgICAgIHlUaWNrLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoMCwgJyArICh5U2NhbGUoZCkgLSAxKSArICcpJztcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgIC5jbGFzc2VkKCd5LXRpY2snLCB0cnVlKVxuICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLWRhc2hhcnJheVwiLCBcIjEwLCAxMFwiKVxuICAgICAgICAgIC5hdHRyKCd4MScsIGNvbmZpZy5tYXJnaW4ubGVmdClcbiAgICAgICAgICAuYXR0cigneDInLCBjb25maWcubWFyZ2luLmxlZnQgKyBncmFwaFdpZHRoKTtcblxuICAgICAgICB5VGljay5leGl0KCkucmVtb3ZlKCk7XG5cblxuXG4gICAgICAgIHZhciB3cmFwcGVySGVpZ2h0ID0gJCgnI3dyYXBwZXInKS5oZWlnaHQoKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJncmFwaEhlaWdodD09XCIgKyBncmFwaEhlaWdodCArICcvJyArIHdyYXBwZXJIZWlnaHQpO1xuXG5cbiAgICAgICAgZnVuY3Rpb24gZHJhd1pvb20oKSB7XG4gICAgICAgICAgdmFyIGN1cngsIGN1cnk7XG4gICAgICAgICAgdmFyIHpvb21SZWN0ID0gZ3JhcGhcbiAgICAgICAgICAgIC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLmNhbGwoem9vbSlcbiAgICAgICAgICAgIC5jbGFzc2VkKCd6b29tJywgdHJ1ZSlcbiAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgJ2dyZWVuJylcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGdyYXBoV2lkdGgpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0Jywgd3JhcHBlckhlaWdodClcbiAgICAgICAgICAgIC8vIC5hdHRyKCdkaXNwbGF5JywgJ25vbmUnKVxuICAgICAgICAgICAgLy8gLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIGNvbmZpZy5tYXJnaW4ubGVmdCArXG4gICAgICAgICAgICAvLyAgICcsIDM1KScpXG4gICAgICAgICAgO1xuXG4gICAgICAgICAgLy8gaWYgKHR5cGVvZiBjb25maWcuZXZlbnRIb3ZlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIC8vICAgem9vbVJlY3Qub24oJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGQsIGUpIHtcbiAgICAgICAgICAvLyAgICAgdmFyIGV2ZW50ID0gZDMuZXZlbnQ7XG4gICAgICAgICAgLy8gICAgIGlmIChjdXJ4ID09IGV2ZW50LmNsaWVudFggJiYgY3VyeSA9PSBldmVudC5jbGllbnRZKVxuICAgICAgICAgIC8vICAgICAgIHJldHVybjtcbiAgICAgICAgICAvLyAgICAgY3VyeCA9IGV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgLy8gICAgIGN1cnkgPSBldmVudC5jbGllbnRZO1xuICAgICAgICAgIC8vICAgICB6b29tUmVjdC5hdHRyKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgICAvLyAgICAgdmFyIGVsID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChkMy5ldmVudC5jbGllbnRYLFxuICAgICAgICAgIC8vICAgICAgIGQzLmV2ZW50LmNsaWVudFkpO1xuICAgICAgICAgIC8vICAgICB6b29tUmVjdC5hdHRyKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgICAgICAgLy8gICAgIGlmIChlbC50YWdOYW1lICE9PSAnY2lyY2xlJykgcmV0dXJuO1xuICAgICAgICAgIC8vICAgICBjb25maWcuZXZlbnRIb3ZlcihlbCk7XG4gICAgICAgICAgLy8gICB9KTtcbiAgICAgICAgICAvLyB9XG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBpZiAodHlwZW9mIGNvbmZpZy5ldmVudENsaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgLy8gICB6b29tUmVjdC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAvLyAgICAgem9vbVJlY3QuYXR0cignZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgLy8gICAgIHZhciBlbCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZDMuZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAvLyAgICAgICBkM1xuICAgICAgICAgIC8vICAgICAgIC5ldmVudC5jbGllbnRZKTtcbiAgICAgICAgICAvLyAgICAgem9vbVJlY3QuYXR0cignZGlzcGxheScsICdibG9jaycpO1xuICAgICAgICAgIC8vICAgICBpZiAoZWwudGFnTmFtZSAhPT0gJ2NpcmNsZScpIHJldHVybjtcbiAgICAgICAgICAvLyAgICAgY29uZmlnLmV2ZW50Q2xpY2soZWwpO1xuICAgICAgICAgIC8vICAgfSk7XG4gICAgICAgICAgLy8gfVxuICAgICAgICAgIHJldHVybiB6b29tUmVjdDtcbiAgICAgICAgfVxuICAgICAgICBkcmF3Wm9vbSgpO1xuXG5cblxuICAgICAgICBncmFwaC5zZWxlY3QoJy5ncmFwaC1ib2R5JykucmVtb3ZlKCk7XG4gICAgICAgIHZhciBncmFwaEJvZHkgPSBncmFwaFxuICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5jbGFzc2VkKCdncmFwaC1ib2R5JywgdHJ1ZSlcbiAgICAgICAgICAvLyAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgY29uZmlnLm1hcmdpbi5sZWZ0ICsgJywgJyArXG4gICAgICAgICAgLy8gICAoY29uZmlnLm1hcmdpbi50b3AgLSAxNSkgKyAnKScpXG4gICAgICAgIDtcblxuICAgICAgICAvLyB2YXIgem9vbSA9IGQzLmJlaGF2aW9yLnpvb20oKS5jZW50ZXIobnVsbCkuc2NhbGVFeHRlbnQoW2NvbmZpZy5taW5TY2FsZSxcbiAgICAgICAgLy8gICBjb25maWcubWF4U2NhbGVcbiAgICAgICAgLy8gXSkub24oXCJ6b29tXCIsIHVwZGF0ZVpvb20pO1xuICAgICAgICB2YXIgdGltZXIgPSBudWxsO1xuXG4gICAgICAgIGZ1bmN0aW9uIHpvb21zdGFydCgpIHtcbiAgICAgICAgICBjb25maWcuc2NhbGUgPSBudWxsO1xuICAgICAgICAgIGNvbmZpZy50cmFuc2xhdGUgPSBudWxsO1xuICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PVxuICAgICAgICAgICAgJ1tvYmplY3QgV2hlZWxFdmVudF0nKSB7XG4gICAgICAgICAgICBpZiAoIWQzLmV2ZW50LnNvdXJjZUV2ZW50LmFsdEtleSkge1xuICAgICAgICAgICAgICBjb25maWcuc2NhbGUgPSB6b29tLnNjYWxlKCk7XG4gICAgICAgICAgICAgIGNvbmZpZy50cmFuc2xhdGUgPSB6b29tLnRyYW5zbGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZVpvb20oKSB7XG4gICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzXG4gICAgICAgICAgICAuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICdbb2JqZWN0IE1vdXNlRXZlbnRdJykge1xuICAgICAgICAgICAgem9vbS50cmFuc2xhdGUoW2QzLmV2ZW50LnRyYW5zbGF0ZVswXSwgMF0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC5hbHRLZXkgJiYgZDNcbiAgICAgICAgICAgIC5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PVxuICAgICAgICAgICAgJ1tvYmplY3QgV2hlZWxFdmVudF0nKSB7XG4gICAgICAgICAgICB6b29tLnNjYWxlKGQzLmV2ZW50LnNjYWxlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNvbmZpZy5zY2FsZSAmJiBjb25maWcudHJhbnNsYXRlKSB7XG4gICAgICAgICAgICB6b29tLnNjYWxlKGNvbmZpZy5zY2FsZSk7XG4gICAgICAgICAgICB6b29tLnRyYW5zbGF0ZShjb25maWcudHJhbnNsYXRlKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRpbWVyKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZWRyYXcoZmFsc2UpO1xuICAgICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJlZHJhdyh0cnVlKTtcbiAgICAgICAgICB9LCAzMDApO1xuICAgICAgICB9XG5cblxuXG4gICAgICAgIC8vIHZhciBsaW5lcyA9IGdyYXBoQm9keS5zZWxlY3RBbGwoJ2cnKS5kYXRhKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgLy8gICByZXR1cm4gZmlsdGVyTGluZShkLCB5U2NhbGUsIHRydWUpO1xuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gbGluZXMuZW50ZXIoKVxuICAgICAgICAvLyAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAvLyAgIC5jbGFzc2VkKCdsaW5lJywgdHJ1ZSlcbiAgICAgICAgLy8gICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAvLyAgICAgcmV0dXJuICd0cmFuc2xhdGUoMCwnICsgKHlTY2FsZShkLm5hbWUpKSArICcpJztcbiAgICAgICAgLy8gICB9KVxuICAgICAgICAvLyAgIC5zdHlsZSgnZmlsbCcsIGNvbmZpZy5ldmVudExpbmVDb2xvcik7XG4gICAgICAgIC8vXG4gICAgICAgIC8vIGxpbmVzLmV4aXQoKS5yZW1vdmUoKTtcblxuICAgICAgICB2YXIgbGluZXMgPSBudWxsO1xuICAgICAgICBsaW5lcyA9IGdyYXBoQm9keS5zZWxlY3RBbGwoJ2cnKS5kYXRhKGRhdGEpO1xuXG4gICAgICAgIGxpbmVzLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAuY2xhc3NlZCgnbGluZScsIHRydWUpXG4gICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKDAsJyArICh5U2NhbGUoZC51dWlkKSkgKyAnKSc7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBjb25maWcuZXZlbnRMaW5lQ29sb3IpO1xuXG4gICAgICAgIGxpbmVzLmV4aXQoKS5yZW1vdmUoKTtcblxuXG4gICAgICAgIGZ1bmN0aW9uIHJlZHJhdyhmdWxsUmVkcmF3KSB7XG4gICAgICAgICAgdmFyIHN0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgICB2YXIgeHRvcCA9IGQzLnNlbGVjdCgnI2hlYWRlcicpO1xuICAgICAgICAgIHh0b3Auc2VsZWN0KCdnJykucmVtb3ZlKCk7XG4gICAgICAgICAgdmFyIHhBeGlzVG9wID0geEF4aXNGYWN0b3J5KGQzLCBjb25maWcsIHhTY2FsZSwgeHRvcCxcbiAgICAgICAgICAgIGdyYXBoSGVpZ2h0LCAndG9wJyk7XG5cbiAgICAgICAgICB2YXIgeGJvdHRvbSA9IGQzLnNlbGVjdCgnI2Zvb3RlcicpO1xuICAgICAgICAgIHhib3R0b20uc2VsZWN0KCdnJykucmVtb3ZlKCk7XG4gICAgICAgICAgdmFyIHhBeGlzQm90dG9tID0geEF4aXNGYWN0b3J5KGQzLCBjb25maWcsIHhTY2FsZSwgeGJvdHRvbSxcbiAgICAgICAgICAgIGdyYXBoSGVpZ2h0LCAnYm90dG9tJyk7XG5cbiAgICAgICAgICBsaW5lcy5jYWxsKGV2ZW50TGluZSh7XG4gICAgICAgICAgICBtYXJnaW46IGNvbmZpZy5tYXJnaW4sXG4gICAgICAgICAgICBncmFwaEhlaWdodDogZ3JhcGhIZWlnaHQsXG4gICAgICAgICAgICB5U2NhbGU6IHlTY2FsZSxcbiAgICAgICAgICAgIHhTY2FsZTogeFNjYWxlLFxuICAgICAgICAgICAgZnVsbFJlZHJhdzogZnVsbFJlZHJhdyxcbiAgICAgICAgICAgIGV2ZW50Q29sb3I6IGNvbmZpZy5ldmVudENvbG9yLFxuICAgICAgICAgICAgY2hhbmdlVGltZUhhbmRsZXI6IGNvbmZpZy5jaGFuZ2VUaW1lSGFuZGxlcixcbiAgICAgICAgICAgIGNoYW5nZVN0YXJ0VGltZUhhbmRsZXI6IGNvbmZpZy5jaGFuZ2VTdGFydFRpbWVIYW5kbGVyLFxuICAgICAgICAgICAgY2hhbmdlRW5kVGltZUhhbmRsZXI6IGNvbmZpZy5jaGFuZ2VFbmRUaW1lSGFuZGxlcixcbiAgICAgICAgICAgIGNoYW5nZVBlcmNlbnRIYW5kbGVyOiBjb25maWcuY2hhbmdlUGVyY2VudEhhbmRsZXJcbiAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICB2YXIgZXQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygn6YeN55S75pW05L2TJyArIGZ1bGxSZWRyYXcgKyAnPScgKyAoZXQgLSBzdCkgKyAnbXMnKTtcbiAgICAgICAgfVxuICAgICAgICByZWRyYXcoZmFsc2UpO1xuXG5cblxuICAgICAgfSk7XG4gICAgICBsb2FkZWQoKTtcbiAgICB9XG5cbiAgICBjb25maWd1cmFibGUoaW5pdCwgY29uZmlnKTtcbiAgICByZXR1cm4gaW5pdDtcbiAgfTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCByZXF1aXJlLCBtb2R1bGUsIGQzICovXG5cbnZhciBjb25maWd1cmFibGUgPSByZXF1aXJlKCcuL3V0aWwvY29uZmlndXJhYmxlJyk7XG52YXIgZmlsdGVyRGF0YSA9IHJlcXVpcmUoJy4vZmlsdGVyRGF0YScpO1xudmFyIG11RmFjdG9yeSA9IHJlcXVpcmUoJy4vbXVJdGVtcycpO1xuXG52YXIgZGVmYXVsdENvbmZpZyA9IHtcbiAgeFNjYWxlOiBudWxsXG59O1xudmFyIGZvcm1hdGVyID0gZDMudGltZS5mb3JtYXQoXCIlWS0lbS0lZCAlSDolTTolU1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGQzKSB7XG4gIHZhciB0YXNrID0gcmVxdWlyZSgnLi90YXNrJykoZDMpO1xuICB2YXIgbGVmdEJ0biA9IHJlcXVpcmUoJy4vbGVmdEJ0bicpKGQzKTtcbiAgdmFyIHJpZ2h0QnRuID0gcmVxdWlyZSgnLi9yaWdodEJ0bicpKGQzKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7XG4gICAgICB4U2NhbGU6IG51bGwsXG4gICAgICByZWRyYXc6IHRydWUsXG4gICAgICBldmVudENvbG9yOiBudWxsXG4gICAgfTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdENvbmZpZykge1xuICAgICAgY29uZmlnW2tleV0gPSBjb25maWdba2V5XSB8fCBkZWZhdWx0Q29uZmlnW2tleV07XG4gICAgfVxuICAgIC8v6L+H5ruk55SoXG4gICAgdmFyIHNjcm9sbFRvcE9mZnNldCA9ICQoJyNzY3JvbGxlcicpLm9mZnNldCgpLnRvcDtcbiAgICB2YXIgeU1pbiA9IDAgLSBzY3JvbGxUb3BPZmZzZXQ7XG4gICAgdmFyIHlNYXggPSAwIC0gc2Nyb2xsVG9wT2Zmc2V0ICsgJCgnI3dyYXBwZXInKS5oZWlnaHQoKSArIDgwO1xuICAgIC8v5b2T5YmN6YCJ5Lit55qE5piv5ZOq5LiA5Liq5Lu75YqhXG4gICAgdmFyIHNlbGVjdGVkVGFzayA9IG51bGw7XG4gICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgLy9cbiAgICB2YXIgZXZlbnRMaW5lID0gZnVuY3Rpb24gZXZlbnRMaW5lKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgbGluZVN2ZyA9IGQzLnNlbGVjdCh0aGlzKTtcbiAgICAgICAgbGluZVN2Zy5zZWxlY3RBbGwoJy5pdGVtJykucmVtb3ZlKCk7XG4gICAgICAgIHZhciB0YXNrQm94ID0gbGluZVN2Z1xuICAgICAgICAgIC5zZWxlY3RBbGwoJy5pdGVtJylcbiAgICAgICAgICAuZGF0YShmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyRGF0YShkLnRhc2tzLCBjb25maWcueFNjYWxlLCBjb25maWcueVNjYWxlLFxuICAgICAgICAgICAgICB5TWluLCB5TWF4LCBjb25maWcuZnVsbFJlZHJhdyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHZhciBtb3ZlTGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpO1xuXG4gICAgICAgIC8v5aSE55CG5o+Q56S65L+h5oGvXG4gICAgICAgIHZhciB0b29sdGlwID0gZDMuaGVscGVyLnRvb2x0aXAoKVxuICAgICAgICAgIC5wYWRkaW5nKDE2LCAyNSlcbiAgICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICB2YXIgeCA9IHRhc2tCb3guYXR0cigneCcpO1xuICAgICAgICAgICAgdmFyIHRpbWVPblNjYWxlID0gY29uZmlnLnhTY2FsZS5pbnZlcnQoeCk7XG4gICAgICAgICAgICB2YXIgc3RhdCA9IGQuc3RhdHVzID09ICdmaW5pc2gnID8gJ+WujOe7kycgOiAn6L+b6KGM5LitJztcbiAgICAgICAgICAgIHZhciBodG1sID0gW107XG4gICAgICAgICAgICBodG1sLnB1c2goJzxoMT4nICsgZC5uYW1lICsgJzwvaDE+Jyk7XG4gICAgICAgICAgICBodG1sLnB1c2goJzx1bD4nKVxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8bGkgY2xhc3M9XCJpXCI+5byA5aeL5pe26Ze0OiAgJyArIGZvcm1hdGVyKGQuc3RhcnREYXRlKSArXG4gICAgICAgICAgICAgICc8L2xpPicpXG4gICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cImlcIj7nu5PmnZ/ml7bpl7Q6ICAnICsgZm9ybWF0ZXIoZC5lbmREYXRlKSArXG4gICAgICAgICAgICAgICc8L2xpPicpXG4gICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cImlcIj7ku7vliqHnirbmgIE6ICAnICsgc3RhdCArICc8L2xpPicpXG4gICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cImlcIj7ov5vluqY6ICAnICsgKGQucGVyY2VudCB8fCAwKSAqXG4gICAgICAgICAgICAgIDEwMCArXG4gICAgICAgICAgICAgICclPC9saT4nKVxuICAgICAgICAgICAgcmV0dXJuIGh0bWwuam9pbignJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIC8v55S76I+c5Y2VXG5cblxuICAgICAgICB2YXIgbGVmdEJ0biwgcGVyY2VudEJ0biwgcmlnaHRCdG47XG4gICAgICAgIHZhciBsZWZ0T2ZmRml4ID0gLTE5LFxuICAgICAgICAgIHJpZ2h0T2ZmRml4ID0gNTsgLy/nn6nlvaLlgY/np7tcbiAgICAgICAgdmFyIHJlZHJhd01lbnUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgdGFzayA9IHRhc2tCb3guZGF0YSgpWzBdO1xuICAgICAgICAgIGlmICh0YXNrID09IG51bGwgfHwgd2luZG93LmNvbmZpZy5zZWxlY3RJZCAhPSB0YXNrLm5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy/nm67lvZVcbiAgICAgICAgICBkMy5zZWxlY3QoJy5ncmFwaC1ib2R5Jykuc2VsZWN0KCcubWVudScpLnJlbW92ZSgpO1xuICAgICAgICAgIHZhciBtZW51ID0gbGluZVN2Zy5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsIFwibWVudVwiKTtcbiAgICAgICAgICB2YXIgcGVyY2VudExpc3RlbmVyID0gZDMuYmVoYXZpb3Iuem9vbSgpLmNlbnRlcihudWxsKTtcbiAgICAgICAgICB2YXIgc3RhcnRUaW1lTGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpO1xuICAgICAgICAgIHZhciBlbmRUaW1lTGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpO1xuICAgICAgICAgIHZhciB4ID0gY29uZmlnLnhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgdmFyIHcgPSBjb25maWcueFNjYWxlKHRhc2suZW5kRGF0ZSkgLSBjb25maWcueFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgICBtZW51LmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHggKyAnLCAwKScpO1xuXG4gICAgICAgICAgLy/nmb7liIbmr5RcbiAgICAgICAgICBwZXJjZW50TGlzdGVuZXIub24oJ3pvb21zdGFydCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB0YXNrLl9wZXJjZW50ID0gdGFzay5wZXJjZW50IHx8IDA7XG4gICAgICAgICAgICAgIHRhc2suX3hDdXJyID0gZDMuZXZlbnQuc291cmNlRXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6b29tc3RhcnQ6XCIgKyB0YXNrLl94Q3Vycik7XG4gICAgICAgICAgICB9KS5vbihcInpvb21cIixcbiAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09XG4gICAgICAgICAgICAgICAgICAnW29iamVjdCBNb3VzZUV2ZW50XScpIHtcbiAgICAgICAgICAgICAgICAgIHZhciBjbGllbnRYID0gZDMuZXZlbnQuc291cmNlRXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSBjbGllbnRYIC0gdGFzay5feEN1cnI7XG4gICAgICAgICAgICAgICAgICB2YXIgeFNjYWxlID0gY29uZmlnLnhTY2FsZTtcbiAgICAgICAgICAgICAgICAgIHZhciB4TWluID0gMDsgLy9cbiAgICAgICAgICAgICAgICAgIHZhciB4TWF4ID0gdztcbiAgICAgICAgICAgICAgICAgIHZhciB4Q3VyciA9IHcgKiB0YXNrLl9wZXJjZW50ICsgb2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgeEN1cnIgPSBNYXRoLm1pbih4Q3VyciwgeE1heCk7XG4gICAgICAgICAgICAgICAgICB4Q3VyciA9IE1hdGgubWF4KHhDdXJyLCB4TWluKTtcbiAgICAgICAgICAgICAgICAgIHZhciBfcGVyY2VudCA9ICh4Q3VyciAtIHhNaW4pIC8gdztcbiAgICAgICAgICAgICAgICAgIHRhc2sucGVyY2VudCA9IE1hdGgucm91bmQoX3BlcmNlbnQgKiAxMCkgLyAxMFxuICAgICAgICAgICAgICAgICAgeEN1cnIgPSB4TWluICsgdyAqIHRhc2sucGVyY2VudDtcbiAgICAgICAgICAgICAgICAgIHBlcmNlbnRCdG4uYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoXCIgKyB4Q3VyciArXG4gICAgICAgICAgICAgICAgICAgIFwiLCAxOSkgcm90YXRlKDApXCIpXG4gICAgICAgICAgICAgICAgICByZWRyYXdUYXNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKFwiem9vbWVuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmVkcmF3TWVudSgpO1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5jaGFuZ2VQZXJjZW50SGFuZGxlciA9PT1cbiAgICAgICAgICAgICAgICAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLmNoYW5nZVBlcmNlbnRIYW5kbGVyKHRhc2tCb3guZGF0YSgpWzBdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICB2YXIgc3RlcHMgPSAwO1xuICAgICAgICAgIHN0YXJ0VGltZUxpc3RlbmVyLm9uKCd6b29tc3RhcnQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgdGFzay5fc3RhcnREYXRlID0gdGFzay5zdGFydERhdGU7XG4gICAgICAgICAgICAgIHRhc2suX2VuZERhdGUgPSB0YXNrLmVuZERhdGU7XG4gICAgICAgICAgICAgIHRhc2suX3N0ZXBzID0gMDtcbiAgICAgICAgICAgICAgdGFzay5fcGVyY2VudCA9IHRhc2sucGVyY2VudCB8fCAwO1xuICAgICAgICAgICAgICB0YXNrLl94Q3VyciA9IGQzLmV2ZW50LnNvdXJjZUV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiem9vbXN0YXJ0OlwiICsgdGFzay5feEN1cnIpO1xuICAgICAgICAgICAgfSkub24oXCJ6b29tXCIsXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PVxuICAgICAgICAgICAgICAgICAgJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgeFNjYWxlID0gY29uZmlnLnhTY2FsZTtcbiAgICAgICAgICAgICAgICAgIHZhciBjbGllbnRYID0gZDMuZXZlbnQuc291cmNlRXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSBjbGllbnRYIC0gdGFzay5feEN1cnI7XG4gICAgICAgICAgICAgICAgICB2YXIgbWF4RGF0ZSA9IGQzLnRpbWUuZGF5Lm9mZnNldCh0YXNrLl9lbmREYXRlLCAtXG4gICAgICAgICAgICAgICAgICAgIDEpO1xuICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gTWF0aC5taW4ob2Zmc2V0LCAoeFNjYWxlKG1heERhdGUpIC1cbiAgICAgICAgICAgICAgICAgICAgeFNjYWxlKHRhc2suX3N0YXJ0RGF0ZSkpKSArIGxlZnRPZmZGaXg7XG4gICAgICAgICAgICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgIHZhciBkYXlXaWR0aCA9IHhTY2FsZShkMy50aW1lLmRheS5vZmZzZXQobm93LCAxKSkgLVxuICAgICAgICAgICAgICAgICAgICB4U2NhbGUobm93KTtcbiAgICAgICAgICAgICAgICAgIHN0ZXBzID0gTWF0aC5yb3VuZChvZmZzZXQgLyBkYXlXaWR0aCk7XG4gICAgICAgICAgICAgICAgICBvZmZzZXQgPSBzdGVwcyAqIGRheVdpZHRoICsgbGVmdE9mZkZpeDtcbiAgICAgICAgICAgICAgICAgIGxlZnRCdG4uYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoXCIgKyBvZmZzZXQgK1xuICAgICAgICAgICAgICAgICAgICBcIiwgMTMpXCIpXG4gICAgICAgICAgICAgICAgICB0YXNrLnN0YXJ0RGF0ZSA9IGQzLnRpbWUuZGF5Lm9mZnNldCh0YXNrLl9zdGFydERhdGUsXG4gICAgICAgICAgICAgICAgICAgIHN0ZXBzKTtcbiAgICAgICAgICAgICAgICAgIHJlZHJhd1Rhc2soKTtcbiAgICAgICAgICAgICAgICAgIHZhciB4MSA9IHBlcmNlbnRYKCk7XG4gICAgICAgICAgICAgICAgICBwZXJjZW50QnRuLmF0dHIoXCJ4XCIsIHgxKTtcbiAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICB3ID0geFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpO1xuICAgICAgICAgICAgICAgICAgdmFyIG1hc2tYID0geFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgICAgICAgICAgIGRyYXdNYXNrKG1hc2tYLCB3KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKFwiem9vbWVuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmVkcmF3TWVudSgpO1xuICAgICAgICAgICAgICBjbGVhck1hc2soKTtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcuY2hhbmdlU3RhcnRUaW1lSGFuZGxlciA9PT1cbiAgICAgICAgICAgICAgICAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLmNoYW5nZUVuZFRpbWVIYW5kbGVyKHRhc2tCb3guZGF0YSgpWzBdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgIC8v57uT5p2f5pe26Ze06LCD5pW05byA5aeLXG4gICAgICAgICAgZW5kVGltZUxpc3RlbmVyLm9uKCd6b29tc3RhcnQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgdGFzay5fc3RhcnREYXRlID0gdGFzay5zdGFydERhdGU7XG4gICAgICAgICAgICAgIHRhc2suX2VuZERhdGUgPSB0YXNrLmVuZERhdGU7XG4gICAgICAgICAgICAgIHRhc2suX3N0ZXBzID0gMDtcbiAgICAgICAgICAgICAgdGFzay5feEN1cnIgPSBkMy5ldmVudC5zb3VyY2VFdmVudC5jbGllbnRYO1xuICAgICAgICAgICAgICB0YXNrLl93aWR0aCA9IHhTY2FsZSh0YXNrLmVuZERhdGUpIC0geFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ6b29tc3RhcnQ6XCIgKyB0YXNrLl94Q3Vycik7XG4gICAgICAgICAgICB9KS5vbihcInpvb21cIixcbiAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09XG4gICAgICAgICAgICAgICAgICAnW29iamVjdCBNb3VzZUV2ZW50XScpIHtcbiAgICAgICAgICAgICAgICAgIHZhciB4U2NhbGUgPSBjb25maWcueFNjYWxlO1xuICAgICAgICAgICAgICAgICAgdmFyIGNsaWVudFggPSBkMy5ldmVudC5zb3VyY2VFdmVudC5jbGllbnRYO1xuICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IGNsaWVudFggLSB0YXNrLl94Q3VycjtcbiAgICAgICAgICAgICAgICAgIC8v6L+Z5Liq5Lu75Yqh5pyJ5Yeg5aSpXG4gICAgICAgICAgICAgICAgICB2YXIgZGF5cyA9IGQzLnRpbWUuZGF5cyh0YXNrLl9zdGFydERhdGUsIHRhc2suX2VuZERhdGUpO1xuICAgICAgICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICB2YXIgZGF5V2lkdGggPSB4U2NhbGUoZDMudGltZS5kYXkub2Zmc2V0KG5vdywgMSkpIC1cbiAgICAgICAgICAgICAgICAgICAgeFNjYWxlKG5vdyk7XG4gICAgICAgICAgICAgICAgICBzdGVwcyA9IE1hdGgucm91bmQob2Zmc2V0IC8gZGF5V2lkdGgpO1xuICAgICAgICAgICAgICAgICAgc3RlcHMgPSBNYXRoLm1heCgwIC0gZGF5cy5sZW5ndGggKyAxLCBzdGVwcyk7XG4gICAgICAgICAgICAgICAgICB2YXIgeEN1cnIgPSB0YXNrLl93aWR0aCArIHJpZ2h0T2ZmRml4ICsgc3RlcHMgKlxuICAgICAgICAgICAgICAgICAgICBkYXlXaWR0aDtcbiAgICAgICAgICAgICAgICAgIHJpZ2h0QnRuLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHhDdXJyICtcbiAgICAgICAgICAgICAgICAgICAgJywgMTMpJyk7XG4gICAgICAgICAgICAgICAgICB0YXNrLmVuZERhdGUgPSBkMy50aW1lLmRheS5vZmZzZXQodGFzay5fZW5kRGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgc3RlcHMpO1xuICAgICAgICAgICAgICAgICAgcmVkcmF3VGFzaygpO1xuICAgICAgICAgICAgICAgICAgdmFyIHcgPSB4U2NhbGUodGFzay5lbmREYXRlKSAtIHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgICAgICAgICBkcmF3TWFzayh4U2NhbGUodGFzay5zdGFydERhdGUpLCB3KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKFwiem9vbWVuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmVkcmF3TWVudSgpO1xuICAgICAgICAgICAgICBjbGVhck1hc2soKTtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcuY2hhbmdlRW5kVGltZUhhbmRsZXIgPT09XG4gICAgICAgICAgICAgICAgJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5jaGFuZ2VFbmRUaW1lSGFuZGxlcih0YXNrQm94LmRhdGEoKVswXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy/nu5PmnZ/ml7bpl7TosIPmlbTnu5PmnZ9cblxuXG4gICAgICAgICAgbGVmdEJ0biA9IG11RmFjdG9yeShkMywgY29uZmlnLCBtZW51LCAnbGVmdEJ0bicpO1xuICAgICAgICAgIHJpZ2h0QnRuID0gbXVGYWN0b3J5KGQzLCBjb25maWcsIG1lbnUsICdyaWdodEJ0bicpO1xuICAgICAgICAgIHBlcmNlbnRCdG4gPSBtdUZhY3RvcnkoZDMsIGNvbmZpZywgbWVudSwgJ3BlcmNlbnRCdG4nKTtcbiAgICAgICAgICB2YXIgcmlnaHRYID0gdyArIHJpZ2h0T2ZmRml4O1xuICAgICAgICAgIHZhciBweCA9ICgodyAqIHRhc2sucGVyY2VudCB8fCAwKSk7XG4gICAgICAgICAgbGVmdEJ0bi5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZShcIiArIGxlZnRPZmZGaXggK1xuICAgICAgICAgICAgXCIsIDEzKVwiKS5jYWxsKHN0YXJ0VGltZUxpc3RlbmVyKTtcbiAgICAgICAgICByaWdodEJ0bi5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZShcIiArIHJpZ2h0WCArXG4gICAgICAgICAgICBcIiwgMTMpXCIpLmNhbGwoZW5kVGltZUxpc3RlbmVyKTtcbiAgICAgICAgICBwZXJjZW50QnRuLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKFwiICsgcHggK1xuICAgICAgICAgICAgXCIsIDE5KVwiKS5jYWxsKHBlcmNlbnRMaXN0ZW5lcik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGVyY2VudFggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgdGFzayA9IHRhc2tCb3guZGF0YSgpWzBdO1xuICAgICAgICAgIHZhciB4ID0gMDtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhsZWZ0QnRuLmF0dHIoJ3gnKSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2cocmlnaHRCdG4uYXR0cigneCcpKTtcbiAgICAgICAgICAvLyB2YXIgbGVmdCA9IHBhcnNlRmxvYXQobGVmdEJ0bi5hdHRyKCd4JykpICsgMTA7XG4gICAgICAgICAgLy8gdmFyIHJpZ2h0ID0gcGFyc2VGbG9hdChyaWdodEJ0bi5hdHRyKCd4JykpIC0gMTA7XG4gICAgICAgICAgLy8geCA9IGxlZnQgKyAocmlnaHQgLSBsZWZ0KSAqICh0YXNrLnBlcmNlbnQgfHwgMCk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ2xlZnQ9JyArIGxlZnQgKyAnXFx0PScgKyByaWdodCArICdcXHQnICsgeCk7XG4gICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH1cblxuICAgICAgICAvL2NsaWNrXG4gICAgICAgIHZhciBjdXJ4LCBjdXJ5O1xuICAgICAgICB2YXIgY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGV2ZW50ID0gZDMuZXZlbnQ7XG4gICAgICAgICAgaWYgKGN1cnggPT0gZXZlbnQuY2xpZW50WCAmJiBjdXJ5ID09IGV2ZW50LmNsaWVudFkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgY3VyeCA9IGV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgY3VyeSA9IGV2ZW50LmNsaWVudFk7XG4gICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChkMy5ldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgZDMuZXZlbnQuY2xpZW50WSk7XG4gICAgICAgICAgdmFyIHRhc2tCb3ggPSBkMy5zZWxlY3QoZWwpO1xuICAgICAgICAgIGlmICh0YXNrQm94KSB7XG4gICAgICAgICAgICAvLyByZWRyYXdNZW51KCk7XG4gICAgICAgICAgICB2YXIgdGFzayA9IHRhc2tCb3guZGF0YSgpWzBdO1xuICAgICAgICAgICAgd2luZG93LmNvbmZpZy5zZWxlY3RJZCA9IHRhc2submFtZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVkcmF3TWVudSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy/nlLvooYxcbiAgICAgICAgdmFyIHJlZHJhd1Rhc2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygn6YeN55S75Lu75YqhJyk7XG4gICAgICAgICAgbGluZVN2Zy5zZWxlY3RBbGwoJy5pdGVtJykucmVtb3ZlKCk7XG4gICAgICAgICAgdGFza0JveC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAgIC5vbignY2xpY2snLCBjbGlja0hhbmRsZXIpXG4gICAgICAgICAgICAuY2FsbChtb3ZlTGlzdGVuZXIpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBjb25maWcuZXZlbnRDb2xvcilcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwiaXRlbVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIGNvbmZpZy54U2NhbGUoZC5zdGFydERhdGUpICtcbiAgICAgICAgICAgICAgICAnLCAxMyknXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDIwKVxuICAgICAgICAgICAgLm9uKCdtb3VzZW92ZXInLCB0b29sdGlwLm1vdXNlb3ZlcilcbiAgICAgICAgICAgIC5vbignbW91c2VvdXQnLCB0b29sdGlwLm1vdXNlb3V0KVxuICAgICAgICAgICAgLm9uKCdtb3VzZW1vdmUnLCB0b29sdGlwLm1vdXNlbW92ZSlcbiAgICAgICAgICAgIC5jYWxsKHRhc2soe1xuICAgICAgICAgICAgICB4U2NhbGU6IGNvbmZpZy54U2NhbGUsXG4gICAgICAgICAgICAgIGV2ZW50Q29sb3I6IGNvbmZpZy5ldmVudENvbG9yXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgdGFza0JveC5leGl0KCkucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVkcmF3VGFzaygpO1xuXG4gICAgICAgIC8v54K55Ye75Lu75Yqh5ZCO5pi+56S65Lu75Yqh55qE6LCD5pW05qih5byPXG4gICAgICAgIHJlZHJhd01lbnUoKTtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICAgIHZhciBkcmF3TWFzayA9IGZ1bmN0aW9uKHgsIHcpIHtcbiAgICAgICAgICB2YXIgYm94ID0gZDMuc2VsZWN0KCcjY29udGFpbmVyLWJveCcpO1xuICAgICAgICAgIGJveC5zZWxlY3QoJy5sbGluZScpLnJlbW92ZSgpO1xuICAgICAgICAgIHZhciBnID0gYm94LmFwcGVuZCgnZycpXG4gICAgICAgICAgICAvLyAuYXR0cignb3BhY2l0eScsICcwLjQnKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xsaW5lJylcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB4ICsgJywgMCknKTtcbiAgICAgICAgICBnLmFwcGVuZCgncmVjdCcpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBcIiMwY2NcIilcbiAgICAgICAgICAgIC5hdHRyKCdvcGFjaXR5JywgJzAuMScpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgY29uZmlnLmdyYXBoSGVpZ2h0KVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgdylcblxuICAgICAgICAgIGcuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgICAgIC5hdHRyKCd4MScsIDApXG4gICAgICAgICAgICAuYXR0cigneTEnLCBjb25maWcubWFyZ2luLnRvcCAtIDQwKVxuICAgICAgICAgICAgLmF0dHIoJ3gyJywgMClcbiAgICAgICAgICAgIC5hdHRyKCd5MicsIGNvbmZpZy5ncmFwaEhlaWdodCArIDQwKTtcblxuICAgICAgICAgIGcuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgICAgIC5hdHRyKCd4MScsIHcpXG4gICAgICAgICAgICAuYXR0cigneTEnLCBjb25maWcubWFyZ2luLnRvcCAtIDQwKVxuICAgICAgICAgICAgLmF0dHIoJ3gyJywgdylcbiAgICAgICAgICAgIC5hdHRyKCd5MicsIGNvbmZpZy5ncmFwaEhlaWdodCArIDQwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjbGVhck1hc2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYm94ID0gZDMuc2VsZWN0KCcjY29udGFpbmVyLWJveCcpO1xuICAgICAgICAgIGJveC5zZWxlY3QoJy5sbGluZScpLnJlbW92ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aSE55CG5Lu75Yqh5bem5Y+z56e75Yqo55qE6Zeu6aKYXG4gICAgICAgIG1vdmVMaXN0ZW5lci5vbihcInpvb21cIixcbiAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PVxuICAgICAgICAgICAgICAnW29iamVjdCBNb3VzZUV2ZW50XScpIHtcbiAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChkMy5ldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgIGQzLmV2ZW50LmNsaWVudFkpO1xuICAgICAgICAgICAgICB2YXIgeCA9IDAsXG4gICAgICAgICAgICAgICAgdyA9IDA7XG4gICAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICAgICAgICB0YXNrQm94LmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICB2YXIgeFNjYWxlID0gY29uZmlnLnhTY2FsZTtcbiAgICAgICAgICAgICAgICB3ID0geFNjYWxlKGQuZW5kRGF0ZSkgLSB4U2NhbGUoZC5zdGFydERhdGUpO1xuICAgICAgICAgICAgICAgIHggPSB4U2NhbGUoZC5zdGFydERhdGUpICsgZDMuZXZlbnQudHJhbnNsYXRlW1xuICAgICAgICAgICAgICAgICAgMF07IC8v56e75Yqo5ZCO55qE6Led56a7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGVUaW1lID0geFNjYWxlLmludmVydCh4KTsgLy/ovazmjaLmiJDmlrDnmoTml7bpl7RcbiAgICAgICAgICAgICAgICB2YXIgZGF0ZSA9IGQzLnRpbWUuZGF5KGRhdGVUaW1lKTsgLy/lr7nml7bpl7Tov5vooYzlj5bmlbRcbiAgICAgICAgICAgICAgICB4ID0geFNjYWxlKGRhdGUpOyAvL+aXtumXtOWPluaVtOWQjueahOi3neemu1xuICAgICAgICAgICAgICAgIGQuc3RhcnREYXRlID0gZGF0ZTtcbiAgICAgICAgICAgICAgICBkLmVuZERhdGUgPSB4U2NhbGUuaW52ZXJ0KHggKyB3KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsIDEzKSc7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZWRyYXdNZW51KCk7XG4gICAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICAgICAgICBkcmF3TWFzayh4LCB3KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9KS5vbihcInpvb21lbmRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGJveCA9IGQzLnNlbGVjdCgnI2NvbnRhaW5lci1ib3gnKTtcbiAgICAgICAgICBib3guc2VsZWN0KCcubGxpbmUnKS5yZW1vdmUoKTtcbiAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5jaGFuZ2VUaW1lSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uZmlnLmNoYW5nZVRpbWVIYW5kbGVyKHRhc2tCb3guZGF0YSgpWzBdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25maWd1cmFibGUoZXZlbnRMaW5lLCBjb25maWcpO1xuICAgIHJldHVybiBldmVudExpbmU7XG4gIH07XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgbW9kdWxlICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZmlsdGVyRGF0ZShkYXRhLCB4U2NhbGUsIHlTY2FsZSwgeU1pbiwgeU1heCxcbiAgZnVsbFJlZHJhdykge1xuICBkYXRhID0gZGF0YSB8fCBbXTtcbiAgdmFyIGZpbHRlcmVkRGF0YSA9IFtdO1xuICB2YXIgYm91bmRhcnkgPSB4U2NhbGUucmFuZ2UoKTtcbiAgdmFyIG1pbiA9IGJvdW5kYXJ5WzBdO1xuICB2YXIgbWF4ID0gYm91bmRhcnlbMV07XG4gIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkYXR1bSkge1xuICAgIHZhciBzdGFydCA9IHhTY2FsZShkYXR1bS5zdGFydERhdGUpO1xuICAgIHZhciBlbmQgPSB4U2NhbGUoZGF0dW0uZW5kRGF0ZSk7XG4gICAgdmFyIHkgPSB5U2NhbGUoZGF0dW0udXVpZCk7XG4gICAgaWYgKGVuZCA8IG1pbiB8fCBzdGFydCA+IG1heCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIWZ1bGxSZWRyYXcgJiYgKHkgPCB5TWluIHx8IHkgPiB5TWF4KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmaWx0ZXJlZERhdGEucHVzaChkYXR1bSk7XG4gIH0pO1xuICByZXR1cm4gZmlsdGVyZWREYXRhO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIG1vZHVsZSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZpbHRlckRhdGUoZGF0YSwgc2NhbGUsIGxpdGUpIHtcbiAgZGF0YSA9IGRhdGEgfHwgW107XG4gIHZhciBmaWx0ZXJlZERhdGEgPSBbXTtcbiAgdmFyIG9mZnNldCA9ICQoJyNzY3JvbGxlcicpLm9mZnNldCgpLnRvcDtcbiAgdmFyIHlNaW4gPSAwIC0gb2Zmc2V0O1xuICB2YXIgeU1heCA9IDAgLSBvZmZzZXQgKyAkKCcjd3JhcHBlcicpLmhlaWdodCgpO1xuICB2YXIgY291bnQgPSAwO1xuICBkYXRhLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgIC8vIGlmIChsaXRlKSB7XG4gICAgLy8gICB2YXIgbmFtZSA9IGQubmFtZTtcbiAgICAvLyAgIHZhciB5ID0gc2NhbGUobmFtZSk7XG4gICAgLy8gICBjb25zb2xlLmxvZyhbeSwgeU1pbiwgeU1heF0uam9pbignLCcpKVxuICAgIC8vICAgdmFyIF9kID0gJC5leHRlbmQodHJ1ZSwge30sIGQpO1xuICAgIC8vICAgaWYgKHkgPCB5TWluIHx8IHkgPiB5TWF4KSB7XG4gICAgLy8gICAgIF9kLnRhc2tzLmxlbmd0aCA9IDA7XG4gICAgLy8gICB9IGVsc2Uge1xuICAgIC8vICAgICBjb3VudCsrO1xuICAgIC8vICAgfVxuICAgIC8vICAgZmlsdGVyZWREYXRhLnB1c2goX2QpO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgZmlsdGVyZWREYXRhLnB1c2goZCk7XG4gICAgLy8gfVxuICB9KTtcbiAgY29uc29sZS5sb2coJ2NvdW50PT09JyArIGNvdW50KTtcblxuICByZXR1cm4gZmlsdGVyZWREYXRhO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIHJlcXVpcmUsIG1vZHVsZSwgZDMgKi9cblxudmFyIGNvbmZpZ3VyYWJsZSA9IHJlcXVpcmUoJy4vdXRpbC9jb25maWd1cmFibGUnKTtcbnZhciBmaWx0ZXJEYXRhID0gcmVxdWlyZSgnLi9maWx0ZXJEYXRhJyk7XG5cbnZhciBkZWZhdWx0Q29uZmlnID0ge1xuICB4U2NhbGU6IG51bGxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZDMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbmZpZykge1xuXG4gICAgY29uZmlnID0gY29uZmlnIHx8IHtcbiAgICAgIHhTY2FsZTogbnVsbCxcbiAgICAgIHlTY2FsZTogbnVsbFxuICAgIH07XG4gICAgZm9yICh2YXIga2V5IGluIGRlZmF1bHRDb25maWcpIHtcbiAgICAgIGNvbmZpZ1trZXldID0gY29uZmlnW2tleV0gfHwgZGVmYXVsdENvbmZpZ1trZXldO1xuICAgIH1cbiAgICB2YXIgeFNjYWxlID0gY29uZmlnLnhTY2FsZTtcbiAgICB2YXIgbGVmdEJ0biA9IGZ1bmN0aW9uIGxlZnRCdG4oc2VsZWN0aW9uKSB7XG4gICAgICBzZWxlY3Rpb24uZWFjaChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zZWxlY3RBbGwoJy5sZWZ0QnRuJykucmVtb3ZlKCk7XG4gICAgICAgIHZhciBsZWZ0TGluZSA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZSgtMTksIDEzKVwiKVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdidG4gbGVmdEJ0bicpO1xuICAgICAgICBsZWZ0TGluZS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAgIC5hdHRyKCdkJyxcbiAgICAgICAgICAgICdNIDAgMCBMIDExIDAgcSAtMiAyIC0yIDcgTCAxMSAxMSBMICAwIDExIHonKVxuICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCAnIzg4OCcpXG4gICAgICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsICcxJylcbiAgICAgICAgICAuYXR0cignZmlsbCcsICcjMWY5NmQ4JylcbiAgICAgICAgbGVmdExpbmUuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgICAuYXR0cigneDEnLCAnMycpXG4gICAgICAgICAgLmF0dHIoJ3kxJywgJzInKVxuICAgICAgICAgIC5hdHRyKCd4MicsICczJylcbiAgICAgICAgICAuYXR0cigneTInLCAnOScpXG4gICAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgICAgICBsZWZ0TGluZS5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgIC5hdHRyKCd4MScsICc2JylcbiAgICAgICAgICAuYXR0cigneTEnLCAnMicpXG4gICAgICAgICAgLmF0dHIoJ3gyJywgJzYnKVxuICAgICAgICAgIC5hdHRyKCd5MicsICc5JylcbiAgICAgICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uZmlndXJhYmxlKGxlZnRCdG4sIGNvbmZpZyk7XG5cbiAgICByZXR1cm4gbGVmdEJ0bjtcbiAgfTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGFwcCA9IHJlcXVpcmUoJy4vYXBwJyk7XG5cbmlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICBkZWZpbmUoJ2QzLmNoYXJ0LmFwcCcsIFtcImQzXCJdLCBmdW5jdGlvbihkMykge1xuICAgIGQzLmNoYXJ0ID0gZDMuY2hhcnQgfHwge307XG4gICAgZDMuY2hhcnQuYXBwID0gYXBwKGQzKTtcbiAgfSk7XG59IGVsc2UgaWYgKHdpbmRvdykge1xuICB3aW5kb3cuZDMuY2hhcnQgPSB3aW5kb3cuZDMuY2hhcnQgfHwge307XG4gIHdpbmRvdy5kMy5jaGFydC5hcHAgPSBhcHAod2luZG93LmQzKTtcbn0gZWxzZSB7XG4gIG1vZHVsZS5leHBvcnRzID0gYXBwO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkMywgY29uZmlnLCBncmFwaCwgd2hlcmUpIHtcblxuXG4gIHZhciBpdGVtcyA9IHt9O1xuXG4gIHZhciBidWlsZExlZnQgPSBmdW5jdGlvbigpIHtcbiAgICBpdGVtc1snbGVmdEJ0biddID0gZ3JhcGguc2VsZWN0QWxsKCcubGVmdEJ0bicpLnJlbW92ZSgpO1xuICAgIHZhciBsZWZ0TGluZSA9IGdyYXBoXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZSgwLCAxMylcIilcbiAgICAgIC5hdHRyKCdjbGFzcycsICdidG4gbGVmdEJ0bicpO1xuICAgIGxlZnRMaW5lLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignZCcsXG4gICAgICAgICdNIDAgMCBMIDExIDAgcSAtMiAyIC0yIDcgTCAxMSAxMSBMICAwIDExIHonKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsICcjODg4JylcbiAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAnMScpXG4gICAgICAuYXR0cignZmlsbCcsICcjMWY5NmQ4JylcbiAgICBsZWZ0TGluZS5hcHBlbmQoJ2xpbmUnKVxuICAgICAgLmF0dHIoJ3gxJywgJzMnKVxuICAgICAgLmF0dHIoJ3kxJywgJzInKVxuICAgICAgLmF0dHIoJ3gyJywgJzMnKVxuICAgICAgLmF0dHIoJ3kyJywgJzknKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgIGxlZnRMaW5lLmFwcGVuZCgnbGluZScpXG4gICAgICAuYXR0cigneDEnLCAnNicpXG4gICAgICAuYXR0cigneTEnLCAnMicpXG4gICAgICAuYXR0cigneDInLCAnNicpXG4gICAgICAuYXR0cigneTInLCAnOScpXG4gICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgcmV0dXJuIGxlZnRMaW5lO1xuICB9XG5cblxuICB2YXIgYnVpbGRSaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgIGl0ZW1zWydyaWdodEJ0biddID0gZ3JhcGguc2VsZWN0QWxsKCcucmlnaHRCdG4nKS5yZW1vdmUoKTtcbiAgICB2YXIgcmlnaHRCdG4gPSBncmFwaFxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoMCwgMTMpXCIpXG4gICAgICAuYXR0cignY2xhc3MnLCAnYnRuIHJpZ2h0QnRuJyk7XG4gICAgcmlnaHRCdG4uYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdkJyxcbiAgICAgICAgJ00gMCAwICBxIDIgMiAyIDggIEwgIDAgMTEgIEwgMTEgMTEgTCAxMSAwIHonKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsICcjODg4JylcbiAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAnMScpXG4gICAgICAuYXR0cignZmlsbCcsICcjMWY5NmQ4JylcbiAgICByaWdodEJ0bi5hcHBlbmQoJ2xpbmUnKVxuICAgICAgLmF0dHIoJ3gxJywgJzUnKVxuICAgICAgLmF0dHIoJ3kxJywgJzInKVxuICAgICAgLmF0dHIoJ3gyJywgJzUnKVxuICAgICAgLmF0dHIoJ3kyJywgJzknKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgIHJpZ2h0QnRuLmFwcGVuZCgnbGluZScpXG4gICAgICAuYXR0cigneDEnLCAnOCcpXG4gICAgICAuYXR0cigneTEnLCAnMicpXG4gICAgICAuYXR0cigneDInLCAnOCcpXG4gICAgICAuYXR0cigneTInLCAnOScpXG4gICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgcmV0dXJuIHJpZ2h0QnRuO1xuICB9XG5cbiAgdmFyIGJ1aWxkUGVyY2VudCA9IGZ1bmN0aW9uKCkge1xuICAgIGl0ZW1zWydwZXJjZW50QnRuJ10gPSBncmFwaC5zZWxlY3RBbGwoJy5wZXJjZW50QnRuJykucmVtb3ZlKCk7XG4gICAgdmFyIHBlcmNlbnRCdG4gPSBncmFwaFxuICAgICAgLmFwcGVuZCgncG9seWxpbmUnKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsIFwiI2EwYTBhMFwiKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgXCJwZXJjZW50QnRuXCIpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCAxOCknKVxuICAgICAgLmF0dHIoJ3BvaW50cycsICcwLDAgNiw3IDYsMTMsIC02LDEzIC02LDcgMCwwJylcbiAgICAgIC5hdHRyKCdzdHlsZScsICdmaWxsOndoaXRlO3N0cm9rZS13aWR0aDoxJylcbiAgICByZXR1cm4gcGVyY2VudEJ0bjtcbiAgfVxuXG4gIHZhciBkcmF3WEF4aXMgPSBmdW5jdGlvbiBkcmF3WEF4aXMoKSB7XG4gICAgLy8gY29uc29sZS5sb2coJ3doZXJlPT09JyArIHdoZXJlKTtcbiAgICBzd2l0Y2ggKHdoZXJlKSB7XG4gICAgICBjYXNlICdsZWZ0QnRuJzpcbiAgICAgICAgcmV0dXJuIGJ1aWxkTGVmdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3JpZ2h0QnRuJzpcbiAgICAgICAgcmV0dXJuIGJ1aWxkUmlnaHQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwZXJjZW50QnRuJzpcbiAgICAgICAgcmV0dXJuIGJ1aWxkUGVyY2VudCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG5cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGRyYXdYQXhpcygpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIHJlcXVpcmUsIG1vZHVsZSwgZDMgKi9cblxudmFyIGNvbmZpZ3VyYWJsZSA9IHJlcXVpcmUoJy4vdXRpbC9jb25maWd1cmFibGUnKTtcbnZhciBmaWx0ZXJEYXRhID0gcmVxdWlyZSgnLi9maWx0ZXJEYXRhJyk7XG5cbnZhciBkZWZhdWx0Q29uZmlnID0ge1xuICB4U2NhbGU6IG51bGxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZDMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbmZpZykge1xuXG4gICAgY29uZmlnID0gY29uZmlnIHx8IHtcbiAgICAgIHhTY2FsZTogbnVsbCxcbiAgICAgIHlTY2FsZTogbnVsbFxuICAgIH07XG4gICAgZm9yICh2YXIga2V5IGluIGRlZmF1bHRDb25maWcpIHtcbiAgICAgIGNvbmZpZ1trZXldID0gY29uZmlnW2tleV0gfHwgZGVmYXVsdENvbmZpZ1trZXldO1xuICAgIH1cbiAgICB2YXIgeFNjYWxlID0gY29uZmlnLnhTY2FsZTtcbiAgICB2YXIgcmlnaHRCdG4gPSBmdW5jdGlvbiByaWdodEJ0bihzZWxlY3Rpb24pIHtcbiAgICAgIHNlbGVjdGlvbi5lYWNoKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnNlbGVjdEFsbCgnLnJpZ2h0QnRuJykucmVtb3ZlKCk7XG4gICAgICAgIHZhciBsZWZ0TGluZSA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZSgtMTksIDEzKVwiKVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdidG4gcmlnaHRCdG4nKTtcbiAgICAgICAgbGVmdExpbmUuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgICAuYXR0cignZCcsXG4gICAgICAgICAgICAnTSAwIDAgTCAxMSAwIHEgLTIgMiAtMiA3IEwgMTEgMTEgTCAgMCAxMSB6JylcbiAgICAgICAgICAuYXR0cignc3Ryb2tlJywgJyM4ODgnKVxuICAgICAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAnMScpXG4gICAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnIzFmOTZkOCcpXG4gICAgICAgIGxlZnRMaW5lLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgLmF0dHIoJ3gxJywgJzMnKVxuICAgICAgICAgIC5hdHRyKCd5MScsICcyJylcbiAgICAgICAgICAuYXR0cigneDInLCAnMycpXG4gICAgICAgICAgLmF0dHIoJ3kyJywgJzknKVxuICAgICAgICAgIC5hdHRyKCdmaWxsJywgJ3doaXRlJylcbiAgICAgICAgbGVmdExpbmUuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgICAuYXR0cigneDEnLCAnNicpXG4gICAgICAgICAgLmF0dHIoJ3kxJywgJzInKVxuICAgICAgICAgIC5hdHRyKCd4MicsICc2JylcbiAgICAgICAgICAuYXR0cigneTInLCAnOScpXG4gICAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbmZpZ3VyYWJsZShyaWdodEJ0biwgY29uZmlnKTtcblxuICAgIHJldHVybiByaWdodEJ0bjtcbiAgfTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCByZXF1aXJlLCBtb2R1bGUsIGQzICovXG5cbnZhciBjb25maWd1cmFibGUgPSByZXF1aXJlKCcuL3V0aWwvY29uZmlndXJhYmxlJyk7XG52YXIgZmlsdGVyRGF0YSA9IHJlcXVpcmUoJy4vZmlsdGVyRGF0YScpO1xuXG52YXIgZGVmYXVsdENvbmZpZyA9IHtcbiAgeFNjYWxlOiBudWxsXG59O1xuXG52YXIgZm9ybWF0ZXIgPSBkMy50aW1lLmZvcm1hdChcIiVZLSVtLSVkICVIOiVNOiVTXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZDMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbmZpZykge1xuXG4gICAgY29uZmlnID0gY29uZmlnIHx8IHtcbiAgICAgIHhTY2FsZTogbnVsbCxcbiAgICAgIHlTY2FsZTogbnVsbFxuICAgIH07XG4gICAgZm9yICh2YXIga2V5IGluIGRlZmF1bHRDb25maWcpIHtcbiAgICAgIGNvbmZpZ1trZXldID0gY29uZmlnW2tleV0gfHwgZGVmYXVsdENvbmZpZ1trZXldO1xuICAgIH1cbiAgICB2YXIgeFNjYWxlID0gY29uZmlnLnhTY2FsZTtcbiAgICB2YXIgdGFzayA9IGZ1bmN0aW9uIHRhc2soc2VsZWN0aW9uKSB7XG4gICAgICBzZWxlY3Rpb24uZWFjaChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygn55S75Lu75YqhJyk7XG4gICAgICAgIC8vIOefqeW9ouaYvuekuuaWueahiFxuICAgICAgICB2YXIgY29udGFpbmVyID0gZDMuc2VsZWN0KHRoaXMpO1xuICAgICAgICBjb250YWluZXIuc2VsZWN0QWxsKCcudGFzaycpLnJlbW92ZSgpO1xuXG4gICAgICAgIHZhciBzaG93VGFzayA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgdmFyIGZpbGxDb2xvciA9IFwiIzBjY1wiO1xuICAgICAgICAgIGlmIChkYXRhLmVuZERhdGUgPCBuZXcgRGF0ZSgpKSB7XG4gICAgICAgICAgICBmaWxsQ29sb3IgPSAncmVkJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgYmFja2dyb3VuZCA9IGNvbnRhaW5lci5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgXCJ0cmFuc3BhcmVudFwiKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgXCJ0YXNrIGJhY2tncm91bmRcIilcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCAxMClcbiAgICAgICAgICAgIC5hdHRyKCdyeCcsIDQpXG4gICAgICAgICAgICAuYXR0cigncnknLCA0KVxuICAgICAgICAgICAgLmF0dHIoJ3N0cm9rZScsIFwiI2EwYTBhMFwiKVxuICAgICAgICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsIDEpXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZGF0YS5lbmREYXRlICsgJ1xcdCcgKyBkYXRhLnN0YXJ0RGF0ZSArXG4gICAgICAgICAgICAgIC8vICAgJ1xcdCcgKyAoeFNjYWxlKGRhdGEuZW5kRGF0ZSkgLSB4U2NhbGUoZGF0YS5zdGFydERhdGUpKVxuICAgICAgICAgICAgICAvLyApO1xuICAgICAgICAgICAgICByZXR1cm4gKHhTY2FsZShkYXRhLmVuZERhdGUpIC0geFNjYWxlKGRhdGEuc3RhcnREYXRlKSlcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdmFyIHByZSA9IGNvbnRhaW5lci5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgXCIjNmRmM2QyXCIpXG4gICAgICAgICAgICAuYXR0cignc3Ryb2tlJywgXCIjYTBhMGEwXCIpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCBcInRhc2sgcHJlXCIpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoMCwgMC41KVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3J4JywgNClcbiAgICAgICAgICAgIC5hdHRyKCdyeScsIDQpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgMTApXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIChjb25maWcueFNjYWxlKGRhdGEuZW5kRGF0ZSkgLSBjb25maWcueFNjYWxlKFxuICAgICAgICAgICAgICAgIGRhdGEuc3RhcnREYXRlKSkgKiBkYXRhLnBlcmNlbnQgfHwgMDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHNob3dQYWNrYWdlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICB2YXIgZmlsbENvbG9yID0gXCIjMGNjXCI7XG4gICAgICAgICAgaWYgKGRhdGEuZW5kRGF0ZSA8IG5ldyBEYXRlKCkpIHtcbiAgICAgICAgICAgIGZpbGxDb2xvciA9ICdyZWQnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciB3ID0geFNjYWxlKGRhdGEuZW5kRGF0ZSkgLSB4U2NhbGUoZGF0YS5zdGFydERhdGUpO1xuICAgICAgICAgIHZhciBwdyA9IHcgKiBkYXRhLnBlcmNlbnQgfHwgMDtcbiAgICAgICAgICB2YXIgYmFja2dyb3VuZCA9IGNvbnRhaW5lci5hcHBlbmQoJ3BvbHlsaW5lJylcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCBcIiNhMGEwYTBcIilcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwidGFzayBwcmVcIilcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZSgwLCAwLjUpXCIpXG4gICAgICAgICAgICAuYXR0cigncG9pbnRzJywgJzAsMCAnICsgdyArICcsMCAnICsgdyArICcsMjAgJyArICh3IC1cbiAgICAgICAgICAgICAgNSkgKyAnLDcgNSw3IDAsMjAgMCwwJylcbiAgICAgICAgICAgIC5hdHRyKCdzdHlsZScsICdmaWxsOndoaXRlO3N0cm9rZS13aWR0aDoxJyk7XG5cblxuICAgICAgICAgIHZhciBwcmUgPSBjb250YWluZXIuYXBwZW5kKCdwb2x5bGluZScpXG4gICAgICAgICAgICAuYXR0cignc3Ryb2tlJywgXCIjYTBhMGEwXCIpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCBcInRhc2sgcHJlXCIpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoMCwgMC41KVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3N0eWxlJywgJ2ZpbGw6ZmY5YzRjO3N0cm9rZS13aWR0aDoxJyk7XG5cbiAgICAgICAgICBpZiAocHcgPCA1KSB7XG4gICAgICAgICAgICBwcmUuYXR0cigncG9pbnRzJywgJzAsMCAnICsgcHcgKyAnLDAgJyArIHB3ICtcbiAgICAgICAgICAgICAgJyw3ICcgKyBwdyArICcsNyAwLDIwIDAsMCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAocHcgPj0gNSAmJiBwdyA8ICh3IC0gNSkpIHtcbiAgICAgICAgICAgIHByZS5hdHRyKCdwb2ludHMnLCAnMCwwICcgKyBwdyArICcsMCAnICsgcHcgK1xuICAgICAgICAgICAgICAnLDcgNSw3IDAsMjAgMCwwJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChwdyA+PSAodyAtIDUpKSB7XG4gICAgICAgICAgICBwcmUuYXR0cigncG9pbnRzJywgJzAsMCAnICsgcHcgKyAnLDAgJyArIHB3ICtcbiAgICAgICAgICAgICAgJywyMCAnICsgKHcgLSA1KSArICcsNyA1LDcgMCwyMCAwLDAnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGRhdGEucGFja2FnZSkge1xuICAgICAgICAgIHNob3dQYWNrYWdlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2hvd1Rhc2soKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbmZpZ3VyYWJsZSh0YXNrLCBjb25maWcpO1xuXG4gICAgcmV0dXJuIHRhc2s7XG4gIH07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjb25maWd1cmFibGUodGFyZ2V0RnVuY3Rpb24sIGNvbmZpZywgbGlzdGVuZXJzKSB7XG4gIGxpc3RlbmVycyA9IGxpc3RlbmVycyB8fCB7fTtcbiAgZm9yICh2YXIgaXRlbSBpbiBjb25maWcpIHtcbiAgICAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgdGFyZ2V0RnVuY3Rpb25baXRlbV0gPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBjb25maWdbaXRlbV07XG4gICAgICAgIGNvbmZpZ1tpdGVtXSA9IHZhbHVlO1xuICAgICAgICBpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGl0ZW0pKSB7XG4gICAgICAgICAgbGlzdGVuZXJzW2l0ZW1dKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGFyZ2V0RnVuY3Rpb247XG4gICAgICB9O1xuICAgIH0pKGl0ZW0pOyAvLyBmb3IgZG9lc24ndCBjcmVhdGUgYSBjbG9zdXJlLCBmb3JjaW5nIGl0XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGQzLCBjb25maWcsIHhTY2FsZSwgZ3JhcGgsIGdyYXBoSGVpZ2h0LCB3aGVyZSkge1xuICB2YXIgeEF4aXMgPSB7fTtcbiAgdmFyIHhBeGlzRWxzID0ge307XG5cbiAgdmFyIHRpY2tGb3JtYXREYXRhID0gW107XG5cbiAgY29uZmlnLnRpY2tGb3JtYXQuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgdmFyIHRpY2sgPSBpdGVtLnNsaWNlKDApO1xuICAgIHRpY2tGb3JtYXREYXRhLnB1c2godGljayk7XG4gIH0pO1xuXG4gIHZhciB0aWNrRm9ybWF0ID0gY29uZmlnLmxvY2FsZSA/IGNvbmZpZy5sb2NhbGUudGltZUZvcm1hdC5tdWx0aShcbiAgICB0aWNrRm9ybWF0RGF0YSkgOiBkMy50aW1lLmZvcm1hdC5tdWx0aSh0aWNrRm9ybWF0RGF0YSk7XG5cbiAgeEF4aXNbd2hlcmVdID0gZDMuc3ZnLmF4aXMoKVxuICAgIC5zY2FsZSh4U2NhbGUpXG4gICAgLm9yaWVudCh3aGVyZSlcbiAgICAudGlja1NpemUoNilcbiAgICAudGlja1BhZGRpbmcoMTApXG4gICAgLnRpY2tGb3JtYXQodGlja0Zvcm1hdCk7XG5cbiAgaWYgKHR5cGVvZiBjb25maWcuYXhpc0Zvcm1hdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbmZpZy5heGlzRm9ybWF0KHhBeGlzKTtcbiAgfVxuXG4gIHZhciB5ID0gKHdoZXJlID09ICdib3R0b20nKSA/IDAgOiBjb25maWcubWFyZ2luLnRvcCAtIDE7XG5cblxuICB4QXhpc0Vsc1t3aGVyZV0gPSBncmFwaFxuICAgIC5hcHBlbmQoJ2cnKVxuICAgIC5jbGFzc2VkKCd4LWF4aXMgYXhpcycsIHRydWUpXG4gICAgLmNsYXNzZWQod2hlcmUsIHRydWUpXG4gICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIGNvbmZpZy5tYXJnaW4ubGVmdCArICcsICcgKyB5ICsgJyknKVxuICAgIC5jYWxsKHhBeGlzW3doZXJlXSk7XG5cbiAgdmFyIGRyYXdYQXhpcyA9IGZ1bmN0aW9uIGRyYXdYQXhpcygpIHtcbiAgICB4QXhpc0Vsc1t3aGVyZV1cbiAgICAgIC5jYWxsKHhBeGlzW3doZXJlXSk7XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBkcmF3WEF4aXM6IGRyYXdYQXhpc1xuICB9O1xufTtcbiJdfQ==
