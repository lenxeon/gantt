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
