/**
 * User: ArtZub
 * Date: 06.03.13
 * Time: 14:54
 * https://gist.github.com/artzub/5062548
 */
d3.helper = d3.helper || {};

d3.helper.tooltip = d3.helper.tooltip || function() {
  var tooltipDiv,
    body = d3.select('body'),
    attrs = [],
    text = "",
    styles = [],
    _w, _h, _p = {
      x: 16,
      y: 16
    };

  function doText(d, i) {
    // Crop text arbitrarily
    tooltipDiv.html(
      typeof text === "function" ? text(d, i) : typeof text !== "undefined" ?
      text : ''
    );
  }

  function mover(d, i) {

    var key, name, value;

    // Clean up lost tooltips
    body.selectAll('div.tooltip').remove();

    // Append tooltip
    tooltipDiv = body.append('div');

    for (key in attrs) {
      if (!attrs.hasOwnProperty(key))
        continue;
      name = attrs[key][0];
      if (typeof attrs[key][1] === "function") {
        value = attrs[key][1](d, i);
      } else value = attrs[key][1];
      tooltipDiv.attr(name, value);
    }
    tooltipDiv.classed("tooltip", true);

    for (key in styles) {
      if (!styles.hasOwnProperty(key))
        continue;
      name = styles[key][0];
      if (typeof attrs[key][1] === "function") {
        value = styles[key][1](d, i);
      } else value = styles[key][1];
      tooltipDiv.style(name, value);
    }
    tooltipDiv.style('position', 'absolute')
      .style('z-index', 1001);
    mm.apply(this, arguments);
    doText.apply(this, arguments);
  }

  function mm(d, i) {
    // Move tooltip
    //var absoluteMousePos = d3.mouse(body.node());

    var e = d3.event;
    if (arguments.length > 3)
      e = arguments[3];
    var absoluteMousePos = e ? [e.pageX, e.pageY] : [0, 0];


    tooltipDiv && tooltipDiv.style && tooltipDiv
      .style('left', (absoluteMousePos[0] > _w / 2 ? absoluteMousePos[0] -
          tooltipDiv.node().clientWidth - _p.x : absoluteMousePos[0] + _p.x) +
        'px')
      .style('top', (absoluteMousePos[1] > _h / 2 ? absoluteMousePos[1] -
          tooltipDiv.node().clientHeight - _p.y : absoluteMousePos[1] + _p.y) +
        'px');
    //doText(d, i);
  }

  function mout(d, i) {
    // Remove tooltip
    tooltipDiv && tooltipDiv.remove();
  }

  function tooltip(selection) {
    selection
      .on("mouseover.tooltip", mover)
      .on('mousemove.tooltip', mm)
      .on("mouseout.tooltip", mout);
  }

  tooltip.mouseover = mover;
  tooltip.mousemove = mm;
  tooltip.mouseout = mout;

  tooltip.attr = function(name, value) {
    attrs.push(arguments);
    return this;
  };

  tooltip.text = function(value) {
    text = value;
    return this;
  };

  tooltip.style = function(name, value) {
    styles.push(arguments);
    return this;
  };

  tooltip.spaceWidth = function(value) {
    if (!value) return _w;
    _w = +value;
    return this;
  };

  tooltip.spaceHeight = function(value) {
    if (!value) return _h;
    _h = +value;
    return this;
  };

  /**
   *  @params x or x,y {Number}
   */
  tooltip.padding = function() {
    if (!arguments.length) return _p;
    switch (arguments.length) {
      case 1:
        _p = {
          x: parseInt(arguments[0]),
          y: parseInt(arguments[0])
        };
        break;
      case 2:
        _p = {
          x: parseInt(arguments[0]),
          y: parseInt(arguments[1])
        };
        break;
    }
    return this;
  };

  return tooltip;
};
