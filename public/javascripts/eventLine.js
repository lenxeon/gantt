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
