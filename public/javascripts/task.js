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
