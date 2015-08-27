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
