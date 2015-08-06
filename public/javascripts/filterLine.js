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
