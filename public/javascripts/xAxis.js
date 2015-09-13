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
        return monthWidth - 1;
      })
      .attr('fill', '#dddddd')
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
      .attr('fill', '#dddddd')
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
        return monthWidth - 1;
      })
      .attr('fill', '#dddddd')
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



  if (zoomScale > 0.8) {
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
        return xScale(dx) - xScale(d) - 1;
      })
      .attr('height', 20)

    o.append('text')
      .attr("dx", 10)
      .attr("dy", 13)
      .text(function(d) {
        return d.getDate();
      });

    xAxisBox.exit().remove();
  } else if (zoomScale > 0.2) {
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
        return weekWidth - 1;
      })
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
  } else {
    drawYear();

    var start = d3.time.month.offset(scale[0], -1);
    var end = d3.time.month.offset(scale[1], +1);
    var months = d3.time.months(start, end);
    console.log(months);

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
        return monthWidth - 1;
      })
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
  }



  if (where == 'top') {
    subBox.attr('transform', 'translate(0, 22)');
    mainBox.attr('transform', 'translate(0, 1)');
  } else {
    subBox.attr('transform', 'translate(0, 2)');
    mainBox.attr('transform', 'translate(0, 23)');
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