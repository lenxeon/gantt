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
var url = config.url || '/javascripts/flare_lite.json';
var treeJSON = d3.json(url, function(error, result) {

  var nodeLength = 0,
    maxLabelLength = 0,
    totalNodes = 0;
  var tempDate = new Date();
  var getStart = function() {
    var _tempDate = d3.time.day(d3.time.day.offset(tempDate, 1));
    tempDate = _tempDate;
    return _tempDate;
  }
  var getEnd = function() {
    return d3.time.day(d3.time.day.offset(tempDate, 1));
  }
  visit(result, function(d) {
    //这里加入一段处理函数，添加上开始时间，结束时间
    var r1 = Math.ceil(Math.random() * 100) % 3 + 1;
    var r2 = Math.ceil(Math.random() * 100) % 3;
    d.uuid = (Math.random() * 100000000000000000 + 100000000000000000) +
      "";
    d.percent = Math.ceil(Math.random() * 100 / 10) / 10;
    d.startDate = getStart();
    d.endDate = getEnd();
    d.taskName = '我的任务' + "#task#" + (++nodeLength);
    d.name = d.taskName;
    d.taskStatus = d.size / 3 == 0 ? "finished" : "runing";
    d.percent = Math.ceil(Math.random() * 100 / 10) / 10;
    d.package = Math.ceil(Math.random() * 100) % 2 == 0 ? true :
      false

    for (var i = 0; i < 1; i++) {
      var task1 = d;
      d.name = '我的任务' + "#tk#" + (nodeLength) + '_' + i;
      if (tasks.length > 6) {
        continue;
      }
      tasks.push({
        "name": task1.name,
        "uuid": (Math.random() * 100000000000000000 +
            100000000000000000) +
          "",
        tasks: [task1]
      });
      totalNodes++;
    }



    maxLabelLength = Math.max(d.name.length, maxLabelLength);
  }, function(d) {
    return d.children && d.children.length > 0 ? d.children :
      null;
  });


  tasks.push({
    "name": "这是一个装饰用的任务，为了生成尾线",
    "uuid": (Math.random() * 100000000000000000 +
        100000000000000000) +
      "",
    tasks: []
  })



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
    changeTimeHandler: function(o) {
      console.log(o);
    },
    changeStartTimeHandler: function(o) {
      console.log(o);
    },
    changeEndTimeHandler: function(o) {
      console.log(o);
    },
    changePercentHandler: function(o) {
      console.log(o);
    }
  });
  // console.log(tasks);
  var element = d3.select(document.getElementById('container')).datum(tasks);
  app(element);
});
