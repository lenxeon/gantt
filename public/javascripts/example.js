var config = {};

var tasks = [];

function visit(parent, visitFn, childrenFn) {
  if (!parent) return;
  visitFn(parent);
  var children = childrenFn(parent);
  if (children) {
    var count = children.length;
    for (var i = 0; i < count; i++) {
      visit(children[i], visitFn, childrenFn);
    }
  }
}

//url
var url = config.url || '/javascripts/flare.json';
var treeJSON = d3.json(url, function(error, result) {

  var nodeLength = 0,
    maxLabelLength = 0,
    totalNodes = 0;
  var tempDate = new Date();
  visit(result, function(d) {
    //这里加入一段处理函数，添加上开始时间，结束时间
    var r1 = Math.ceil(Math.random() * 100) % 3 + 1;
    var r2 = Math.ceil(Math.random() * 100) % 3;
    d.percent = Math.ceil(Math.random() * 100 / 10) / 10;
    d.startDate = d3.time.day(d3.time.day.offset(new Date(), r1));
    // console.log(r1 + '\t' + d.startDate);
    d.endDate = d3.time.day.offset(d.startDate, r2 + 1);
    d.taskName = '我的任务' + "#task#" + (++nodeLength);
    d.name = d.taskName;
    d.taskStatus = d.size / 3 == 0 ? "finished" : "runing";
    // console.log(d);

    var getStart = function() {
      var _tempDate = d3.time.day(d3.time.day.offset(tempDate, 1));
      // console.log(tempDate + '\t' + r1 + '\t' + _tempDate);
      tempDate = _tempDate;
      return _tempDate;
    }
    var getEnd = function() {
      return d3.time.day(d3.time.day.offset(tempDate, 1));
    }

    // var task2 = {
    //   name: '我的任务' + "#task#" + (nodeLength) + '_02',
    //   startDate: d3.time.day(d3.time.day.offset(task1.startDate, 3)),
    //   endDate: d3.time.day(d3.time.day.offset(task1.endDate, 3)),
    //   status: Math.ceil(Math.random() * 100) % 2 == 0 ? 'finished' : 'runing',
    //   percent: Math.ceil(Math.random() * 100 / 10) / 10
    // }

    for (var i = 0; i < 4; i++) {
      var task1 = {
        name: '我的任务' + "#tk#" + (nodeLength) + '_' + i,
        startDate: getStart(),
        endDate: getEnd(),
        status: Math.ceil(Math.random() * 100) % 2 == 0 ? 'finished' : 'runing',
        percent: Math.ceil(Math.random() * 100 / 10) / 10
      }
      tasks.push({
        "name": task1.name,
        tasks: [task1]
      });
      totalNodes++;
    }
    maxLabelLength = Math.max(d.name.length, maxLabelLength);
  }, function(d) {
    return d.children && d.children.length > 0 ? d.children :
      null;
  });

  var locale = d3.locale({
    "decimal": ",",
    "thousands": " ",
    "grouping": [3],
    "dateTime": "%y-%m-%d %H:%M:%s",
    "date": "%d/%m/%Y",
    "time": "%H:%M:%S",
    "periods": ["上午", "下午"],
    "days": ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
    "shortDays": ["日.", "一.", "二.", "三.", "四.", "五.", "六."],
    "months": ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月",
      "10月", "11月", "12月"
    ],
    "shortMonths": ["1", "2", "3", "4", "5", "6", "7", "8", "9",
      "10",
      "11", "12"
    ]
  });


  var app = d3.chart.app({
    name: 'lenxeon',
    locale: locale,
    width: $(document).width(),
    height: $(document).height(),
  });
  // console.log(tasks);
  var element = d3.select(document.getElementById('container')).datum(tasks);
  app(element);
});
