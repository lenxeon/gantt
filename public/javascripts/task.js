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
