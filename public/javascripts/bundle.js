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
    level: 1,
    minScale: 0.03,
    maxScale: 2,
    margin: {
      top: 4,
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

  var app = function app(config) {
    // //console.log(config);
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
          .on("zoomend", zoomEnd);

        config.stepWidth = 40;
        config.step = graphWidth / config.stepWidth;
        config.end = d3.time.day.offset(config.start, config.step);
        config.zoom = zoom;


        var days = d3.time.days(config.start, config.end);
        xScale.range([0, graphWidth])
          .domain([config.start, config.end])
          .nice(d3.time.day);
        // //console.log(config.start);
        // //console.log(config.end);



        zoom.x(xScale);
        zoom.size([graphWidth, graphHeight]);

        var wrapperHeight = $('#wrapper').height();
        graphHeight = data.length * 40;
        graphHeight = graphHeight < wrapperHeight ? wrapperHeight :
          graphHeight;
        //console.log(data.length + '个任务');
        var svg = d3.select(this)
          .append('svg')
          .attr('class', 'app')
          .attr('width', graphWidth)
          .attr('height', graphHeight);

        var dom = '<canvas id="container-box-bg" width="' + graphWidth + '" height="' + 1000 + '">'
        $("#wrapper").append(dom);

        // var graphBG = svg.append('canvas')
        //   .attr('id', 'container-box-bg');

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
          // .attr("stroke-dasharray", "10, 10")
          .attr('x1', config.margin.left)
          .attr('x2', config.margin.left + graphWidth);

        yTick.exit().remove();

        var wrapperHeight = $('#wrapper').height();
        // //console.log("graphHeight==" + graphHeight + '/' + wrapperHeight);

        function drawZoom() {
          var curx, cury;
          var zoomRect = graph
            .append('rect')
            .call(zoom)
            .classed('zoom', true)
            .attr('fill', 'green')
            .attr('width', graphWidth)
            .attr('height', graphHeight);
          return zoomRect;
        }
        drawZoom();

        graph.select('.graph-body').remove();
        var graphBody = graph
          .append('g')
          .classed('graph-body', true);

        var timer = null;
        var startScale = zoom.scale();
        var startTrans = zoom.translate();

        function zoomstart() {
          startScale = zoom.scale();
          startTrans = zoom.translate();
          config.scale = null;
          config.translate = null;
          if (d3.event.sourceEvent && d3.event.sourceEvent.toString() ===
            '[object WheelEvent]') {
            if (!d3.event.sourceEvent.altKey) {
              config.scale = zoom.scale();
              config.translate = zoom.translate();
            }
          } else {
            return false;
          }
          //console.log(d3.event);
        }

        function updateZoom() {
          if (d3.event.sourceEvent && d3
            .event.sourceEvent.toString() ===
            '[object MouseEvent]') {
            d3.selectAll('.menu').remove()
            zoom.translate([d3.event.translate[0], 0]);
            //console.log('水平拖动');

            // if (config.scale && config.translate) {
            //   zoom.scale(config.scale);
            //   zoom.translate(config.translate);
            // }
            if (timer) {
              clearTimeout(timer);
            }
            redraw(false);
            timer = setTimeout(function() {
              redraw(true);
            }, 300);
          } else if (d3.event.sourceEvent && d3.event.sourceEvent.altKey && d3
            .event.sourceEvent.toString() ===
            '[object WheelEvent]') {
            //console.log('水平缩放');
            zoom.scale(d3.event.scale);

            // //console.log('d3.event.translate[0]='+d3.event.translate[0]);
            // if(d3.event.translate[0]<0){
            //   return;
            // }

            // zoom.translate([d3.event.translate[0], 0]);
            // zoom.scale(config.scale);



            // if (config.scale && config.translate) {
            //   zoom.scale(config.scale);
            //   zoom.translate(config.translate);
            // }
            if (timer) {
              clearTimeout(timer);
            }
            redraw(false);
            timer = setTimeout(function() {
              redraw(true);
            }, 300);
          } else{
            zoom.scale(startScale);
            zoom.translate(startTrans);
          }
        }

        function zoomEnd() {
          if (typeof config.zoomHandler ===
            'function') {
            config.zoomHandler({
              scale: zoom.scale(),
              translateX: zoom.translate()[0]
            });
          }
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
          // //console.log('重画整体' + fullRedraw + '=' + (et - st) + 'ms');
        }
        zoom.scale(config.level || 1);
        // if (config.zoomScale) {
        //   zoom.scale(config.zoomScale);
        // }
        if (config.translateX) {
          zoom.translate([config.translateX, 0])
        }
        redraw(true);
        // window.redraw = redraw;
      });
      loaded();
    }
    configurable(init, config);
    return init;
  };

  return app;
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
              //console.log("zoomstart:" + task._xCurr);
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
              //console.log("zoomstart:" + task._xCurr);
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
                  task.startDate = d3.time.day.offset(task._startDate, steps);
                  redrawTask();
                  var x1 = percentX();
                  // percentBtn.attr("x", x1);
                  //
                  w = xScale(task.endDate) - xScale(task.startDate);
                  var maskX = xScale(task.startDate);
                  drawMask(maskX, w);
                  var px = maskX-xScale(task._startDate)+w*task.percent;

                  percentBtn.attr('transform', "translate(" + px + ", 19)");
                }
                return false;
              })
            .on("zoomend", function() {
              redrawMenu();
              clearMask();
              if (typeof config.changeStartTimeHandler ===
                'function') {
                config.changeStartTimeHandler(taskBox.data()[0]);
              }
            });


          //结束时间调整开始
          endTimeListener.on('zoomstart', function() {
              task._startDate = task.startDate;
              task._endDate = task.endDate;
              task._steps = 0;
              task._xCurr = d3.event.sourceEvent.clientX;
              task._width = xScale(task.endDate) - xScale(task.startDate);
              //console.log("zoomstart:" + task._xCurr);
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
                  var px = w * task.percent;

                  percentBtn.attr('transform', "translate(" + px + ", 19)");
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

          // percentBtn.on('mouseover', tooltip.mouseover)
          //   .on('mouseout', tooltip.mouseout)
          //   .on('mousemove', tooltip.mousemove);
        }

        var percentX = function() {
          var task = taskBox.data()[0];
          var x = 0;
          // //console.log(leftBtn.attr('x'));
          // //console.log(rightBtn.attr('x'));
          // var left = parseFloat(leftBtn.attr('x')) + 10;
          // var right = parseFloat(rightBtn.attr('x')) - 10;
          // x = left + (right - left) * (task.percent || 0);
          // //console.log('left=' + left + '\t=' + right + '\t' + x);
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
          // //console.log('重画任务');
          lineSvg.selectAll('.item').remove();
          taskBox.enter()
            .insert('g')
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
            taskBox.on('mouseover', tooltip.mouseover)
            .on('mouseout', tooltip.mouseout)
            .on('mousemove', tooltip.mousemove);
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
        var transformMoveBefore = '';
        moveListener
          .on('zoomstart', function() {
            transformMoveBefore = taskBox.attr('transform');
          })
          .on("zoom",
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
            })
          .on("zoomend", function() {
            var box = d3.select('#container-box');
            box.select('.lline').remove();
            if(transformMoveBefore!=taskBox.attr('transform')){
              if (typeof config.changeTimeHandler === 'function') {
                config.changeTimeHandler(taskBox.data()[0]);
              }
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
    //   //console.log([y, yMin, yMax].join(','))
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
  //console.log('count===' + count);

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
    // //console.log('where===' + where);
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
        // //console.log(data);
        // //console.log('画任务');
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
            // .attr('rx', 4)
            // .attr('ry', 4)
            .attr('stroke', "#a0a0a0")
            .attr('stroke-width', 1)
            .attr('width', function() {
              // //console.log(data.endDate + '\t' + data.startDate +
              //   '\t' + (xScale(data.endDate) - xScale(data.startDate))
              // );
              return (xScale(data.endDate) - xScale(data.startDate))
            });

          var pre = container.append('rect')
            .style('fill', "#6df3d2")
            .attr('stroke', "#a0a0a0")
            .attr('class', "task pre")
            .attr('transform', "translate(0, 0.5)")
            // .attr('rx', 4)
            // .attr('ry', 4)
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
            .attr('style', 'fill:#FF953B;stroke-width:1');

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
  var formater = d3.time.format("%Y-%m-%d %H:%M:%S")

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
    .tickFormat(tickFormat);

  var lineY = (where == 'bottom') ? 0 : config.margin.top - 2;

  var getMonthWeek = function(a, b, c) {
    /*
    a = d = 当前日期
    b = 6 - w = 当前周的还有几天过完（不算今天）
    a + b 的和在除以7 就是当天是当前月份的第几周
    */
    var date = new Date(a, parseInt(b) - 1, c),
      w = date.getDay(),
      d = date.getDate();
    return Math.ceil(
      (d + 6 - w) / 7
    );
  };

  var getYearWeek = function(a, b, c) {
    /*
    date1是当前日期
    date2是当年第一天
    d是当前日期是今年第多少天
    用d + 当前年的第一天的周差距的和在除以7就是本年第几周
    */
    var date1 = new Date(a, parseInt(b) - 1, c),
      date2 = new Date(a, 0, 1),
      d = Math.round((date1.valueOf() - date2.valueOf()) / 86400000);
    return Math.ceil(
      (d + ((date2.getDay() + 1) - 1)) / 7
    );
  };



  //------------------------------------------------------------------------

  var drawYear = function() {
    var start = d3.time.year.offset(scale[0], -5);
    var end = d3.time.year.offset(scale[1], 5);
    var months = d3.time.years(start, end);

    var xAxisMonthBox = null,
      monthWidth = 0;
    xAxisMonthBox = mainBox.selectAll('g').data(months);

    var o = xAxisMonthBox.enter()
      .append('g')
      .attr('transform', function(d) {
        return 'translate(' + (xScale(d)) + ',0)';
      })

    o.append('rect')
      .attr('width', function(d) {
        var next = d3.time.year.offset(d, 1);
        next = d3.time.year(next);
        monthWidth = xScale(next) - xScale(d);
        return monthWidth - 1;
      })
      .attr('fill', '#EFEFEF')
      .attr('height', 20)

    o.append('text')
      .attr("dx", 10)
      .attr("dy", 13)
      .attr('transform', function() {
        return 'translate(' + (monthWidth / 2 - 40) + ', 0)';
      })
      .text(function(d) {
        window.d = d;
        return d.getFullYear() + '年';
      });

    xAxisMonthBox.exit().remove();
  }

  var zoom = config.zoom;
  var scale = xScale.domain();
  graph.selectAll('.xAxisMonthBox').remove();
  var mainBox = graph.append('g').classed('xAxisMonthBox', true);
  graph.selectAll('.xAxisBox').remove();
  var subBox = graph.append('g').classed('xAxisBox', true);
  var zoomScale = zoom.scale();

  var drawMonth = function() {
    var start = d3.time.day.offset(scale[0], -32);
    var end = d3.time.day.offset(scale[1], 32);
    var months = d3.time.months(start, end);

    var xAxisMonthBox = null,
      monthWidth = 0;
    xAxisMonthBox = mainBox.selectAll('g').data(months);

    var o = xAxisMonthBox.enter()
      .append('g')
      .attr('transform', function(d) {
        return 'translate(' + (xScale(d)) + ',0)';
      })

    o.append('rect')
      .attr('width', function(d) {
        var next = d3.time.day.offset(d, 31);
        next = d3.time.month(next);
        monthWidth = xScale(next) - xScale(d);
        return monthWidth;
      })
      .attr('fill', '#EFEFEF')
      .attr('stroke', '#D2D1D1')
      .attr('stroke-width', '1')
      .attr('shape-rendering', 'crispEdges')
      .attr('height', 20)

    o.append('text')
      .attr("dx", 10)
      .attr("dy", 13)
      .attr('transform', function() {
        return 'translate(' + (monthWidth / 2 - 40) + ', 0)';
      })
      .text(function(d) {
        window.d = d;
        return d.getFullYear() + '年' + (d.getMonth() + 1) + '月';
      });

    xAxisMonthBox.exit().remove();
  }



  ///////



  if (zoomScale > 0.7) {
    drawMonth();

    var start = d3.time.day.offset(scale[0], -7);
    var end = d3.time.day.offset(scale[1], +7);
    var days = d3.time.days(start, end);

    var xAxisBox = null;
    xAxisBox = subBox.selectAll('g').data(days);

    var o = xAxisBox.enter()
      .append('g')
      .attr('class', function(d) {
        var day = d.getDay();
        var result = '';
        if (day == 0 || day == 6) {
          result = 'd h'
        } else {
          result = 'd'
        }
        return result;
      })

      .attr('transform', function(d) {
        var dx = d3.time.day.offset(d, 0);
        return 'translate(' + (xScale(dx)) + ',0)';
      });

    o.append('rect')
      .attr('width', function(d) {
        var dx = d3.time.day.offset(d, 1);
        return xScale(dx) - xScale(d);
      })
      .attr('stroke', '#D2D1D1')
      .attr('stroke-width', '1')
      .attr('shape-rendering', 'crispEdges')
      .attr('height', 20)

    o.append('text')
      .attr("dx", 10)
      .attr("dy", 13)
      .text(function(d) {
        return d.getDate();
      });

    xAxisBox.exit().remove();
    //------

    var mycanvas=document.getElementById("container-box-bg");
    var mycontext=mycanvas.getContext('2d'); 
    mycontext.clearRect(0,0,mycanvas.width,mycanvas.height);

    var drawLine = function(dotXY, ops) {
      mycontext.beginPath();
      for (var att in ops) mycontext[att] = ops[att];
      dotXY = dotXY.constructor == Object ? [dotXY || {
        x: 0,
        y: 0
      }] : dotXY;
      mycontext.moveTo(dotXY[0].x, dotXY[0].y);
      for (var i = 1, len = dotXY.length; i < len; i++) mycontext.lineTo(dotXY[i].x, dotXY[i].y);
      mycontext.stroke();
    };



    for(var i=0;i<days.length;i++){
      var day = days[i];
      var x1 = xScale(day);
      var next = d3.time.day.offset(day, 1);
      var x2 = xScale(next) - xScale(day) - 1;
      x1 = Math.round(x1)+0.5;

      var day = day.getDay();
      var result = '';
      if (day == 0 || day == 6) {
        mycontext.fillStyle='rgb(242, 245, 251)';  
        mycontext.fillRect(x1,0,x2,1000);
      }
      drawLine([{ x: x1, y: 0 }, { x: x1, y: 1000 }]
      ,{lineWidth:1,strokeStyle:'rgb(230,228,229)'}); //+0.5偏移
    }

    //---


  } else if (zoomScale > 0.15) {
    drawMonth();

    var start = d3.time.day.offset(scale[0], -14);
    var end = d3.time.day.offset(scale[1], +14);
    var weeks = d3.time.weeks(start, end);
    for (var i = 0; i < weeks.length; i++) {
      weeks[i] = d3.time.day.offset(weeks[i], 1);
    }

    var xAxisBox = null,
      weekWidth = 0;
    xAxisBox = subBox.selectAll('g').data(weeks);

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
        var dx = d3.time.day.offset(d, 0);
        return 'translate(' + (xScale(dx)) + ',0)';
      });

    o.append('rect')
      .attr('width', function(d) {
        var dx = d3.time.day.offset(d, +7);
        weekWidth = xScale(dx) - xScale(d);
        return weekWidth;
      })
      .attr('stroke', '#D2D1D1')
      .attr('stroke-width', '1')
      .attr('shape-rendering', 'crispEdges')
      .attr('height', 20)

    o.append('text')
      .attr("dx", 10)
      .attr("dy", 13)
      .attr('transform', function() {
        return 'translate(' + (weekWidth / 2 - 20) + ', 0)';
      })
      .text(function(d) {
        var week = getYearWeek(d.getFullYear(), d.getMonth() + 1, d.getDate());
        return week + '周';
      });

    xAxisBox.exit().remove();
    //------

    var mycanvas=document.getElementById("container-box-bg");
    var mycontext=mycanvas.getContext('2d'); 
    mycontext.clearRect(0,0,mycanvas.width,mycanvas.height);

    var drawLine = function(dotXY, ops) {
      mycontext.beginPath();
      for (var att in ops) mycontext[att] = ops[att];
      dotXY = dotXY.constructor == Object ? [dotXY || {
        x: 0,
        y: 0
      }] : dotXY;
      mycontext.moveTo(dotXY[0].x, dotXY[0].y);
      for (var i = 1, len = dotXY.length; i < len; i++) mycontext.lineTo(dotXY[i].x, dotXY[i].y);
      mycontext.stroke();
    };



    for(var i=0;i<weeks.length;i++){
      var day = weeks[i];
      var x1 = xScale(day);
      var next = d3.time.day.offset(day, 7);
      var x2 = xScale(next) - xScale(day) - 1;
      x1 = Math.round(x1)+0.5;

      var day = day.getDay();
      var result = '';
      drawLine([{ x: x1, y: 0 }, { x: x1, y: 1000 }]
      ,{lineWidth:1,strokeStyle:'rgb(230,228,229)'}); //+0.5偏移
    }

    //---
  } else {
    drawYear();

    var start = d3.time.month.offset(scale[0], -1);
    var end = d3.time.month.offset(scale[1], +1);
    var months = d3.time.months(start, end);
    //console.log(months);

    var xAxisBox = null,
      monthWidth = 0;
    xAxisBox = subBox.selectAll('g').data(months);

    var o = xAxisBox.enter()
      .append('g')
      .attr('class', function(d) {
          return 'd'
      })
      .attr('transform', function(d) {
        var dx = d3.time.day.offset(d, 0);
        return 'translate(' + (xScale(dx)) + ',0)';
      });

    o.append('rect')
      .attr('width', function(d) {
        var dx = d3.time.month.offset(d, +1);
        monthWidth = xScale(dx) - xScale(d);
        return monthWidth;
      })
      .attr('stroke', '#D2D1D1')
      .attr('stroke-width', '1')
      .attr('shape-rendering', 'crispEdges')
      .attr('height', 20)

    o.append('text')
      .attr("dx", 10)
      .attr("dy", 13)
      .attr('transform', function() {
        return 'translate(' + (monthWidth / 2 - 20) + ', 0)';
      })
      .text(function(d) {
        return (d.getMonth() + 1) + '月';
      });

    xAxisBox.exit().remove();
    //------

    var mycanvas=document.getElementById("container-box-bg");
    var mycontext=mycanvas.getContext('2d'); 
    mycontext.clearRect(0,0,mycanvas.width,mycanvas.height);

    var drawLine = function(dotXY, ops) {
      mycontext.beginPath();
      for (var att in ops) mycontext[att] = ops[att];
      dotXY = dotXY.constructor == Object ? [dotXY || {
        x: 0,
        y: 0
      }] : dotXY;
      mycontext.moveTo(dotXY[0].x, dotXY[0].y);
      for (var i = 1, len = dotXY.length; i < len; i++) mycontext.lineTo(dotXY[i].x, dotXY[i].y);
      mycontext.stroke();
    };



    for(var i=0;i<months.length;i++){
      var day = months[i];
      var x1 = xScale(day);
      var dx = d3.time.month.offset(d, +1);
      var x2 = xScale(next) - xScale(day) - 1;
      x1 = Math.round(x1)+0.5;

      var day = day.getDay();
      var result = '';
      drawLine([{ x: x1, y: 0 }, { x: x1, y: 1000 }]
      ,{lineWidth:1,strokeStyle:'rgb(230,228,229)'}); //+0.5偏移
    }

    //---
  }



  if (where == 'top') {
    subBox.attr('transform', 'translate(0, 21)');
    mainBox.attr('transform', 'translate(0, 1)');
  } else {
    subBox.attr('transform', 'translate(0, 2)');
    mainBox.attr('transform', 'translate(0, 22)');
  }

  // graph.selectAll('line').remove();
  // var line = graph.append('line')
  //   .attr('x1', 0)
  //   .attr('x2', config.width)
  //   .attr('y1', lineY)
  //   .attr('y2', lineY);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvYXBwLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2V2ZW50TGluZS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9maWx0ZXJEYXRhLmpzIiwicHVibGljL2phdmFzY3JpcHRzL2ZpbHRlckxpbmUuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvbGVmdEJ0bi5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy9tYWluLmpzIiwicHVibGljL2phdmFzY3JpcHRzL211SXRlbXMuanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvcmlnaHRCdG4uanMiLCJwdWJsaWMvamF2YXNjcmlwdHMvdGFzay5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy91dGlsL2NvbmZpZ3VyYWJsZS5qcyIsInB1YmxpYy9qYXZhc2NyaXB0cy94QXhpcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBjb25maWd1cmFibGUgPSByZXF1aXJlKCcuL3V0aWwvY29uZmlndXJhYmxlJyk7XG52YXIgeEF4aXNGYWN0b3J5ID0gcmVxdWlyZSgnLi94QXhpcycpO1xudmFyIGZpbHRlckxpbmUgPSByZXF1aXJlKCcuL2ZpbHRlckxpbmUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkMykge1xuICB2YXIgZXZlbnRMaW5lID0gcmVxdWlyZSgnLi9ldmVudExpbmUnKShkMyk7XG5cbiAgLy/kuIDkupvpu5jorqTnmoTphY3nva5cbiAgdmFyIGRlZmF1bHRDb25maWcgPSB7XG4gICAgbmFtZTogJ3Byb2plY3QgbWFuYWdlcicsXG4gICAgc3RhcnQ6IGQzLnRpbWUuZGF5KG5ldyBEYXRlKCkpLFxuICAgIGVuZDogZDMudGltZS5kYXkub2Zmc2V0KGQzLnRpbWUuZGF5KG5ldyBEYXRlKCkpLCA3KSxcbiAgICBsZXZlbDogMSxcbiAgICBtaW5TY2FsZTogMC4wMyxcbiAgICBtYXhTY2FsZTogMixcbiAgICBtYXJnaW46IHtcbiAgICAgIHRvcDogNCxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICBib3R0b206IDQ1LFxuICAgICAgcmlnaHQ6IDBcbiAgICB9LFxuICAgIHRpY2tGb3JtYXQ6IFtcbiAgICAgIFtcIi4lTFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLmdldE1pbGxpc2Vjb25kcygpO1xuICAgICAgfV0sXG4gICAgICBbXCI6JVNcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXRTZWNvbmRzKCk7XG4gICAgICB9XSxcbiAgICAgIFtcIiVJOiVNXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuZ2V0TWludXRlcygpO1xuICAgICAgfV0sXG4gICAgICBbXCIlSSAlcFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLmdldEhvdXJzKCk7XG4gICAgICB9XSxcbiAgICAgIFtcIiVhICVkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuZ2V0RGF5KCkgJiYgZC5nZXREYXRlKCkgIT0gMTtcbiAgICAgIH1dLFxuICAgICAgW1wiJWIgJWRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXREYXRlKCkgIT0gMTtcbiAgICAgIH1dLFxuICAgICAgW1wiJUJcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5nZXRNb250aCgpO1xuICAgICAgfV0sXG4gICAgICBbXCIlWVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XVxuICAgIF0sXG4gICAgd2lkdGg6IDEwMDBcbiAgfTtcblxuICB2YXIgYXBwID0gZnVuY3Rpb24gYXBwKGNvbmZpZykge1xuICAgIC8vIC8vY29uc29sZS5sb2coY29uZmlnKTtcbiAgICB2YXIgeFNjYWxlID0gZDMudGltZS5zY2FsZSgpO1xuICAgIHZhciB5U2NhbGUgPSBkMy5zY2FsZS5vcmRpbmFsKCk7XG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIGZvciAodmFyIGtleSBpbiBkZWZhdWx0Q29uZmlnKSB7XG4gICAgICBjb25maWdba2V5XSA9IGNvbmZpZ1trZXldIHx8IGRlZmF1bHRDb25maWdba2V5XTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbml0KHNlbGVjdGlvbikge1xuXG4gICAgICBzZWxlY3Rpb24uZWFjaChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBncmFwaEhlaWdodCA9IDA7XG4gICAgICAgIHZhciBncmFwaFdpZHRoID0gY29uZmlnLndpZHRoO1xuICAgICAgICBkMy5zZWxlY3QodGhpcykuc2VsZWN0KCdzdmcnKS5yZW1vdmUoKTtcblxuICAgICAgICB2YXIgem9vbSA9IGQzLmJlaGF2aW9yLnpvb20oKS5jZW50ZXIobnVsbCkuc2NhbGVFeHRlbnQoW2NvbmZpZy5taW5TY2FsZSxcbiAgICAgICAgICAgIGNvbmZpZy5tYXhTY2FsZVxuICAgICAgICAgIF0pXG4gICAgICAgICAgLm9uKCd6b29tc3RhcnQnLCB6b29tc3RhcnQpXG4gICAgICAgICAgLm9uKFwiem9vbVwiLCB1cGRhdGVab29tKVxuICAgICAgICAgIC5vbihcInpvb21lbmRcIiwgem9vbUVuZCk7XG5cbiAgICAgICAgY29uZmlnLnN0ZXBXaWR0aCA9IDQwO1xuICAgICAgICBjb25maWcuc3RlcCA9IGdyYXBoV2lkdGggLyBjb25maWcuc3RlcFdpZHRoO1xuICAgICAgICBjb25maWcuZW5kID0gZDMudGltZS5kYXkub2Zmc2V0KGNvbmZpZy5zdGFydCwgY29uZmlnLnN0ZXApO1xuICAgICAgICBjb25maWcuem9vbSA9IHpvb207XG5cblxuICAgICAgICB2YXIgZGF5cyA9IGQzLnRpbWUuZGF5cyhjb25maWcuc3RhcnQsIGNvbmZpZy5lbmQpO1xuICAgICAgICB4U2NhbGUucmFuZ2UoWzAsIGdyYXBoV2lkdGhdKVxuICAgICAgICAgIC5kb21haW4oW2NvbmZpZy5zdGFydCwgY29uZmlnLmVuZF0pXG4gICAgICAgICAgLm5pY2UoZDMudGltZS5kYXkpO1xuICAgICAgICAvLyAvL2NvbnNvbGUubG9nKGNvbmZpZy5zdGFydCk7XG4gICAgICAgIC8vIC8vY29uc29sZS5sb2coY29uZmlnLmVuZCk7XG5cblxuXG4gICAgICAgIHpvb20ueCh4U2NhbGUpO1xuICAgICAgICB6b29tLnNpemUoW2dyYXBoV2lkdGgsIGdyYXBoSGVpZ2h0XSk7XG5cbiAgICAgICAgdmFyIHdyYXBwZXJIZWlnaHQgPSAkKCcjd3JhcHBlcicpLmhlaWdodCgpO1xuICAgICAgICBncmFwaEhlaWdodCA9IGRhdGEubGVuZ3RoICogNDA7XG4gICAgICAgIGdyYXBoSGVpZ2h0ID0gZ3JhcGhIZWlnaHQgPCB3cmFwcGVySGVpZ2h0ID8gd3JhcHBlckhlaWdodCA6XG4gICAgICAgICAgZ3JhcGhIZWlnaHQ7XG4gICAgICAgIC8vY29uc29sZS5sb2coZGF0YS5sZW5ndGggKyAn5Liq5Lu75YqhJyk7XG4gICAgICAgIHZhciBzdmcgPSBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuYXBwZW5kKCdzdmcnKVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdhcHAnKVxuICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGdyYXBoV2lkdGgpXG4gICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGdyYXBoSGVpZ2h0KTtcblxuICAgICAgICB2YXIgZG9tID0gJzxjYW52YXMgaWQ9XCJjb250YWluZXItYm94LWJnXCIgd2lkdGg9XCInICsgZ3JhcGhXaWR0aCArICdcIiBoZWlnaHQ9XCInICsgMTAwMCArICdcIj4nXG4gICAgICAgICQoXCIjd3JhcHBlclwiKS5hcHBlbmQoZG9tKTtcblxuICAgICAgICAvLyB2YXIgZ3JhcGhCRyA9IHN2Zy5hcHBlbmQoJ2NhbnZhcycpXG4gICAgICAgIC8vICAgLmF0dHIoJ2lkJywgJ2NvbnRhaW5lci1ib3gtYmcnKTtcblxuICAgICAgICB2YXIgZ3JhcGggPSBzdmcuYXBwZW5kKCdnJylcbiAgICAgICAgICAuYXR0cignaWQnLCAnY29udGFpbmVyLWJveCcpO1xuICAgICAgICB2YXIgeURvbWFpbiA9IFtdO1xuICAgICAgICB2YXIgeVJhbmdlID0gW107XG5cbiAgICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKHRhc2ssIGluZGV4KSB7XG4gICAgICAgICAgeURvbWFpbi5wdXNoKHRhc2sudXVpZCk7XG4gICAgICAgICAgeVJhbmdlLnB1c2goaW5kZXggKiA0MCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHlTY2FsZS5kb21haW4oeURvbWFpbikucmFuZ2UoeVJhbmdlKTtcblxuXG4gICAgICAgIHZhciB5QXhpc0VsID0gZ3JhcGguYXBwZW5kKCdnJylcbiAgICAgICAgICAuY2xhc3NlZCgneS1heGlzIGF4aXMnLCB0cnVlKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIC0xKScpXG4gICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAnMC40Jyk7XG5cbiAgICAgICAgdmFyIHlUaWNrID0geUF4aXNFbC5hcHBlbmQoJ2cnKS5zZWxlY3RBbGwoJ2cnKS5kYXRhKHlEb21haW4pO1xuXG4gICAgICAgIHlUaWNrLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoMCwgJyArICh5U2NhbGUoZCkgLSAxKSArICcpJztcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgIC5jbGFzc2VkKCd5LXRpY2snLCB0cnVlKVxuICAgICAgICAgIC8vIC5hdHRyKFwic3Ryb2tlLWRhc2hhcnJheVwiLCBcIjEwLCAxMFwiKVxuICAgICAgICAgIC5hdHRyKCd4MScsIGNvbmZpZy5tYXJnaW4ubGVmdClcbiAgICAgICAgICAuYXR0cigneDInLCBjb25maWcubWFyZ2luLmxlZnQgKyBncmFwaFdpZHRoKTtcblxuICAgICAgICB5VGljay5leGl0KCkucmVtb3ZlKCk7XG5cbiAgICAgICAgdmFyIHdyYXBwZXJIZWlnaHQgPSAkKCcjd3JhcHBlcicpLmhlaWdodCgpO1xuICAgICAgICAvLyAvL2NvbnNvbGUubG9nKFwiZ3JhcGhIZWlnaHQ9PVwiICsgZ3JhcGhIZWlnaHQgKyAnLycgKyB3cmFwcGVySGVpZ2h0KTtcblxuICAgICAgICBmdW5jdGlvbiBkcmF3Wm9vbSgpIHtcbiAgICAgICAgICB2YXIgY3VyeCwgY3VyeTtcbiAgICAgICAgICB2YXIgem9vbVJlY3QgPSBncmFwaFxuICAgICAgICAgICAgLmFwcGVuZCgncmVjdCcpXG4gICAgICAgICAgICAuY2FsbCh6b29tKVxuICAgICAgICAgICAgLmNsYXNzZWQoJ3pvb20nLCB0cnVlKVxuICAgICAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnZ3JlZW4nKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgZ3JhcGhXaWR0aClcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBncmFwaEhlaWdodCk7XG4gICAgICAgICAgcmV0dXJuIHpvb21SZWN0O1xuICAgICAgICB9XG4gICAgICAgIGRyYXdab29tKCk7XG5cbiAgICAgICAgZ3JhcGguc2VsZWN0KCcuZ3JhcGgtYm9keScpLnJlbW92ZSgpO1xuICAgICAgICB2YXIgZ3JhcGhCb2R5ID0gZ3JhcGhcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAuY2xhc3NlZCgnZ3JhcGgtYm9keScsIHRydWUpO1xuXG4gICAgICAgIHZhciB0aW1lciA9IG51bGw7XG4gICAgICAgIHZhciBzdGFydFNjYWxlID0gem9vbS5zY2FsZSgpO1xuICAgICAgICB2YXIgc3RhcnRUcmFucyA9IHpvb20udHJhbnNsYXRlKCk7XG5cbiAgICAgICAgZnVuY3Rpb24gem9vbXN0YXJ0KCkge1xuICAgICAgICAgIHN0YXJ0U2NhbGUgPSB6b29tLnNjYWxlKCk7XG4gICAgICAgICAgc3RhcnRUcmFucyA9IHpvb20udHJhbnNsYXRlKCk7XG4gICAgICAgICAgY29uZmlnLnNjYWxlID0gbnVsbDtcbiAgICAgICAgICBjb25maWcudHJhbnNsYXRlID0gbnVsbDtcbiAgICAgICAgICBpZiAoZDMuZXZlbnQuc291cmNlRXZlbnQgJiYgZDMuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICdbb2JqZWN0IFdoZWVsRXZlbnRdJykge1xuICAgICAgICAgICAgaWYgKCFkMy5ldmVudC5zb3VyY2VFdmVudC5hbHRLZXkpIHtcbiAgICAgICAgICAgICAgY29uZmlnLnNjYWxlID0gem9vbS5zY2FsZSgpO1xuICAgICAgICAgICAgICBjb25maWcudHJhbnNsYXRlID0gem9vbS50cmFuc2xhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvL2NvbnNvbGUubG9nKGQzLmV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZVpvb20oKSB7XG4gICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzXG4gICAgICAgICAgICAuZXZlbnQuc291cmNlRXZlbnQudG9TdHJpbmcoKSA9PT1cbiAgICAgICAgICAgICdbb2JqZWN0IE1vdXNlRXZlbnRdJykge1xuICAgICAgICAgICAgZDMuc2VsZWN0QWxsKCcubWVudScpLnJlbW92ZSgpXG4gICAgICAgICAgICB6b29tLnRyYW5zbGF0ZShbZDMuZXZlbnQudHJhbnNsYXRlWzBdLCAwXSk7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCfmsLTlubPmi5bliqgnKTtcblxuICAgICAgICAgICAgLy8gaWYgKGNvbmZpZy5zY2FsZSAmJiBjb25maWcudHJhbnNsYXRlKSB7XG4gICAgICAgICAgICAvLyAgIHpvb20uc2NhbGUoY29uZmlnLnNjYWxlKTtcbiAgICAgICAgICAgIC8vICAgem9vbS50cmFuc2xhdGUoY29uZmlnLnRyYW5zbGF0ZSk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICBpZiAodGltZXIpIHtcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlZHJhdyhmYWxzZSk7XG4gICAgICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJlZHJhdyh0cnVlKTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC5hbHRLZXkgJiYgZDNcbiAgICAgICAgICAgIC5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PVxuICAgICAgICAgICAgJ1tvYmplY3QgV2hlZWxFdmVudF0nKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCfmsLTlubPnvKnmlL4nKTtcbiAgICAgICAgICAgIHpvb20uc2NhbGUoZDMuZXZlbnQuc2NhbGUpO1xuXG4gICAgICAgICAgICAvLyAvL2NvbnNvbGUubG9nKCdkMy5ldmVudC50cmFuc2xhdGVbMF09JytkMy5ldmVudC50cmFuc2xhdGVbMF0pO1xuICAgICAgICAgICAgLy8gaWYoZDMuZXZlbnQudHJhbnNsYXRlWzBdPDApe1xuICAgICAgICAgICAgLy8gICByZXR1cm47XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8vIHpvb20udHJhbnNsYXRlKFtkMy5ldmVudC50cmFuc2xhdGVbMF0sIDBdKTtcbiAgICAgICAgICAgIC8vIHpvb20uc2NhbGUoY29uZmlnLnNjYWxlKTtcblxuXG5cbiAgICAgICAgICAgIC8vIGlmIChjb25maWcuc2NhbGUgJiYgY29uZmlnLnRyYW5zbGF0ZSkge1xuICAgICAgICAgICAgLy8gICB6b29tLnNjYWxlKGNvbmZpZy5zY2FsZSk7XG4gICAgICAgICAgICAvLyAgIHpvb20udHJhbnNsYXRlKGNvbmZpZy50cmFuc2xhdGUpO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgaWYgKHRpbWVyKSB7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWRyYXcoZmFsc2UpO1xuICAgICAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZWRyYXcodHJ1ZSk7XG4gICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgIHpvb20uc2NhbGUoc3RhcnRTY2FsZSk7XG4gICAgICAgICAgICB6b29tLnRyYW5zbGF0ZShzdGFydFRyYW5zKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB6b29tRW5kKCkge1xuICAgICAgICAgIGlmICh0eXBlb2YgY29uZmlnLnpvb21IYW5kbGVyID09PVxuICAgICAgICAgICAgJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uZmlnLnpvb21IYW5kbGVyKHtcbiAgICAgICAgICAgICAgc2NhbGU6IHpvb20uc2NhbGUoKSxcbiAgICAgICAgICAgICAgdHJhbnNsYXRlWDogem9vbS50cmFuc2xhdGUoKVswXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBsaW5lcyA9IG51bGw7XG4gICAgICAgIGxpbmVzID0gZ3JhcGhCb2R5LnNlbGVjdEFsbCgnZycpLmRhdGEoZGF0YSk7XG5cbiAgICAgICAgbGluZXMuZW50ZXIoKVxuICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5jbGFzc2VkKCdsaW5lJywgdHJ1ZSlcbiAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoMCwnICsgKHlTY2FsZShkLnV1aWQpKSArICcpJztcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIGNvbmZpZy5ldmVudExpbmVDb2xvcik7XG5cbiAgICAgICAgbGluZXMuZXhpdCgpLnJlbW92ZSgpO1xuXG5cbiAgICAgICAgZnVuY3Rpb24gcmVkcmF3KGZ1bGxSZWRyYXcpIHtcbiAgICAgICAgICB2YXIgc3QgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgICAgICAgIHZhciB4dG9wID0gZDMuc2VsZWN0KCcjaGVhZGVyJyk7XG4gICAgICAgICAgeHRvcC5zZWxlY3QoJ2cnKS5yZW1vdmUoKTtcbiAgICAgICAgICB2YXIgeEF4aXNUb3AgPSB4QXhpc0ZhY3RvcnkoZDMsIGNvbmZpZywgeFNjYWxlLCB4dG9wLFxuICAgICAgICAgICAgZ3JhcGhIZWlnaHQsICd0b3AnKTtcblxuICAgICAgICAgIHZhciB4Ym90dG9tID0gZDMuc2VsZWN0KCcjZm9vdGVyJyk7XG4gICAgICAgICAgeGJvdHRvbS5zZWxlY3QoJ2cnKS5yZW1vdmUoKTtcbiAgICAgICAgICB2YXIgeEF4aXNCb3R0b20gPSB4QXhpc0ZhY3RvcnkoZDMsIGNvbmZpZywgeFNjYWxlLCB4Ym90dG9tLFxuICAgICAgICAgICAgZ3JhcGhIZWlnaHQsICdib3R0b20nKTtcblxuICAgICAgICAgIGxpbmVzLmNhbGwoZXZlbnRMaW5lKHtcbiAgICAgICAgICAgIHJlYWRvbmx5OiBjb25maWcucmVhZG9ubHksXG4gICAgICAgICAgICBtYXJnaW46IGNvbmZpZy5tYXJnaW4sXG4gICAgICAgICAgICBncmFwaEhlaWdodDogZ3JhcGhIZWlnaHQsXG4gICAgICAgICAgICB5U2NhbGU6IHlTY2FsZSxcbiAgICAgICAgICAgIHhTY2FsZTogeFNjYWxlLFxuICAgICAgICAgICAgZnVsbFJlZHJhdzogZnVsbFJlZHJhdyxcbiAgICAgICAgICAgIGV2ZW50Q29sb3I6IGNvbmZpZy5ldmVudENvbG9yLFxuICAgICAgICAgICAgY2hhbmdlVGltZUhhbmRsZXI6IGNvbmZpZy5jaGFuZ2VUaW1lSGFuZGxlcixcbiAgICAgICAgICAgIGNoYW5nZVN0YXJ0VGltZUhhbmRsZXI6IGNvbmZpZy5jaGFuZ2VTdGFydFRpbWVIYW5kbGVyLFxuICAgICAgICAgICAgY2hhbmdlRW5kVGltZUhhbmRsZXI6IGNvbmZpZy5jaGFuZ2VFbmRUaW1lSGFuZGxlcixcbiAgICAgICAgICAgIGNoYW5nZVBlcmNlbnRIYW5kbGVyOiBjb25maWcuY2hhbmdlUGVyY2VudEhhbmRsZXJcbiAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICB2YXIgZXQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAvLyAvL2NvbnNvbGUubG9nKCfph43nlLvmlbTkvZMnICsgZnVsbFJlZHJhdyArICc9JyArIChldCAtIHN0KSArICdtcycpO1xuICAgICAgICB9XG4gICAgICAgIHpvb20uc2NhbGUoY29uZmlnLmxldmVsIHx8IDEpO1xuICAgICAgICAvLyBpZiAoY29uZmlnLnpvb21TY2FsZSkge1xuICAgICAgICAvLyAgIHpvb20uc2NhbGUoY29uZmlnLnpvb21TY2FsZSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgaWYgKGNvbmZpZy50cmFuc2xhdGVYKSB7XG4gICAgICAgICAgem9vbS50cmFuc2xhdGUoW2NvbmZpZy50cmFuc2xhdGVYLCAwXSlcbiAgICAgICAgfVxuICAgICAgICByZWRyYXcodHJ1ZSk7XG4gICAgICAgIC8vIHdpbmRvdy5yZWRyYXcgPSByZWRyYXc7XG4gICAgICB9KTtcbiAgICAgIGxvYWRlZCgpO1xuICAgIH1cbiAgICBjb25maWd1cmFibGUoaW5pdCwgY29uZmlnKTtcbiAgICByZXR1cm4gaW5pdDtcbiAgfTtcblxuICByZXR1cm4gYXBwO1xufTsiLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCByZXF1aXJlLCBtb2R1bGUsIGQzICovXG5cbnZhciBjb25maWd1cmFibGUgPSByZXF1aXJlKCcuL3V0aWwvY29uZmlndXJhYmxlJyk7XG52YXIgZmlsdGVyRGF0YSA9IHJlcXVpcmUoJy4vZmlsdGVyRGF0YScpO1xudmFyIG11RmFjdG9yeSA9IHJlcXVpcmUoJy4vbXVJdGVtcycpO1xuXG52YXIgZGVmYXVsdENvbmZpZyA9IHtcbiAgeFNjYWxlOiBudWxsXG59O1xudmFyIGZvcm1hdGVyID0gZDMudGltZS5mb3JtYXQoXCIlWS0lbS0lZCAlSDolTTolU1wiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGQzKSB7XG4gIHZhciB0YXNrID0gcmVxdWlyZSgnLi90YXNrJykoZDMpO1xuICB2YXIgbGVmdEJ0biA9IHJlcXVpcmUoJy4vbGVmdEJ0bicpKGQzKTtcbiAgdmFyIHJpZ2h0QnRuID0gcmVxdWlyZSgnLi9yaWdodEJ0bicpKGQzKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7XG4gICAgICB4U2NhbGU6IG51bGwsXG4gICAgICByZWRyYXc6IHRydWUsXG4gICAgICBldmVudENvbG9yOiBudWxsXG4gICAgfTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdENvbmZpZykge1xuICAgICAgY29uZmlnW2tleV0gPSBjb25maWdba2V5XSB8fCBkZWZhdWx0Q29uZmlnW2tleV07XG4gICAgfVxuICAgIC8v6L+H5ruk55SoXG4gICAgdmFyIHNjcm9sbFRvcE9mZnNldCA9ICQoJyNzY3JvbGxlcicpLm9mZnNldCgpLnRvcDtcbiAgICB2YXIgeU1pbiA9IDAgLSBzY3JvbGxUb3BPZmZzZXQ7XG4gICAgdmFyIHlNYXggPSAwIC0gc2Nyb2xsVG9wT2Zmc2V0ICsgJCgnI3dyYXBwZXInKS5oZWlnaHQoKSArIDgwO1xuICAgIC8v5b2T5YmN6YCJ5Lit55qE5piv5ZOq5LiA5Liq5Lu75YqhXG4gICAgdmFyIHNlbGVjdGVkVGFzayA9IG51bGw7XG4gICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgLy9cbiAgICB2YXIgZXZlbnRMaW5lID0gZnVuY3Rpb24gZXZlbnRMaW5lKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgbGluZVN2ZyA9IGQzLnNlbGVjdCh0aGlzKTtcbiAgICAgICAgbGluZVN2Zy5zZWxlY3RBbGwoJy5pdGVtJykucmVtb3ZlKCk7XG4gICAgICAgIHZhciB0YXNrQm94ID0gbGluZVN2Z1xuICAgICAgICAgIC5zZWxlY3RBbGwoJy5pdGVtJylcbiAgICAgICAgICAuZGF0YShmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyRGF0YShkLnRhc2tzLCBjb25maWcueFNjYWxlLCBjb25maWcueVNjYWxlLFxuICAgICAgICAgICAgICB5TWluLCB5TWF4LCBjb25maWcuZnVsbFJlZHJhdyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHZhciBtb3ZlTGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpO1xuXG4gICAgICAgIC8v5aSE55CG5o+Q56S65L+h5oGvXG4gICAgICAgIHZhciB0b29sdGlwID0gZDMuaGVscGVyLnRvb2x0aXAoKVxuICAgICAgICAgIC5wYWRkaW5nKDE2LCAyNSlcbiAgICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICB2YXIgeCA9IHRhc2tCb3guYXR0cigneCcpO1xuICAgICAgICAgICAgdmFyIHRpbWVPblNjYWxlID0gY29uZmlnLnhTY2FsZS5pbnZlcnQoeCk7XG4gICAgICAgICAgICB2YXIgc3RhdCA9IGQuc3RhdHVzID09ICdmaW5pc2gnID8gJ+WujOe7kycgOiAn6L+b6KGM5LitJztcbiAgICAgICAgICAgIHZhciBodG1sID0gW107XG4gICAgICAgICAgICBodG1sLnB1c2goJzxoMT4nICsgZC5uYW1lICsgJzwvaDE+Jyk7XG4gICAgICAgICAgICBodG1sLnB1c2goJzx1bD4nKVxuICAgICAgICAgICAgaHRtbC5wdXNoKCc8bGkgY2xhc3M9XCJpXCI+5byA5aeL5pe26Ze0OiAgJyArIGZvcm1hdGVyKGQuc3RhcnREYXRlKSArXG4gICAgICAgICAgICAgICc8L2xpPicpXG4gICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cImlcIj7nu5PmnZ/ml7bpl7Q6ICAnICsgZm9ybWF0ZXIoZC5lbmREYXRlKSArXG4gICAgICAgICAgICAgICc8L2xpPicpXG4gICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cImlcIj7ku7vliqHnirbmgIE6ICAnICsgc3RhdCArICc8L2xpPicpXG4gICAgICAgICAgICBodG1sLnB1c2goJzxsaSBjbGFzcz1cImlcIj7ov5vluqY6ICAnICsgKGQucGVyY2VudCB8fCAwKSAqXG4gICAgICAgICAgICAgIDEwMCArXG4gICAgICAgICAgICAgICclPC9saT4nKVxuICAgICAgICAgICAgcmV0dXJuIGh0bWwuam9pbignJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIC8v55S76I+c5Y2VXG5cblxuICAgICAgICB2YXIgbGVmdEJ0biwgcGVyY2VudEJ0biwgcmlnaHRCdG47XG4gICAgICAgIHZhciBsZWZ0T2ZmRml4ID0gLTE5LFxuICAgICAgICAgIHJpZ2h0T2ZmRml4ID0gNTsgLy/nn6nlvaLlgY/np7tcbiAgICAgICAgdmFyIHJlZHJhd01lbnUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoY29uZmlnLnJlYWRvbmx5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciB0YXNrID0gdGFza0JveC5kYXRhKClbMF07XG4gICAgICAgICAgaWYgKHRhc2sgPT0gbnVsbCB8fCB3aW5kb3cuY29uZmlnLnNlbGVjdElkICE9IHRhc2submFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvL+ebruW9lVxuICAgICAgICAgIGQzLnNlbGVjdCgnLmdyYXBoLWJvZHknKS5zZWxlY3QoJy5tZW51JykucmVtb3ZlKCk7XG4gICAgICAgICAgdmFyIG1lbnUgPSBsaW5lU3ZnLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgXCJtZW51XCIpO1xuICAgICAgICAgIHZhciBwZXJjZW50TGlzdGVuZXIgPSBkMy5iZWhhdmlvci56b29tKCkuY2VudGVyKG51bGwpO1xuICAgICAgICAgIHZhciBzdGFydFRpbWVMaXN0ZW5lciA9IGQzLmJlaGF2aW9yLnpvb20oKS5jZW50ZXIobnVsbCk7XG4gICAgICAgICAgdmFyIGVuZFRpbWVMaXN0ZW5lciA9IGQzLmJlaGF2aW9yLnpvb20oKS5jZW50ZXIobnVsbCk7XG4gICAgICAgICAgdmFyIHggPSBjb25maWcueFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgICB2YXIgdyA9IGNvbmZpZy54U2NhbGUodGFzay5lbmREYXRlKSAtIGNvbmZpZy54U2NhbGUodGFzay5zdGFydERhdGUpO1xuICAgICAgICAgIG1lbnUuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgeCArICcsIDApJyk7XG5cbiAgICAgICAgICAvL+eZvuWIhuavlFxuICAgICAgICAgIHBlcmNlbnRMaXN0ZW5lci5vbignem9vbXN0YXJ0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHRhc2suX3BlcmNlbnQgPSB0YXNrLnBlcmNlbnQgfHwgMDtcbiAgICAgICAgICAgICAgdGFzay5feEN1cnIgPSBkMy5ldmVudC5zb3VyY2VFdmVudC5jbGllbnRYO1xuICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiem9vbXN0YXJ0OlwiICsgdGFzay5feEN1cnIpO1xuICAgICAgICAgICAgfSkub24oXCJ6b29tXCIsXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PVxuICAgICAgICAgICAgICAgICAgJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgY2xpZW50WCA9IGQzLmV2ZW50LnNvdXJjZUV2ZW50LmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gY2xpZW50WCAtIHRhc2suX3hDdXJyO1xuICAgICAgICAgICAgICAgICAgdmFyIHhTY2FsZSA9IGNvbmZpZy54U2NhbGU7XG4gICAgICAgICAgICAgICAgICB2YXIgeE1pbiA9IDA7IC8vXG4gICAgICAgICAgICAgICAgICB2YXIgeE1heCA9IHc7XG4gICAgICAgICAgICAgICAgICB2YXIgeEN1cnIgPSB3ICogdGFzay5fcGVyY2VudCArIG9mZnNldDtcbiAgICAgICAgICAgICAgICAgIHhDdXJyID0gTWF0aC5taW4oeEN1cnIsIHhNYXgpO1xuICAgICAgICAgICAgICAgICAgeEN1cnIgPSBNYXRoLm1heCh4Q3VyciwgeE1pbik7XG4gICAgICAgICAgICAgICAgICB2YXIgX3BlcmNlbnQgPSAoeEN1cnIgLSB4TWluKSAvIHc7XG4gICAgICAgICAgICAgICAgICB0YXNrLnBlcmNlbnQgPSBNYXRoLnJvdW5kKF9wZXJjZW50ICogMTApIC8gMTBcbiAgICAgICAgICAgICAgICAgIHhDdXJyID0geE1pbiArIHcgKiB0YXNrLnBlcmNlbnQ7XG4gICAgICAgICAgICAgICAgICBwZXJjZW50QnRuLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKFwiICsgeEN1cnIgK1xuICAgICAgICAgICAgICAgICAgICBcIiwgMTkpIHJvdGF0ZSgwKVwiKVxuICAgICAgICAgICAgICAgICAgcmVkcmF3VGFzaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcInpvb21lbmRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJlZHJhd01lbnUoKTtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcuY2hhbmdlUGVyY2VudEhhbmRsZXIgPT09XG4gICAgICAgICAgICAgICAgJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5jaGFuZ2VQZXJjZW50SGFuZGxlcih0YXNrQm94LmRhdGEoKVswXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgdmFyIHN0ZXBzID0gMDtcbiAgICAgICAgICBzdGFydFRpbWVMaXN0ZW5lci5vbignem9vbXN0YXJ0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHRhc2suX3N0YXJ0RGF0ZSA9IHRhc2suc3RhcnREYXRlO1xuICAgICAgICAgICAgICB0YXNrLl9lbmREYXRlID0gdGFzay5lbmREYXRlO1xuICAgICAgICAgICAgICB0YXNrLl9zdGVwcyA9IDA7XG4gICAgICAgICAgICAgIHRhc2suX3BlcmNlbnQgPSB0YXNrLnBlcmNlbnQgfHwgMDtcbiAgICAgICAgICAgICAgdGFzay5feEN1cnIgPSBkMy5ldmVudC5zb3VyY2VFdmVudC5jbGllbnRYO1xuICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiem9vbXN0YXJ0OlwiICsgdGFzay5feEN1cnIpO1xuICAgICAgICAgICAgfSkub24oXCJ6b29tXCIsXG4gICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChkMy5ldmVudC5zb3VyY2VFdmVudCAmJiBkMy5ldmVudC5zb3VyY2VFdmVudC50b1N0cmluZygpID09PVxuICAgICAgICAgICAgICAgICAgJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgeFNjYWxlID0gY29uZmlnLnhTY2FsZTtcbiAgICAgICAgICAgICAgICAgIHZhciBjbGllbnRYID0gZDMuZXZlbnQuc291cmNlRXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSBjbGllbnRYIC0gdGFzay5feEN1cnI7XG4gICAgICAgICAgICAgICAgICB2YXIgbWF4RGF0ZSA9IGQzLnRpbWUuZGF5Lm9mZnNldCh0YXNrLl9lbmREYXRlLCAtXG4gICAgICAgICAgICAgICAgICAgIDEpO1xuICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gTWF0aC5taW4ob2Zmc2V0LCAoeFNjYWxlKG1heERhdGUpIC1cbiAgICAgICAgICAgICAgICAgICAgeFNjYWxlKHRhc2suX3N0YXJ0RGF0ZSkpKSArIGxlZnRPZmZGaXg7XG4gICAgICAgICAgICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgIHZhciBkYXlXaWR0aCA9IHhTY2FsZShkMy50aW1lLmRheS5vZmZzZXQobm93LCAxKSkgLVxuICAgICAgICAgICAgICAgICAgICB4U2NhbGUobm93KTtcbiAgICAgICAgICAgICAgICAgIHN0ZXBzID0gTWF0aC5yb3VuZChvZmZzZXQgLyBkYXlXaWR0aCk7XG4gICAgICAgICAgICAgICAgICBvZmZzZXQgPSBzdGVwcyAqIGRheVdpZHRoICsgbGVmdE9mZkZpeDtcbiAgICAgICAgICAgICAgICAgIGxlZnRCdG4uYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoXCIgKyBvZmZzZXQgK1xuICAgICAgICAgICAgICAgICAgICBcIiwgMTMpXCIpXG4gICAgICAgICAgICAgICAgICB0YXNrLnN0YXJ0RGF0ZSA9IGQzLnRpbWUuZGF5Lm9mZnNldCh0YXNrLl9zdGFydERhdGUsIHN0ZXBzKTtcbiAgICAgICAgICAgICAgICAgIHJlZHJhd1Rhc2soKTtcbiAgICAgICAgICAgICAgICAgIHZhciB4MSA9IHBlcmNlbnRYKCk7XG4gICAgICAgICAgICAgICAgICAvLyBwZXJjZW50QnRuLmF0dHIoXCJ4XCIsIHgxKTtcbiAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICB3ID0geFNjYWxlKHRhc2suZW5kRGF0ZSkgLSB4U2NhbGUodGFzay5zdGFydERhdGUpO1xuICAgICAgICAgICAgICAgICAgdmFyIG1hc2tYID0geFNjYWxlKHRhc2suc3RhcnREYXRlKTtcbiAgICAgICAgICAgICAgICAgIGRyYXdNYXNrKG1hc2tYLCB3KTtcbiAgICAgICAgICAgICAgICAgIHZhciBweCA9IG1hc2tYLXhTY2FsZSh0YXNrLl9zdGFydERhdGUpK3cqdGFzay5wZXJjZW50O1xuXG4gICAgICAgICAgICAgICAgICBwZXJjZW50QnRuLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKFwiICsgcHggKyBcIiwgMTkpXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJ6b29tZW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZWRyYXdNZW51KCk7XG4gICAgICAgICAgICAgIGNsZWFyTWFzaygpO1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5jaGFuZ2VTdGFydFRpbWVIYW5kbGVyID09PVxuICAgICAgICAgICAgICAgICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuY2hhbmdlU3RhcnRUaW1lSGFuZGxlcih0YXNrQm94LmRhdGEoKVswXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAvL+e7k+adn+aXtumXtOiwg+aVtOW8gOWni1xuICAgICAgICAgIGVuZFRpbWVMaXN0ZW5lci5vbignem9vbXN0YXJ0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHRhc2suX3N0YXJ0RGF0ZSA9IHRhc2suc3RhcnREYXRlO1xuICAgICAgICAgICAgICB0YXNrLl9lbmREYXRlID0gdGFzay5lbmREYXRlO1xuICAgICAgICAgICAgICB0YXNrLl9zdGVwcyA9IDA7XG4gICAgICAgICAgICAgIHRhc2suX3hDdXJyID0gZDMuZXZlbnQuc291cmNlRXZlbnQuY2xpZW50WDtcbiAgICAgICAgICAgICAgdGFzay5fd2lkdGggPSB4U2NhbGUodGFzay5lbmREYXRlKSAtIHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJ6b29tc3RhcnQ6XCIgKyB0YXNrLl94Q3Vycik7XG4gICAgICAgICAgICB9KS5vbihcInpvb21cIixcbiAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09XG4gICAgICAgICAgICAgICAgICAnW29iamVjdCBNb3VzZUV2ZW50XScpIHtcbiAgICAgICAgICAgICAgICAgIHZhciB4U2NhbGUgPSBjb25maWcueFNjYWxlO1xuICAgICAgICAgICAgICAgICAgdmFyIGNsaWVudFggPSBkMy5ldmVudC5zb3VyY2VFdmVudC5jbGllbnRYO1xuICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IGNsaWVudFggLSB0YXNrLl94Q3VycjtcbiAgICAgICAgICAgICAgICAgIC8v6L+Z5Liq5Lu75Yqh5pyJ5Yeg5aSpXG4gICAgICAgICAgICAgICAgICB2YXIgZGF5cyA9IGQzLnRpbWUuZGF5cyh0YXNrLl9zdGFydERhdGUsIHRhc2suX2VuZERhdGUpO1xuICAgICAgICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICB2YXIgZGF5V2lkdGggPSB4U2NhbGUoZDMudGltZS5kYXkub2Zmc2V0KG5vdywgMSkpIC1cbiAgICAgICAgICAgICAgICAgICAgeFNjYWxlKG5vdyk7XG4gICAgICAgICAgICAgICAgICBzdGVwcyA9IE1hdGgucm91bmQob2Zmc2V0IC8gZGF5V2lkdGgpO1xuICAgICAgICAgICAgICAgICAgc3RlcHMgPSBNYXRoLm1heCgwIC0gZGF5cy5sZW5ndGggKyAxLCBzdGVwcyk7XG4gICAgICAgICAgICAgICAgICB2YXIgeEN1cnIgPSB0YXNrLl93aWR0aCArIHJpZ2h0T2ZmRml4ICsgc3RlcHMgKlxuICAgICAgICAgICAgICAgICAgICBkYXlXaWR0aDtcbiAgICAgICAgICAgICAgICAgIHJpZ2h0QnRuLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHhDdXJyICtcbiAgICAgICAgICAgICAgICAgICAgJywgMTMpJyk7XG4gICAgICAgICAgICAgICAgICB0YXNrLmVuZERhdGUgPSBkMy50aW1lLmRheS5vZmZzZXQodGFzay5fZW5kRGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgc3RlcHMpO1xuICAgICAgICAgICAgICAgICAgcmVkcmF3VGFzaygpO1xuICAgICAgICAgICAgICAgICAgdmFyIHcgPSB4U2NhbGUodGFzay5lbmREYXRlKSAtIHhTY2FsZSh0YXNrLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgICAgICAgICBkcmF3TWFzayh4U2NhbGUodGFzay5zdGFydERhdGUpLCB3KTtcbiAgICAgICAgICAgICAgICAgIHZhciBweCA9IHcgKiB0YXNrLnBlcmNlbnQ7XG5cbiAgICAgICAgICAgICAgICAgIHBlcmNlbnRCdG4uYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoXCIgKyBweCArIFwiLCAxOSlcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcInpvb21lbmRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJlZHJhd01lbnUoKTtcbiAgICAgICAgICAgICAgY2xlYXJNYXNrKCk7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgY29uZmlnLmNoYW5nZUVuZFRpbWVIYW5kbGVyID09PVxuICAgICAgICAgICAgICAgICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuY2hhbmdlRW5kVGltZUhhbmRsZXIodGFza0JveC5kYXRhKClbMF0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8v57uT5p2f5pe26Ze06LCD5pW057uT5p2fXG5cblxuICAgICAgICAgIGxlZnRCdG4gPSBtdUZhY3RvcnkoZDMsIGNvbmZpZywgbWVudSwgJ2xlZnRCdG4nKTtcbiAgICAgICAgICByaWdodEJ0biA9IG11RmFjdG9yeShkMywgY29uZmlnLCBtZW51LCAncmlnaHRCdG4nKTtcbiAgICAgICAgICBwZXJjZW50QnRuID0gbXVGYWN0b3J5KGQzLCBjb25maWcsIG1lbnUsICdwZXJjZW50QnRuJyk7XG4gICAgICAgICAgdmFyIHJpZ2h0WCA9IHcgKyByaWdodE9mZkZpeDtcbiAgICAgICAgICB2YXIgcHggPSAoKHcgKiB0YXNrLnBlcmNlbnQgfHwgMCkpO1xuICAgICAgICAgIGxlZnRCdG4uYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoXCIgKyBsZWZ0T2ZmRml4ICtcbiAgICAgICAgICAgIFwiLCAxMylcIikuY2FsbChzdGFydFRpbWVMaXN0ZW5lcik7XG4gICAgICAgICAgcmlnaHRCdG4uYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoXCIgKyByaWdodFggK1xuICAgICAgICAgICAgXCIsIDEzKVwiKS5jYWxsKGVuZFRpbWVMaXN0ZW5lcik7XG4gICAgICAgICAgcGVyY2VudEJ0bi5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZShcIiArIHB4ICtcbiAgICAgICAgICAgIFwiLCAxOSlcIikuY2FsbChwZXJjZW50TGlzdGVuZXIpO1xuXG4gICAgICAgICAgLy8gcGVyY2VudEJ0bi5vbignbW91c2VvdmVyJywgdG9vbHRpcC5tb3VzZW92ZXIpXG4gICAgICAgICAgLy8gICAub24oJ21vdXNlb3V0JywgdG9vbHRpcC5tb3VzZW91dClcbiAgICAgICAgICAvLyAgIC5vbignbW91c2Vtb3ZlJywgdG9vbHRpcC5tb3VzZW1vdmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBlcmNlbnRYID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHRhc2sgPSB0YXNrQm94LmRhdGEoKVswXTtcbiAgICAgICAgICB2YXIgeCA9IDA7XG4gICAgICAgICAgLy8gLy9jb25zb2xlLmxvZyhsZWZ0QnRuLmF0dHIoJ3gnKSk7XG4gICAgICAgICAgLy8gLy9jb25zb2xlLmxvZyhyaWdodEJ0bi5hdHRyKCd4JykpO1xuICAgICAgICAgIC8vIHZhciBsZWZ0ID0gcGFyc2VGbG9hdChsZWZ0QnRuLmF0dHIoJ3gnKSkgKyAxMDtcbiAgICAgICAgICAvLyB2YXIgcmlnaHQgPSBwYXJzZUZsb2F0KHJpZ2h0QnRuLmF0dHIoJ3gnKSkgLSAxMDtcbiAgICAgICAgICAvLyB4ID0gbGVmdCArIChyaWdodCAtIGxlZnQpICogKHRhc2sucGVyY2VudCB8fCAwKTtcbiAgICAgICAgICAvLyAvL2NvbnNvbGUubG9nKCdsZWZ0PScgKyBsZWZ0ICsgJ1xcdD0nICsgcmlnaHQgKyAnXFx0JyArIHgpO1xuICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLy9jbGlja1xuICAgICAgICB2YXIgY3VyeCwgY3VyeTtcbiAgICAgICAgdmFyIGNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBldmVudCA9IGQzLmV2ZW50O1xuICAgICAgICAgIGlmIChjdXJ4ID09IGV2ZW50LmNsaWVudFggJiYgY3VyeSA9PSBldmVudC5jbGllbnRZKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIGN1cnggPSBldmVudC5jbGllbnRYO1xuICAgICAgICAgIGN1cnkgPSBldmVudC5jbGllbnRZO1xuICAgICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZDMuZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIGQzLmV2ZW50LmNsaWVudFkpO1xuICAgICAgICAgIHZhciB0YXNrQm94ID0gZDMuc2VsZWN0KGVsKTtcbiAgICAgICAgICBpZiAodGFza0JveCkge1xuICAgICAgICAgICAgLy8gcmVkcmF3TWVudSgpO1xuICAgICAgICAgICAgdmFyIHRhc2sgPSB0YXNrQm94LmRhdGEoKVswXTtcbiAgICAgICAgICAgIHdpbmRvdy5jb25maWcuc2VsZWN0SWQgPSB0YXNrLm5hbWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlZHJhd01lbnUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8v55S76KGMXG4gICAgICAgIHZhciByZWRyYXdUYXNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gLy9jb25zb2xlLmxvZygn6YeN55S75Lu75YqhJyk7XG4gICAgICAgICAgbGluZVN2Zy5zZWxlY3RBbGwoJy5pdGVtJykucmVtb3ZlKCk7XG4gICAgICAgICAgdGFza0JveC5lbnRlcigpXG4gICAgICAgICAgICAuaW5zZXJ0KCdnJylcbiAgICAgICAgICAgIC5vbignY2xpY2snLCBjbGlja0hhbmRsZXIpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBjb25maWcuZXZlbnRDb2xvcilcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwiaXRlbVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIGNvbmZpZy54U2NhbGUoZC5zdGFydERhdGUpICtcbiAgICAgICAgICAgICAgICAnLCAxMyknXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIDIwKVxuICAgICAgICAgICAgLmNhbGwodGFzayh7XG4gICAgICAgICAgICAgIHhTY2FsZTogY29uZmlnLnhTY2FsZSxcbiAgICAgICAgICAgICAgZXZlbnRDb2xvcjogY29uZmlnLmV2ZW50Q29sb3JcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHRhc2tCb3gub24oJ21vdXNlb3ZlcicsIHRvb2x0aXAubW91c2VvdmVyKVxuICAgICAgICAgICAgLm9uKCdtb3VzZW91dCcsIHRvb2x0aXAubW91c2VvdXQpXG4gICAgICAgICAgICAub24oJ21vdXNlbW92ZScsIHRvb2x0aXAubW91c2Vtb3ZlKTtcbiAgICAgICAgICBpZiAoIWNvbmZpZy5yZWFkb25seSkge1xuICAgICAgICAgICAgdGFza0JveC5jYWxsKG1vdmVMaXN0ZW5lcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRhc2tCb3guZXhpdCgpLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJlZHJhd1Rhc2soKTtcblxuICAgICAgICAvL+eCueWHu+S7u+WKoeWQjuaYvuekuuS7u+WKoeeahOiwg+aVtOaooeW8j1xuICAgICAgICByZWRyYXdNZW51KCk7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgICAgICB2YXIgZHJhd01hc2sgPSBmdW5jdGlvbih4LCB3KSB7XG4gICAgICAgICAgdmFyIGJveCA9IGQzLnNlbGVjdCgnI2NvbnRhaW5lci1ib3gnKTtcbiAgICAgICAgICBib3guc2VsZWN0KCcubGxpbmUnKS5yZW1vdmUoKTtcbiAgICAgICAgICB2YXIgZyA9IGJveC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLy8gLmF0dHIoJ29wYWNpdHknLCAnMC40JylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdsbGluZScpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgeCArICcsIDApJyk7XG4gICAgICAgICAgZy5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgXCIjMGNjXCIpXG4gICAgICAgICAgICAuYXR0cignb3BhY2l0eScsICcwLjEnKVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGNvbmZpZy5ncmFwaEhlaWdodClcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIHcpXG5cbiAgICAgICAgICBnLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgICAuYXR0cigneDEnLCAwKVxuICAgICAgICAgICAgLmF0dHIoJ3kxJywgY29uZmlnLm1hcmdpbi50b3AgLSA0MClcbiAgICAgICAgICAgIC5hdHRyKCd4MicsIDApXG4gICAgICAgICAgICAuYXR0cigneTInLCBjb25maWcuZ3JhcGhIZWlnaHQgKyA0MCk7XG5cbiAgICAgICAgICBnLmFwcGVuZCgnbGluZScpXG4gICAgICAgICAgICAuYXR0cigneDEnLCB3KVxuICAgICAgICAgICAgLmF0dHIoJ3kxJywgY29uZmlnLm1hcmdpbi50b3AgLSA0MClcbiAgICAgICAgICAgIC5hdHRyKCd4MicsIHcpXG4gICAgICAgICAgICAuYXR0cigneTInLCBjb25maWcuZ3JhcGhIZWlnaHQgKyA0MCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2xlYXJNYXNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGJveCA9IGQzLnNlbGVjdCgnI2NvbnRhaW5lci1ib3gnKTtcbiAgICAgICAgICBib3guc2VsZWN0KCcubGxpbmUnKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWkhOeQhuS7u+WKoeW3puWPs+enu+WKqOeahOmXrumimFxuICAgICAgICB2YXIgdHJhbnNmb3JtTW92ZUJlZm9yZSA9ICcnO1xuICAgICAgICBtb3ZlTGlzdGVuZXJcbiAgICAgICAgICAub24oJ3pvb21zdGFydCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdHJhbnNmb3JtTW92ZUJlZm9yZSA9IHRhc2tCb3guYXR0cigndHJhbnNmb3JtJyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAub24oXCJ6b29tXCIsXG4gICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKGQzLmV2ZW50LnNvdXJjZUV2ZW50ICYmIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnRvU3RyaW5nKCkgPT09XG4gICAgICAgICAgICAgICAgJ1tvYmplY3QgTW91c2VFdmVudF0nKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChkMy5ldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgICAgZDMuZXZlbnQuY2xpZW50WSk7XG4gICAgICAgICAgICAgICAgdmFyIHggPSAwLFxuICAgICAgICAgICAgICAgICAgdyA9IDA7XG4gICAgICAgICAgICAgICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgICAgICAgICAgICAgdGFza0JveC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgeFNjYWxlID0gY29uZmlnLnhTY2FsZTtcbiAgICAgICAgICAgICAgICAgIHcgPSB4U2NhbGUoZC5lbmREYXRlKSAtIHhTY2FsZShkLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgICAgICAgICB4ID0geFNjYWxlKGQuc3RhcnREYXRlKSArIGQzLmV2ZW50LnRyYW5zbGF0ZVtcbiAgICAgICAgICAgICAgICAgICAgMF07IC8v56e75Yqo5ZCO55qE6Led56a7XG4gICAgICAgICAgICAgICAgICB2YXIgZGF0ZVRpbWUgPSB4U2NhbGUuaW52ZXJ0KHgpOyAvL+i9rOaNouaIkOaWsOeahOaXtumXtFxuICAgICAgICAgICAgICAgICAgdmFyIGRhdGUgPSBkMy50aW1lLmRheShkYXRlVGltZSk7IC8v5a+55pe26Ze06L+b6KGM5Y+W5pW0XG4gICAgICAgICAgICAgICAgICB4ID0geFNjYWxlKGRhdGUpOyAvL+aXtumXtOWPluaVtOWQjueahOi3neemu1xuICAgICAgICAgICAgICAgICAgZC5zdGFydERhdGUgPSBkYXRlO1xuICAgICAgICAgICAgICAgICAgZC5lbmREYXRlID0geFNjYWxlLmludmVydCh4ICsgdyk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsIDEzKSc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmVkcmF3TWVudSgpO1xuICAgICAgICAgICAgICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICAgICAgICAgIGRyYXdNYXNrKHgsIHcpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgLm9uKFwiem9vbWVuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBib3ggPSBkMy5zZWxlY3QoJyNjb250YWluZXItYm94Jyk7XG4gICAgICAgICAgICBib3guc2VsZWN0KCcubGxpbmUnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIGlmKHRyYW5zZm9ybU1vdmVCZWZvcmUhPXRhc2tCb3guYXR0cigndHJhbnNmb3JtJykpe1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy5jaGFuZ2VUaW1lSGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5jaGFuZ2VUaW1lSGFuZGxlcih0YXNrQm94LmRhdGEoKVswXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgY29uZmlndXJhYmxlKGV2ZW50TGluZSwgY29uZmlnKTtcbiAgICByZXR1cm4gZXZlbnRMaW5lO1xuICB9O1xufTsiLCJcInVzZSBzdHJpY3RcIjtcbi8qIGdsb2JhbCBtb2R1bGUgKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmaWx0ZXJEYXRlKGRhdGEsIHhTY2FsZSwgeVNjYWxlLCB5TWluLCB5TWF4LFxuICBmdWxsUmVkcmF3KSB7XG4gIGRhdGEgPSBkYXRhIHx8IFtdO1xuICB2YXIgZmlsdGVyZWREYXRhID0gW107XG4gIHZhciBib3VuZGFyeSA9IHhTY2FsZS5yYW5nZSgpO1xuICB2YXIgbWluID0gYm91bmRhcnlbMF07XG4gIHZhciBtYXggPSBib3VuZGFyeVsxXTtcbiAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGRhdHVtKSB7XG4gICAgdmFyIHN0YXJ0ID0geFNjYWxlKGRhdHVtLnN0YXJ0RGF0ZSk7XG4gICAgdmFyIGVuZCA9IHhTY2FsZShkYXR1bS5lbmREYXRlKTtcbiAgICB2YXIgeSA9IHlTY2FsZShkYXR1bS51dWlkKTtcbiAgICBpZiAoZW5kIDwgbWluIHx8IHN0YXJ0ID4gbWF4KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghZnVsbFJlZHJhdyAmJiAoeSA8IHlNaW4gfHwgeSA+IHlNYXgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZpbHRlcmVkRGF0YS5wdXNoKGRhdHVtKTtcbiAgfSk7XG4gIHJldHVybiBmaWx0ZXJlZERhdGE7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgbW9kdWxlICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZmlsdGVyRGF0ZShkYXRhLCBzY2FsZSwgbGl0ZSkge1xuICBkYXRhID0gZGF0YSB8fCBbXTtcbiAgdmFyIGZpbHRlcmVkRGF0YSA9IFtdO1xuICB2YXIgb2Zmc2V0ID0gJCgnI3Njcm9sbGVyJykub2Zmc2V0KCkudG9wO1xuICB2YXIgeU1pbiA9IDAgLSBvZmZzZXQ7XG4gIHZhciB5TWF4ID0gMCAtIG9mZnNldCArICQoJyN3cmFwcGVyJykuaGVpZ2h0KCk7XG4gIHZhciBjb3VudCA9IDA7XG4gIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgLy8gaWYgKGxpdGUpIHtcbiAgICAvLyAgIHZhciBuYW1lID0gZC5uYW1lO1xuICAgIC8vICAgdmFyIHkgPSBzY2FsZShuYW1lKTtcbiAgICAvLyAgIC8vY29uc29sZS5sb2coW3ksIHlNaW4sIHlNYXhdLmpvaW4oJywnKSlcbiAgICAvLyAgIHZhciBfZCA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkKTtcbiAgICAvLyAgIGlmICh5IDwgeU1pbiB8fCB5ID4geU1heCkge1xuICAgIC8vICAgICBfZC50YXNrcy5sZW5ndGggPSAwO1xuICAgIC8vICAgfSBlbHNlIHtcbiAgICAvLyAgICAgY291bnQrKztcbiAgICAvLyAgIH1cbiAgICAvLyAgIGZpbHRlcmVkRGF0YS5wdXNoKF9kKTtcbiAgICAvLyB9IGVsc2Uge1xuICAgIGZpbHRlcmVkRGF0YS5wdXNoKGQpO1xuICAgIC8vIH1cbiAgfSk7XG4gIC8vY29uc29sZS5sb2coJ2NvdW50PT09JyArIGNvdW50KTtcblxuICByZXR1cm4gZmlsdGVyZWREYXRhO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIHJlcXVpcmUsIG1vZHVsZSwgZDMgKi9cblxudmFyIGNvbmZpZ3VyYWJsZSA9IHJlcXVpcmUoJy4vdXRpbC9jb25maWd1cmFibGUnKTtcbnZhciBmaWx0ZXJEYXRhID0gcmVxdWlyZSgnLi9maWx0ZXJEYXRhJyk7XG5cbnZhciBkZWZhdWx0Q29uZmlnID0ge1xuICB4U2NhbGU6IG51bGxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZDMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbmZpZykge1xuXG4gICAgY29uZmlnID0gY29uZmlnIHx8IHtcbiAgICAgIHhTY2FsZTogbnVsbCxcbiAgICAgIHlTY2FsZTogbnVsbFxuICAgIH07XG4gICAgZm9yICh2YXIga2V5IGluIGRlZmF1bHRDb25maWcpIHtcbiAgICAgIGNvbmZpZ1trZXldID0gY29uZmlnW2tleV0gfHwgZGVmYXVsdENvbmZpZ1trZXldO1xuICAgIH1cbiAgICB2YXIgeFNjYWxlID0gY29uZmlnLnhTY2FsZTtcbiAgICB2YXIgbGVmdEJ0biA9IGZ1bmN0aW9uIGxlZnRCdG4oc2VsZWN0aW9uKSB7XG4gICAgICBzZWxlY3Rpb24uZWFjaChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zZWxlY3RBbGwoJy5sZWZ0QnRuJykucmVtb3ZlKCk7XG4gICAgICAgIHZhciBsZWZ0TGluZSA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZSgtMTksIDEzKVwiKVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdidG4gbGVmdEJ0bicpO1xuICAgICAgICBsZWZ0TGluZS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAgIC5hdHRyKCdkJyxcbiAgICAgICAgICAgICdNIDAgMCBMIDExIDAgcSAtMiAyIC0yIDcgTCAxMSAxMSBMICAwIDExIHonKVxuICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCAnIzg4OCcpXG4gICAgICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsICcxJylcbiAgICAgICAgICAuYXR0cignZmlsbCcsICcjMWY5NmQ4JylcbiAgICAgICAgbGVmdExpbmUuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgICAuYXR0cigneDEnLCAnMycpXG4gICAgICAgICAgLmF0dHIoJ3kxJywgJzInKVxuICAgICAgICAgIC5hdHRyKCd4MicsICczJylcbiAgICAgICAgICAuYXR0cigneTInLCAnOScpXG4gICAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgICAgICBsZWZ0TGluZS5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgIC5hdHRyKCd4MScsICc2JylcbiAgICAgICAgICAuYXR0cigneTEnLCAnMicpXG4gICAgICAgICAgLmF0dHIoJ3gyJywgJzYnKVxuICAgICAgICAgIC5hdHRyKCd5MicsICc5JylcbiAgICAgICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uZmlndXJhYmxlKGxlZnRCdG4sIGNvbmZpZyk7XG5cbiAgICByZXR1cm4gbGVmdEJ0bjtcbiAgfTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGFwcCA9IHJlcXVpcmUoJy4vYXBwJyk7XG5cbmlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICBkZWZpbmUoJ2QzLmNoYXJ0LmFwcCcsIFtcImQzXCJdLCBmdW5jdGlvbihkMykge1xuICAgIGQzLmNoYXJ0ID0gZDMuY2hhcnQgfHwge307XG4gICAgZDMuY2hhcnQuYXBwID0gYXBwKGQzKTtcbiAgfSk7XG59IGVsc2UgaWYgKHdpbmRvdykge1xuICB3aW5kb3cuZDMuY2hhcnQgPSB3aW5kb3cuZDMuY2hhcnQgfHwge307XG4gIHdpbmRvdy5kMy5jaGFydC5hcHAgPSBhcHAod2luZG93LmQzKTtcbn0gZWxzZSB7XG4gIG1vZHVsZS5leHBvcnRzID0gYXBwO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkMywgY29uZmlnLCBncmFwaCwgd2hlcmUpIHtcblxuXG4gIHZhciBpdGVtcyA9IHt9O1xuXG4gIHZhciBidWlsZExlZnQgPSBmdW5jdGlvbigpIHtcbiAgICBpdGVtc1snbGVmdEJ0biddID0gZ3JhcGguc2VsZWN0QWxsKCcubGVmdEJ0bicpLnJlbW92ZSgpO1xuICAgIHZhciBsZWZ0TGluZSA9IGdyYXBoXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZSgwLCAxMylcIilcbiAgICAgIC5hdHRyKCdjbGFzcycsICdidG4gbGVmdEJ0bicpO1xuICAgIGxlZnRMaW5lLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignZCcsXG4gICAgICAgICdNIDAgMCBMIDExIDAgcSAtMiAyIC0yIDcgTCAxMSAxMSBMICAwIDExIHonKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsICcjODg4JylcbiAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAnMScpXG4gICAgICAuYXR0cignZmlsbCcsICcjMWY5NmQ4JylcbiAgICBsZWZ0TGluZS5hcHBlbmQoJ2xpbmUnKVxuICAgICAgLmF0dHIoJ3gxJywgJzMnKVxuICAgICAgLmF0dHIoJ3kxJywgJzInKVxuICAgICAgLmF0dHIoJ3gyJywgJzMnKVxuICAgICAgLmF0dHIoJ3kyJywgJzknKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgIGxlZnRMaW5lLmFwcGVuZCgnbGluZScpXG4gICAgICAuYXR0cigneDEnLCAnNicpXG4gICAgICAuYXR0cigneTEnLCAnMicpXG4gICAgICAuYXR0cigneDInLCAnNicpXG4gICAgICAuYXR0cigneTInLCAnOScpXG4gICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgcmV0dXJuIGxlZnRMaW5lO1xuICB9XG5cblxuICB2YXIgYnVpbGRSaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgIGl0ZW1zWydyaWdodEJ0biddID0gZ3JhcGguc2VsZWN0QWxsKCcucmlnaHRCdG4nKS5yZW1vdmUoKTtcbiAgICB2YXIgcmlnaHRCdG4gPSBncmFwaFxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgXCJ0cmFuc2xhdGUoMCwgMTMpXCIpXG4gICAgICAuYXR0cignY2xhc3MnLCAnYnRuIHJpZ2h0QnRuJyk7XG4gICAgcmlnaHRCdG4uYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdkJyxcbiAgICAgICAgJ00gMCAwICBxIDIgMiAyIDggIEwgIDAgMTEgIEwgMTEgMTEgTCAxMSAwIHonKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsICcjODg4JylcbiAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAnMScpXG4gICAgICAuYXR0cignZmlsbCcsICcjMWY5NmQ4JylcbiAgICByaWdodEJ0bi5hcHBlbmQoJ2xpbmUnKVxuICAgICAgLmF0dHIoJ3gxJywgJzUnKVxuICAgICAgLmF0dHIoJ3kxJywgJzInKVxuICAgICAgLmF0dHIoJ3gyJywgJzUnKVxuICAgICAgLmF0dHIoJ3kyJywgJzknKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgIHJpZ2h0QnRuLmFwcGVuZCgnbGluZScpXG4gICAgICAuYXR0cigneDEnLCAnOCcpXG4gICAgICAuYXR0cigneTEnLCAnMicpXG4gICAgICAuYXR0cigneDInLCAnOCcpXG4gICAgICAuYXR0cigneTInLCAnOScpXG4gICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgcmV0dXJuIHJpZ2h0QnRuO1xuICB9XG5cbiAgdmFyIGJ1aWxkUGVyY2VudCA9IGZ1bmN0aW9uKCkge1xuICAgIGl0ZW1zWydwZXJjZW50QnRuJ10gPSBncmFwaC5zZWxlY3RBbGwoJy5wZXJjZW50QnRuJykucmVtb3ZlKCk7XG4gICAgdmFyIHBlcmNlbnRCdG4gPSBncmFwaFxuICAgICAgLmFwcGVuZCgncG9seWxpbmUnKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsIFwiI2EwYTBhMFwiKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgXCJwZXJjZW50QnRuXCIpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCAxOCknKVxuICAgICAgLmF0dHIoJ3BvaW50cycsICcwLDAgNiw3IDYsMTMsIC02LDEzIC02LDcgMCwwJylcbiAgICAgIC5hdHRyKCdzdHlsZScsICdmaWxsOndoaXRlO3N0cm9rZS13aWR0aDoxJylcbiAgICByZXR1cm4gcGVyY2VudEJ0bjtcbiAgfVxuXG4gIHZhciBkcmF3WEF4aXMgPSBmdW5jdGlvbiBkcmF3WEF4aXMoKSB7XG4gICAgLy8gLy9jb25zb2xlLmxvZygnd2hlcmU9PT0nICsgd2hlcmUpO1xuICAgIHN3aXRjaCAod2hlcmUpIHtcbiAgICAgIGNhc2UgJ2xlZnRCdG4nOlxuICAgICAgICByZXR1cm4gYnVpbGRMZWZ0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncmlnaHRCdG4nOlxuICAgICAgICByZXR1cm4gYnVpbGRSaWdodCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3BlcmNlbnRCdG4nOlxuICAgICAgICByZXR1cm4gYnVpbGRQZXJjZW50KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcblxuICAgIH1cbiAgfTtcblxuICByZXR1cm4gZHJhd1hBeGlzKCk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vKiBnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBkMyAqL1xuXG52YXIgY29uZmlndXJhYmxlID0gcmVxdWlyZSgnLi91dGlsL2NvbmZpZ3VyYWJsZScpO1xudmFyIGZpbHRlckRhdGEgPSByZXF1aXJlKCcuL2ZpbHRlckRhdGEnKTtcblxudmFyIGRlZmF1bHRDb25maWcgPSB7XG4gIHhTY2FsZTogbnVsbFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkMykge1xuICByZXR1cm4gZnVuY3Rpb24oY29uZmlnKSB7XG5cbiAgICBjb25maWcgPSBjb25maWcgfHwge1xuICAgICAgeFNjYWxlOiBudWxsLFxuICAgICAgeVNjYWxlOiBudWxsXG4gICAgfTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdENvbmZpZykge1xuICAgICAgY29uZmlnW2tleV0gPSBjb25maWdba2V5XSB8fCBkZWZhdWx0Q29uZmlnW2tleV07XG4gICAgfVxuICAgIHZhciB4U2NhbGUgPSBjb25maWcueFNjYWxlO1xuICAgIHZhciByaWdodEJ0biA9IGZ1bmN0aW9uIHJpZ2h0QnRuKHNlbGVjdGlvbikge1xuICAgICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCcucmlnaHRCdG4nKS5yZW1vdmUoKTtcbiAgICAgICAgdmFyIGxlZnRMaW5lID0gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKC0xOSwgMTMpXCIpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2J0biByaWdodEJ0bicpO1xuICAgICAgICBsZWZ0TGluZS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAgIC5hdHRyKCdkJyxcbiAgICAgICAgICAgICdNIDAgMCBMIDExIDAgcSAtMiAyIC0yIDcgTCAxMSAxMSBMICAwIDExIHonKVxuICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCAnIzg4OCcpXG4gICAgICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsICcxJylcbiAgICAgICAgICAuYXR0cignZmlsbCcsICcjMWY5NmQ4JylcbiAgICAgICAgbGVmdExpbmUuYXBwZW5kKCdsaW5lJylcbiAgICAgICAgICAuYXR0cigneDEnLCAnMycpXG4gICAgICAgICAgLmF0dHIoJ3kxJywgJzInKVxuICAgICAgICAgIC5hdHRyKCd4MicsICczJylcbiAgICAgICAgICAuYXR0cigneTInLCAnOScpXG4gICAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgICAgICBsZWZ0TGluZS5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAgIC5hdHRyKCd4MScsICc2JylcbiAgICAgICAgICAuYXR0cigneTEnLCAnMicpXG4gICAgICAgICAgLmF0dHIoJ3gyJywgJzYnKVxuICAgICAgICAgIC5hdHRyKCd5MicsICc5JylcbiAgICAgICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uZmlndXJhYmxlKHJpZ2h0QnRuLCBjb25maWcpO1xuXG4gICAgcmV0dXJuIHJpZ2h0QnRuO1xuICB9O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuLyogZ2xvYmFsIHJlcXVpcmUsIG1vZHVsZSwgZDMgKi9cblxudmFyIGNvbmZpZ3VyYWJsZSA9IHJlcXVpcmUoJy4vdXRpbC9jb25maWd1cmFibGUnKTtcbnZhciBmaWx0ZXJEYXRhID0gcmVxdWlyZSgnLi9maWx0ZXJEYXRhJyk7XG5cbnZhciBkZWZhdWx0Q29uZmlnID0ge1xuICB4U2NhbGU6IG51bGxcbn07XG5cbnZhciBmb3JtYXRlciA9IGQzLnRpbWUuZm9ybWF0KFwiJVktJW0tJWQgJUg6JU06JVNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkMykge1xuICByZXR1cm4gZnVuY3Rpb24oY29uZmlnKSB7XG5cbiAgICBjb25maWcgPSBjb25maWcgfHwge1xuICAgICAgeFNjYWxlOiBudWxsLFxuICAgICAgeVNjYWxlOiBudWxsXG4gICAgfTtcbiAgICBmb3IgKHZhciBrZXkgaW4gZGVmYXVsdENvbmZpZykge1xuICAgICAgY29uZmlnW2tleV0gPSBjb25maWdba2V5XSB8fCBkZWZhdWx0Q29uZmlnW2tleV07XG4gICAgfVxuICAgIHZhciB4U2NhbGUgPSBjb25maWcueFNjYWxlO1xuICAgIHZhciB0YXNrID0gZnVuY3Rpb24gdGFzayhzZWxlY3Rpb24pIHtcbiAgICAgIHNlbGVjdGlvbi5lYWNoKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgLy8gLy9jb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgLy8gLy9jb25zb2xlLmxvZygn55S75Lu75YqhJyk7XG4gICAgICAgIC8vIOefqeW9ouaYvuekuuaWueahiFxuICAgICAgICB2YXIgY29udGFpbmVyID0gZDMuc2VsZWN0KHRoaXMpO1xuICAgICAgICBjb250YWluZXIuc2VsZWN0QWxsKCcudGFzaycpLnJlbW92ZSgpO1xuXG4gICAgICAgIHZhciBzaG93VGFzayA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgdmFyIGZpbGxDb2xvciA9IFwiIzBjY1wiO1xuICAgICAgICAgIGlmIChkYXRhLmVuZERhdGUgPCBuZXcgRGF0ZSgpKSB7XG4gICAgICAgICAgICBmaWxsQ29sb3IgPSAncmVkJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgYmFja2dyb3VuZCA9IGNvbnRhaW5lci5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgXCJ0cmFuc3BhcmVudFwiKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgXCJ0YXNrIGJhY2tncm91bmRcIilcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCAxMClcbiAgICAgICAgICAgIC8vIC5hdHRyKCdyeCcsIDQpXG4gICAgICAgICAgICAvLyAuYXR0cigncnknLCA0KVxuICAgICAgICAgICAgLmF0dHIoJ3N0cm9rZScsIFwiI2EwYTBhMFwiKVxuICAgICAgICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsIDEpXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgLy8gLy9jb25zb2xlLmxvZyhkYXRhLmVuZERhdGUgKyAnXFx0JyArIGRhdGEuc3RhcnREYXRlICtcbiAgICAgICAgICAgICAgLy8gICAnXFx0JyArICh4U2NhbGUoZGF0YS5lbmREYXRlKSAtIHhTY2FsZShkYXRhLnN0YXJ0RGF0ZSkpXG4gICAgICAgICAgICAgIC8vICk7XG4gICAgICAgICAgICAgIHJldHVybiAoeFNjYWxlKGRhdGEuZW5kRGF0ZSkgLSB4U2NhbGUoZGF0YS5zdGFydERhdGUpKVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICB2YXIgcHJlID0gY29udGFpbmVyLmFwcGVuZCgncmVjdCcpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBcIiM2ZGYzZDJcIilcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCBcIiNhMGEwYTBcIilcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwidGFzayBwcmVcIilcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZSgwLCAwLjUpXCIpXG4gICAgICAgICAgICAvLyAuYXR0cigncngnLCA0KVxuICAgICAgICAgICAgLy8gLmF0dHIoJ3J5JywgNClcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCAxMClcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gKGNvbmZpZy54U2NhbGUoZGF0YS5lbmREYXRlKSAtIGNvbmZpZy54U2NhbGUoXG4gICAgICAgICAgICAgICAgZGF0YS5zdGFydERhdGUpKSAqIGRhdGEucGVyY2VudCB8fCAwO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgc2hvd1BhY2thZ2UgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgIHZhciBmaWxsQ29sb3IgPSBcIiMwY2NcIjtcbiAgICAgICAgICBpZiAoZGF0YS5lbmREYXRlIDwgbmV3IERhdGUoKSkge1xuICAgICAgICAgICAgZmlsbENvbG9yID0gJ3JlZCc7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHcgPSB4U2NhbGUoZGF0YS5lbmREYXRlKSAtIHhTY2FsZShkYXRhLnN0YXJ0RGF0ZSk7XG4gICAgICAgICAgdmFyIHB3ID0gdyAqIGRhdGEucGVyY2VudCB8fCAwO1xuICAgICAgICAgIHZhciBiYWNrZ3JvdW5kID0gY29udGFpbmVyLmFwcGVuZCgncG9seWxpbmUnKVxuICAgICAgICAgICAgLmF0dHIoJ3N0cm9rZScsIFwiI2EwYTBhMFwiKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgXCJ0YXNrIHByZVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIFwidHJhbnNsYXRlKDAsIDAuNSlcIilcbiAgICAgICAgICAgIC5hdHRyKCdwb2ludHMnLCAnMCwwICcgKyB3ICsgJywwICcgKyB3ICsgJywxMCAnICsgKHcgLVxuICAgICAgICAgICAgICA1KSArICcsNyA1LDcgMCwxMCAwLDAnKVxuICAgICAgICAgICAgLmF0dHIoJ3N0eWxlJywgJ2ZpbGw6d2hpdGU7c3Ryb2tlLXdpZHRoOjEnKTtcblxuXG4gICAgICAgICAgdmFyIHByZSA9IGNvbnRhaW5lci5hcHBlbmQoJ3BvbHlsaW5lJylcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCBcIiNhMGEwYTBcIilcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsIFwidGFzayBwcmVcIilcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBcInRyYW5zbGF0ZSgwLCAwLjUpXCIpXG4gICAgICAgICAgICAuYXR0cignc3R5bGUnLCAnZmlsbDojRkY5NTNCO3N0cm9rZS13aWR0aDoxJyk7XG5cbiAgICAgICAgICBpZiAocHcgPCA1KSB7XG4gICAgICAgICAgICBwcmUuYXR0cigncG9pbnRzJywgJzAsMCAnICsgcHcgKyAnLDAgJyArIHB3ICtcbiAgICAgICAgICAgICAgJyw3ICcgKyBwdyArICcsNyAwLDEwIDAsMCcpO1xuICAgICAgICAgIH0gZWxzZSBpZiAocHcgPj0gNSAmJiBwdyA8ICh3IC0gNSkpIHtcbiAgICAgICAgICAgIHByZS5hdHRyKCdwb2ludHMnLCAnMCwwICcgKyBwdyArICcsMCAnICsgcHcgK1xuICAgICAgICAgICAgICAnLDcgNSw3IDAsMTAgMCwwJyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChwdyA+PSAodyAtIDUpKSB7XG4gICAgICAgICAgICBwcmUuYXR0cigncG9pbnRzJywgJzAsMCAnICsgcHcgKyAnLDAgJyArIHB3ICtcbiAgICAgICAgICAgICAgJyw3ICcgKyAodyAtIDUpICsgJyw3IDUsNyAwLDEwIDAsMCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoZGF0YS5wYWNrYWdlKSB7XG4gICAgICAgICAgc2hvd1BhY2thZ2UoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzaG93VGFzaygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uZmlndXJhYmxlKHRhc2ssIGNvbmZpZyk7XG5cbiAgICByZXR1cm4gdGFzaztcbiAgfTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNvbmZpZ3VyYWJsZSh0YXJnZXRGdW5jdGlvbiwgY29uZmlnLCBsaXN0ZW5lcnMpIHtcbiAgbGlzdGVuZXJzID0gbGlzdGVuZXJzIHx8IHt9O1xuICBmb3IgKHZhciBpdGVtIGluIGNvbmZpZykge1xuICAgIChmdW5jdGlvbihpdGVtKSB7XG4gICAgICB0YXJnZXRGdW5jdGlvbltpdGVtXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGNvbmZpZ1tpdGVtXTtcbiAgICAgICAgY29uZmlnW2l0ZW1dID0gdmFsdWU7XG4gICAgICAgIGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoaXRlbSkpIHtcbiAgICAgICAgICBsaXN0ZW5lcnNbaXRlbV0odmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0YXJnZXRGdW5jdGlvbjtcbiAgICAgIH07XG4gICAgfSkoaXRlbSk7IC8vIGZvciBkb2Vzbid0IGNyZWF0ZSBhIGNsb3N1cmUsIGZvcmNpbmcgaXRcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZDMsIGNvbmZpZywgeFNjYWxlLCBncmFwaCwgZ3JhcGhIZWlnaHQsIHdoZXJlKSB7XG4gIHZhciB4QXhpcyA9IHt9O1xuICB2YXIgeEF4aXNFbHMgPSB7fTtcbiAgdmFyIGZvcm1hdGVyID0gZDMudGltZS5mb3JtYXQoXCIlWS0lbS0lZCAlSDolTTolU1wiKVxuXG4gIHZhciB0aWNrRm9ybWF0RGF0YSA9IFtdO1xuXG4gIGNvbmZpZy50aWNrRm9ybWF0LmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgIHZhciB0aWNrID0gaXRlbS5zbGljZSgwKTtcbiAgICB0aWNrRm9ybWF0RGF0YS5wdXNoKHRpY2spO1xuICB9KTtcblxuICB2YXIgdGlja0Zvcm1hdCA9IGNvbmZpZy5sb2NhbGUgPyBjb25maWcubG9jYWxlLnRpbWVGb3JtYXQubXVsdGkoXG4gICAgdGlja0Zvcm1hdERhdGEpIDogZDMudGltZS5mb3JtYXQubXVsdGkodGlja0Zvcm1hdERhdGEpO1xuXG4gIHhBeGlzW3doZXJlXSA9IGQzLnN2Zy5heGlzKClcbiAgICAuc2NhbGUoeFNjYWxlKVxuICAgIC5vcmllbnQod2hlcmUpXG4gICAgLnRpY2tzKGNvbmZpZy5zdGVwKVxuICAgIC50aWNrRm9ybWF0KHRpY2tGb3JtYXQpO1xuXG4gIHZhciBsaW5lWSA9ICh3aGVyZSA9PSAnYm90dG9tJykgPyAwIDogY29uZmlnLm1hcmdpbi50b3AgLSAyO1xuXG4gIHZhciBnZXRNb250aFdlZWsgPSBmdW5jdGlvbihhLCBiLCBjKSB7XG4gICAgLypcbiAgICBhID0gZCA9IOW9k+WJjeaXpeacn1xuICAgIGIgPSA2IC0gdyA9IOW9k+WJjeWRqOeahOi/mOacieWHoOWkqei/h+WujO+8iOS4jeeul+S7iuWkqe+8iVxuICAgIGEgKyBiIOeahOWSjOWcqOmZpOS7pTcg5bCx5piv5b2T5aSp5piv5b2T5YmN5pyI5Lu955qE56ys5Yeg5ZGoXG4gICAgKi9cbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKGEsIHBhcnNlSW50KGIpIC0gMSwgYyksXG4gICAgICB3ID0gZGF0ZS5nZXREYXkoKSxcbiAgICAgIGQgPSBkYXRlLmdldERhdGUoKTtcbiAgICByZXR1cm4gTWF0aC5jZWlsKFxuICAgICAgKGQgKyA2IC0gdykgLyA3XG4gICAgKTtcbiAgfTtcblxuICB2YXIgZ2V0WWVhcldlZWsgPSBmdW5jdGlvbihhLCBiLCBjKSB7XG4gICAgLypcbiAgICBkYXRlMeaYr+W9k+WJjeaXpeacn1xuICAgIGRhdGUy5piv5b2T5bm056ys5LiA5aSpXG4gICAgZOaYr+W9k+WJjeaXpeacn+aYr+S7iuW5tOesrOWkmuWwkeWkqVxuICAgIOeUqGQgKyDlvZPliY3lubTnmoTnrKzkuIDlpKnnmoTlkajlt67ot53nmoTlkozlnKjpmaTku6U35bCx5piv5pys5bm056ys5Yeg5ZGoXG4gICAgKi9cbiAgICB2YXIgZGF0ZTEgPSBuZXcgRGF0ZShhLCBwYXJzZUludChiKSAtIDEsIGMpLFxuICAgICAgZGF0ZTIgPSBuZXcgRGF0ZShhLCAwLCAxKSxcbiAgICAgIGQgPSBNYXRoLnJvdW5kKChkYXRlMS52YWx1ZU9mKCkgLSBkYXRlMi52YWx1ZU9mKCkpIC8gODY0MDAwMDApO1xuICAgIHJldHVybiBNYXRoLmNlaWwoXG4gICAgICAoZCArICgoZGF0ZTIuZ2V0RGF5KCkgKyAxKSAtIDEpKSAvIDdcbiAgICApO1xuICB9O1xuXG5cblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHZhciBkcmF3WWVhciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGFydCA9IGQzLnRpbWUueWVhci5vZmZzZXQoc2NhbGVbMF0sIC01KTtcbiAgICB2YXIgZW5kID0gZDMudGltZS55ZWFyLm9mZnNldChzY2FsZVsxXSwgNSk7XG4gICAgdmFyIG1vbnRocyA9IGQzLnRpbWUueWVhcnMoc3RhcnQsIGVuZCk7XG5cbiAgICB2YXIgeEF4aXNNb250aEJveCA9IG51bGwsXG4gICAgICBtb250aFdpZHRoID0gMDtcbiAgICB4QXhpc01vbnRoQm94ID0gbWFpbkJveC5zZWxlY3RBbGwoJ2cnKS5kYXRhKG1vbnRocyk7XG5cbiAgICB2YXIgbyA9IHhBeGlzTW9udGhCb3guZW50ZXIoKVxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgKHhTY2FsZShkKSkgKyAnLDApJztcbiAgICAgIH0pXG5cbiAgICBvLmFwcGVuZCgncmVjdCcpXG4gICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciBuZXh0ID0gZDMudGltZS55ZWFyLm9mZnNldChkLCAxKTtcbiAgICAgICAgbmV4dCA9IGQzLnRpbWUueWVhcihuZXh0KTtcbiAgICAgICAgbW9udGhXaWR0aCA9IHhTY2FsZShuZXh0KSAtIHhTY2FsZShkKTtcbiAgICAgICAgcmV0dXJuIG1vbnRoV2lkdGggLSAxO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdmaWxsJywgJyNFRkVGRUYnKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIDIwKVxuXG4gICAgby5hcHBlbmQoJ3RleHQnKVxuICAgICAgLmF0dHIoXCJkeFwiLCAxMClcbiAgICAgIC5hdHRyKFwiZHlcIiwgMTMpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyAobW9udGhXaWR0aCAvIDIgLSA0MCkgKyAnLCAwKSc7XG4gICAgICB9KVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICB3aW5kb3cuZCA9IGQ7XG4gICAgICAgIHJldHVybiBkLmdldEZ1bGxZZWFyKCkgKyAn5bm0JztcbiAgICAgIH0pO1xuXG4gICAgeEF4aXNNb250aEJveC5leGl0KCkucmVtb3ZlKCk7XG4gIH1cblxuICB2YXIgem9vbSA9IGNvbmZpZy56b29tO1xuICB2YXIgc2NhbGUgPSB4U2NhbGUuZG9tYWluKCk7XG4gIGdyYXBoLnNlbGVjdEFsbCgnLnhBeGlzTW9udGhCb3gnKS5yZW1vdmUoKTtcbiAgdmFyIG1haW5Cb3ggPSBncmFwaC5hcHBlbmQoJ2cnKS5jbGFzc2VkKCd4QXhpc01vbnRoQm94JywgdHJ1ZSk7XG4gIGdyYXBoLnNlbGVjdEFsbCgnLnhBeGlzQm94JykucmVtb3ZlKCk7XG4gIHZhciBzdWJCb3ggPSBncmFwaC5hcHBlbmQoJ2cnKS5jbGFzc2VkKCd4QXhpc0JveCcsIHRydWUpO1xuICB2YXIgem9vbVNjYWxlID0gem9vbS5zY2FsZSgpO1xuXG4gIHZhciBkcmF3TW9udGggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RhcnQgPSBkMy50aW1lLmRheS5vZmZzZXQoc2NhbGVbMF0sIC0zMik7XG4gICAgdmFyIGVuZCA9IGQzLnRpbWUuZGF5Lm9mZnNldChzY2FsZVsxXSwgMzIpO1xuICAgIHZhciBtb250aHMgPSBkMy50aW1lLm1vbnRocyhzdGFydCwgZW5kKTtcblxuICAgIHZhciB4QXhpc01vbnRoQm94ID0gbnVsbCxcbiAgICAgIG1vbnRoV2lkdGggPSAwO1xuICAgIHhBeGlzTW9udGhCb3ggPSBtYWluQm94LnNlbGVjdEFsbCgnZycpLmRhdGEobW9udGhzKTtcblxuICAgIHZhciBvID0geEF4aXNNb250aEJveC5lbnRlcigpXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyAoeFNjYWxlKGQpKSArICcsMCknO1xuICAgICAgfSlcblxuICAgIG8uYXBwZW5kKCdyZWN0JylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIG5leHQgPSBkMy50aW1lLmRheS5vZmZzZXQoZCwgMzEpO1xuICAgICAgICBuZXh0ID0gZDMudGltZS5tb250aChuZXh0KTtcbiAgICAgICAgbW9udGhXaWR0aCA9IHhTY2FsZShuZXh0KSAtIHhTY2FsZShkKTtcbiAgICAgICAgcmV0dXJuIG1vbnRoV2lkdGg7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnI0VGRUZFRicpXG4gICAgICAuYXR0cignc3Ryb2tlJywgJyNEMkQxRDEnKVxuICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsICcxJylcbiAgICAgIC5hdHRyKCdzaGFwZS1yZW5kZXJpbmcnLCAnY3Jpc3BFZGdlcycpXG4gICAgICAuYXR0cignaGVpZ2h0JywgMjApXG5cbiAgICBvLmFwcGVuZCgndGV4dCcpXG4gICAgICAuYXR0cihcImR4XCIsIDEwKVxuICAgICAgLmF0dHIoXCJkeVwiLCAxMylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIChtb250aFdpZHRoIC8gMiAtIDQwKSArICcsIDApJztcbiAgICAgIH0pXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgIHdpbmRvdy5kID0gZDtcbiAgICAgICAgcmV0dXJuIGQuZ2V0RnVsbFllYXIoKSArICflubQnICsgKGQuZ2V0TW9udGgoKSArIDEpICsgJ+aciCc7XG4gICAgICB9KTtcblxuICAgIHhBeGlzTW9udGhCb3guZXhpdCgpLnJlbW92ZSgpO1xuICB9XG5cblxuXG4gIC8vLy8vLy9cblxuXG5cbiAgaWYgKHpvb21TY2FsZSA+IDAuNykge1xuICAgIGRyYXdNb250aCgpO1xuXG4gICAgdmFyIHN0YXJ0ID0gZDMudGltZS5kYXkub2Zmc2V0KHNjYWxlWzBdLCAtNyk7XG4gICAgdmFyIGVuZCA9IGQzLnRpbWUuZGF5Lm9mZnNldChzY2FsZVsxXSwgKzcpO1xuICAgIHZhciBkYXlzID0gZDMudGltZS5kYXlzKHN0YXJ0LCBlbmQpO1xuXG4gICAgdmFyIHhBeGlzQm94ID0gbnVsbDtcbiAgICB4QXhpc0JveCA9IHN1YkJveC5zZWxlY3RBbGwoJ2cnKS5kYXRhKGRheXMpO1xuXG4gICAgdmFyIG8gPSB4QXhpc0JveC5lbnRlcigpXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGRheSA9IGQuZ2V0RGF5KCk7XG4gICAgICAgIHZhciByZXN1bHQgPSAnJztcbiAgICAgICAgaWYgKGRheSA9PSAwIHx8IGRheSA9PSA2KSB7XG4gICAgICAgICAgcmVzdWx0ID0gJ2QgaCdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgPSAnZCdcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSlcblxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGR4ID0gZDMudGltZS5kYXkub2Zmc2V0KGQsIDApO1xuICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgKHhTY2FsZShkeCkpICsgJywwKSc7XG4gICAgICB9KTtcblxuICAgIG8uYXBwZW5kKCdyZWN0JylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGR4ID0gZDMudGltZS5kYXkub2Zmc2V0KGQsIDEpO1xuICAgICAgICByZXR1cm4geFNjYWxlKGR4KSAtIHhTY2FsZShkKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cignc3Ryb2tlJywgJyNEMkQxRDEnKVxuICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsICcxJylcbiAgICAgIC5hdHRyKCdzaGFwZS1yZW5kZXJpbmcnLCAnY3Jpc3BFZGdlcycpXG4gICAgICAuYXR0cignaGVpZ2h0JywgMjApXG5cbiAgICBvLmFwcGVuZCgndGV4dCcpXG4gICAgICAuYXR0cihcImR4XCIsIDEwKVxuICAgICAgLmF0dHIoXCJkeVwiLCAxMylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuZ2V0RGF0ZSgpO1xuICAgICAgfSk7XG5cbiAgICB4QXhpc0JveC5leGl0KCkucmVtb3ZlKCk7XG4gICAgLy8tLS0tLS1cblxuICAgIHZhciBteWNhbnZhcz1kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1ib3gtYmdcIik7XG4gICAgdmFyIG15Y29udGV4dD1teWNhbnZhcy5nZXRDb250ZXh0KCcyZCcpOyBcbiAgICBteWNvbnRleHQuY2xlYXJSZWN0KDAsMCxteWNhbnZhcy53aWR0aCxteWNhbnZhcy5oZWlnaHQpO1xuXG4gICAgdmFyIGRyYXdMaW5lID0gZnVuY3Rpb24oZG90WFksIG9wcykge1xuICAgICAgbXljb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgZm9yICh2YXIgYXR0IGluIG9wcykgbXljb250ZXh0W2F0dF0gPSBvcHNbYXR0XTtcbiAgICAgIGRvdFhZID0gZG90WFkuY29uc3RydWN0b3IgPT0gT2JqZWN0ID8gW2RvdFhZIHx8IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgICAgfV0gOiBkb3RYWTtcbiAgICAgIG15Y29udGV4dC5tb3ZlVG8oZG90WFlbMF0ueCwgZG90WFlbMF0ueSk7XG4gICAgICBmb3IgKHZhciBpID0gMSwgbGVuID0gZG90WFkubGVuZ3RoOyBpIDwgbGVuOyBpKyspIG15Y29udGV4dC5saW5lVG8oZG90WFlbaV0ueCwgZG90WFlbaV0ueSk7XG4gICAgICBteWNvbnRleHQuc3Ryb2tlKCk7XG4gICAgfTtcblxuXG5cbiAgICBmb3IodmFyIGk9MDtpPGRheXMubGVuZ3RoO2krKyl7XG4gICAgICB2YXIgZGF5ID0gZGF5c1tpXTtcbiAgICAgIHZhciB4MSA9IHhTY2FsZShkYXkpO1xuICAgICAgdmFyIG5leHQgPSBkMy50aW1lLmRheS5vZmZzZXQoZGF5LCAxKTtcbiAgICAgIHZhciB4MiA9IHhTY2FsZShuZXh0KSAtIHhTY2FsZShkYXkpIC0gMTtcbiAgICAgIHgxID0gTWF0aC5yb3VuZCh4MSkrMC41O1xuXG4gICAgICB2YXIgZGF5ID0gZGF5LmdldERheSgpO1xuICAgICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgICAgaWYgKGRheSA9PSAwIHx8IGRheSA9PSA2KSB7XG4gICAgICAgIG15Y29udGV4dC5maWxsU3R5bGU9J3JnYigyNDIsIDI0NSwgMjUxKSc7ICBcbiAgICAgICAgbXljb250ZXh0LmZpbGxSZWN0KHgxLDAseDIsMTAwMCk7XG4gICAgICB9XG4gICAgICBkcmF3TGluZShbeyB4OiB4MSwgeTogMCB9LCB7IHg6IHgxLCB5OiAxMDAwIH1dXG4gICAgICAse2xpbmVXaWR0aDoxLHN0cm9rZVN0eWxlOidyZ2IoMjMwLDIyOCwyMjkpJ30pOyAvLyswLjXlgY/np7tcbiAgICB9XG5cbiAgICAvLy0tLVxuXG5cbiAgfSBlbHNlIGlmICh6b29tU2NhbGUgPiAwLjE1KSB7XG4gICAgZHJhd01vbnRoKCk7XG5cbiAgICB2YXIgc3RhcnQgPSBkMy50aW1lLmRheS5vZmZzZXQoc2NhbGVbMF0sIC0xNCk7XG4gICAgdmFyIGVuZCA9IGQzLnRpbWUuZGF5Lm9mZnNldChzY2FsZVsxXSwgKzE0KTtcbiAgICB2YXIgd2Vla3MgPSBkMy50aW1lLndlZWtzKHN0YXJ0LCBlbmQpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd2Vla3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHdlZWtzW2ldID0gZDMudGltZS5kYXkub2Zmc2V0KHdlZWtzW2ldLCAxKTtcbiAgICB9XG5cbiAgICB2YXIgeEF4aXNCb3ggPSBudWxsLFxuICAgICAgd2Vla1dpZHRoID0gMDtcbiAgICB4QXhpc0JveCA9IHN1YkJveC5zZWxlY3RBbGwoJ2cnKS5kYXRhKHdlZWtzKTtcblxuICAgIHZhciBvID0geEF4aXNCb3guZW50ZXIoKVxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciBkYXkgPSBkLmdldERheSgpO1xuICAgICAgICBpZiAoZGF5ID09IDAgfHwgZGF5ID09IDYpIHtcbiAgICAgICAgICByZXR1cm4gJ2QgaCdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gJ2QnXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgZHggPSBkMy50aW1lLmRheS5vZmZzZXQoZCwgMCk7XG4gICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyAoeFNjYWxlKGR4KSkgKyAnLDApJztcbiAgICAgIH0pO1xuXG4gICAgby5hcHBlbmQoJ3JlY3QnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgZHggPSBkMy50aW1lLmRheS5vZmZzZXQoZCwgKzcpO1xuICAgICAgICB3ZWVrV2lkdGggPSB4U2NhbGUoZHgpIC0geFNjYWxlKGQpO1xuICAgICAgICByZXR1cm4gd2Vla1dpZHRoO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdzdHJva2UnLCAnI0QyRDFEMScpXG4gICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgJzEnKVxuICAgICAgLmF0dHIoJ3NoYXBlLXJlbmRlcmluZycsICdjcmlzcEVkZ2VzJylcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCAyMClcblxuICAgIG8uYXBwZW5kKCd0ZXh0JylcbiAgICAgIC5hdHRyKFwiZHhcIiwgMTApXG4gICAgICAuYXR0cihcImR5XCIsIDEzKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgKHdlZWtXaWR0aCAvIDIgLSAyMCkgKyAnLCAwKSc7XG4gICAgICB9KVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgd2VlayA9IGdldFllYXJXZWVrKGQuZ2V0RnVsbFllYXIoKSwgZC5nZXRNb250aCgpICsgMSwgZC5nZXREYXRlKCkpO1xuICAgICAgICByZXR1cm4gd2VlayArICflkagnO1xuICAgICAgfSk7XG5cbiAgICB4QXhpc0JveC5leGl0KCkucmVtb3ZlKCk7XG4gICAgLy8tLS0tLS1cblxuICAgIHZhciBteWNhbnZhcz1kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRhaW5lci1ib3gtYmdcIik7XG4gICAgdmFyIG15Y29udGV4dD1teWNhbnZhcy5nZXRDb250ZXh0KCcyZCcpOyBcbiAgICBteWNvbnRleHQuY2xlYXJSZWN0KDAsMCxteWNhbnZhcy53aWR0aCxteWNhbnZhcy5oZWlnaHQpO1xuXG4gICAgdmFyIGRyYXdMaW5lID0gZnVuY3Rpb24oZG90WFksIG9wcykge1xuICAgICAgbXljb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgZm9yICh2YXIgYXR0IGluIG9wcykgbXljb250ZXh0W2F0dF0gPSBvcHNbYXR0XTtcbiAgICAgIGRvdFhZID0gZG90WFkuY29uc3RydWN0b3IgPT0gT2JqZWN0ID8gW2RvdFhZIHx8IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgICAgfV0gOiBkb3RYWTtcbiAgICAgIG15Y29udGV4dC5tb3ZlVG8oZG90WFlbMF0ueCwgZG90WFlbMF0ueSk7XG4gICAgICBmb3IgKHZhciBpID0gMSwgbGVuID0gZG90WFkubGVuZ3RoOyBpIDwgbGVuOyBpKyspIG15Y29udGV4dC5saW5lVG8oZG90WFlbaV0ueCwgZG90WFlbaV0ueSk7XG4gICAgICBteWNvbnRleHQuc3Ryb2tlKCk7XG4gICAgfTtcblxuXG5cbiAgICBmb3IodmFyIGk9MDtpPHdlZWtzLmxlbmd0aDtpKyspe1xuICAgICAgdmFyIGRheSA9IHdlZWtzW2ldO1xuICAgICAgdmFyIHgxID0geFNjYWxlKGRheSk7XG4gICAgICB2YXIgbmV4dCA9IGQzLnRpbWUuZGF5Lm9mZnNldChkYXksIDcpO1xuICAgICAgdmFyIHgyID0geFNjYWxlKG5leHQpIC0geFNjYWxlKGRheSkgLSAxO1xuICAgICAgeDEgPSBNYXRoLnJvdW5kKHgxKSswLjU7XG5cbiAgICAgIHZhciBkYXkgPSBkYXkuZ2V0RGF5KCk7XG4gICAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgICBkcmF3TGluZShbeyB4OiB4MSwgeTogMCB9LCB7IHg6IHgxLCB5OiAxMDAwIH1dXG4gICAgICAse2xpbmVXaWR0aDoxLHN0cm9rZVN0eWxlOidyZ2IoMjMwLDIyOCwyMjkpJ30pOyAvLyswLjXlgY/np7tcbiAgICB9XG5cbiAgICAvLy0tLVxuICB9IGVsc2Uge1xuICAgIGRyYXdZZWFyKCk7XG5cbiAgICB2YXIgc3RhcnQgPSBkMy50aW1lLm1vbnRoLm9mZnNldChzY2FsZVswXSwgLTEpO1xuICAgIHZhciBlbmQgPSBkMy50aW1lLm1vbnRoLm9mZnNldChzY2FsZVsxXSwgKzEpO1xuICAgIHZhciBtb250aHMgPSBkMy50aW1lLm1vbnRocyhzdGFydCwgZW5kKTtcbiAgICAvL2NvbnNvbGUubG9nKG1vbnRocyk7XG5cbiAgICB2YXIgeEF4aXNCb3ggPSBudWxsLFxuICAgICAgbW9udGhXaWR0aCA9IDA7XG4gICAgeEF4aXNCb3ggPSBzdWJCb3guc2VsZWN0QWxsKCdnJykuZGF0YShtb250aHMpO1xuXG4gICAgdmFyIG8gPSB4QXhpc0JveC5lbnRlcigpXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXR1cm4gJ2QnXG4gICAgICB9KVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGR4ID0gZDMudGltZS5kYXkub2Zmc2V0KGQsIDApO1xuICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgKHhTY2FsZShkeCkpICsgJywwKSc7XG4gICAgICB9KTtcblxuICAgIG8uYXBwZW5kKCdyZWN0JylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIGR4ID0gZDMudGltZS5tb250aC5vZmZzZXQoZCwgKzEpO1xuICAgICAgICBtb250aFdpZHRoID0geFNjYWxlKGR4KSAtIHhTY2FsZShkKTtcbiAgICAgICAgcmV0dXJuIG1vbnRoV2lkdGg7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ3N0cm9rZScsICcjRDJEMUQxJylcbiAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAnMScpXG4gICAgICAuYXR0cignc2hhcGUtcmVuZGVyaW5nJywgJ2NyaXNwRWRnZXMnKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIDIwKVxuXG4gICAgby5hcHBlbmQoJ3RleHQnKVxuICAgICAgLmF0dHIoXCJkeFwiLCAxMClcbiAgICAgIC5hdHRyKFwiZHlcIiwgMTMpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyAobW9udGhXaWR0aCAvIDIgLSAyMCkgKyAnLCAwKSc7XG4gICAgICB9KVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gKGQuZ2V0TW9udGgoKSArIDEpICsgJ+aciCc7XG4gICAgICB9KTtcblxuICAgIHhBeGlzQm94LmV4aXQoKS5yZW1vdmUoKTtcbiAgICAvLy0tLS0tLVxuXG4gICAgdmFyIG15Y2FudmFzPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGFpbmVyLWJveC1iZ1wiKTtcbiAgICB2YXIgbXljb250ZXh0PW15Y2FudmFzLmdldENvbnRleHQoJzJkJyk7IFxuICAgIG15Y29udGV4dC5jbGVhclJlY3QoMCwwLG15Y2FudmFzLndpZHRoLG15Y2FudmFzLmhlaWdodCk7XG5cbiAgICB2YXIgZHJhd0xpbmUgPSBmdW5jdGlvbihkb3RYWSwgb3BzKSB7XG4gICAgICBteWNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICBmb3IgKHZhciBhdHQgaW4gb3BzKSBteWNvbnRleHRbYXR0XSA9IG9wc1thdHRdO1xuICAgICAgZG90WFkgPSBkb3RYWS5jb25zdHJ1Y3RvciA9PSBPYmplY3QgPyBbZG90WFkgfHwge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwXG4gICAgICB9XSA6IGRvdFhZO1xuICAgICAgbXljb250ZXh0Lm1vdmVUbyhkb3RYWVswXS54LCBkb3RYWVswXS55KTtcbiAgICAgIGZvciAodmFyIGkgPSAxLCBsZW4gPSBkb3RYWS5sZW5ndGg7IGkgPCBsZW47IGkrKykgbXljb250ZXh0LmxpbmVUbyhkb3RYWVtpXS54LCBkb3RYWVtpXS55KTtcbiAgICAgIG15Y29udGV4dC5zdHJva2UoKTtcbiAgICB9O1xuXG5cblxuICAgIGZvcih2YXIgaT0wO2k8bW9udGhzLmxlbmd0aDtpKyspe1xuICAgICAgdmFyIGRheSA9IG1vbnRoc1tpXTtcbiAgICAgIHZhciB4MSA9IHhTY2FsZShkYXkpO1xuICAgICAgdmFyIGR4ID0gZDMudGltZS5tb250aC5vZmZzZXQoZCwgKzEpO1xuICAgICAgdmFyIHgyID0geFNjYWxlKG5leHQpIC0geFNjYWxlKGRheSkgLSAxO1xuICAgICAgeDEgPSBNYXRoLnJvdW5kKHgxKSswLjU7XG5cbiAgICAgIHZhciBkYXkgPSBkYXkuZ2V0RGF5KCk7XG4gICAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgICBkcmF3TGluZShbeyB4OiB4MSwgeTogMCB9LCB7IHg6IHgxLCB5OiAxMDAwIH1dXG4gICAgICAse2xpbmVXaWR0aDoxLHN0cm9rZVN0eWxlOidyZ2IoMjMwLDIyOCwyMjkpJ30pOyAvLyswLjXlgY/np7tcbiAgICB9XG5cbiAgICAvLy0tLVxuICB9XG5cblxuXG4gIGlmICh3aGVyZSA9PSAndG9wJykge1xuICAgIHN1YkJveC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIDIxKScpO1xuICAgIG1haW5Cb3guYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCAxKScpO1xuICB9IGVsc2Uge1xuICAgIHN1YkJveC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIDIpJyk7XG4gICAgbWFpbkJveC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDAsIDIyKScpO1xuICB9XG5cbiAgLy8gZ3JhcGguc2VsZWN0QWxsKCdsaW5lJykucmVtb3ZlKCk7XG4gIC8vIHZhciBsaW5lID0gZ3JhcGguYXBwZW5kKCdsaW5lJylcbiAgLy8gICAuYXR0cigneDEnLCAwKVxuICAvLyAgIC5hdHRyKCd4MicsIGNvbmZpZy53aWR0aClcbiAgLy8gICAuYXR0cigneTEnLCBsaW5lWSlcbiAgLy8gICAuYXR0cigneTInLCBsaW5lWSk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaWYgKHR5cGVvZiBjb25maWcuYXhpc0Zvcm1hdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbmZpZy5heGlzRm9ybWF0KHhBeGlzKTtcbiAgfVxuXG4gIC8vIHhBeGlzRWxzW3doZXJlXSA9IGdyYXBoXG4gIC8vICAgLmFwcGVuZCgnZycpXG4gIC8vICAgLmNsYXNzZWQoJ3gtYXhpcyBheGlzJywgdHJ1ZSlcbiAgLy8gICAuY2xhc3NlZCh3aGVyZSwgdHJ1ZSlcbiAgLy8gICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgY29uZmlnLm1hcmdpbi5sZWZ0ICsgJywgJyArIHkgKyAnKScpXG4gIC8vICAgLmNhbGwoeEF4aXNbd2hlcmVdKTtcblxuICB2YXIgZHJhd1hBeGlzID0gZnVuY3Rpb24gZHJhd1hBeGlzKCkge1xuICAgIHhBeGlzRWxzW3doZXJlXVxuICAgICAgLmNhbGwoeEF4aXNbd2hlcmVdKTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGRyYXdYQXhpczogZHJhd1hBeGlzXG4gIH07XG59OyJdfQ==
