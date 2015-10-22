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
          .on("zoomend", zoomEnd);

        config.stepWidth = 40;
        config.step = graphWidth / config.stepWidth;
        config.end = d3.time.day.offset(config.start, config.step);
        config.zoom = zoom;


        var days = d3.time.days(config.start, config.end);
        xScale.range([0, graphWidth])
          .domain([config.start, config.end])
          .nice(d3.time.day);
        // console.log(config.start);
        // console.log(config.end);



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

        var dom = '<canvas id="container-box-bg" width="'
          +graphWidth+'" height="'+1000+'">'
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
        // console.log("graphHeight==" + graphHeight + '/' + wrapperHeight);

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
            d3.selectAll('.menu').remove()
            zoom.translate([d3.event.translate[0], 0]);
          }

          if (d3.event.sourceEvent && d3.event.sourceEvent.altKey && d3
            .event.sourceEvent.toString() ===
            '[object WheelEvent]') {
            zoom.scale(d3.event.scale);

            // console.log('d3.event.translate[0]='+d3.event.translate[0]);
            // if(d3.event.translate[0]<0){
            //   return;
            // }

            zoom.translate([d3.event.translate[0], 0]);
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
          // console.log('重画整体' + fullRedraw + '=' + (et - st) + 'ms');
        }
        zoom.scale(config.level||1);
        if (config.zoomScale) {
          zoom.scale(config.zoomScale);
        }
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