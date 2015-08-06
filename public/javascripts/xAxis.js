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
