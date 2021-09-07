// 設定畫圖的width, height
var margin = {top: 20, right: 50, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
// 設定parse資料時間的格式，範例資料為 9-Jun-14
var parseDate = d3.timeParse("%y-%m-%d");
// 使用techan這個framework拉出以時間為基準的x
var x = techan.scale.financetime()
        .range([0, width]);
// 設定y，範圍在0 ~ height之間
var y = d3.scaleLinear()
        .range([height, 0]);
//設定k線圖
var candlestick = techan.plot.candlestick()
        .xScale(x)
        .yScale(y);
// 設定x,y 軸
var xAxis = d3.axisBottom(x);

var xTopAxis = d3.axisTop(x);

var yAxis = d3.axisLeft(y);

var yRightAxis = d3.axisRight(y);

// 設定十字線左右邊要顯示的文字，根據不同的軸線(yAxis, yRightAxis)來決定
var ohlcAnnotation = techan.plot.axisannotation()
        .axis(yAxis)
        .orient('left')
        .format(d3.format(',.2f'));

var ohlcRightAnnotation = techan.plot.axisannotation()
        .axis(yRightAxis)
        .orient('right')
        .translate([width, 0]);
// 設定十字線上下顯示的時間
var timeAnnotation = techan.plot.axisannotation()
        .axis(xAxis)
        .orient('bottom')
        .format(d3.timeFormat('%Y-%m-%d')) // 顯示日期的格式 2019-03-19
        .width(65)
        .translate([0, height]);

var timeTopAnnotation = techan.plot.axisannotation()
        .axis(xTopAxis)
        .orient('top');
// 設定十字線
var crosshair = techan.plot.crosshair()
        .xScale(x) // 根據設定的x, y 去產生
        .yScale(y)
        .xAnnotation([timeAnnotation, timeTopAnnotation])
        .yAnnotation([ohlcAnnotation, ohlcRightAnnotation])
        .on("enter", enter) // 設定滑鼠移動過去時要呼叫的function
        .on("out", out)
        .on("move", move);
//設定畫圖區域
var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//設定右上角顯示的日期以及股價
var coordsText = svg.append('text')
        .style("text-anchor", "end")
        .attr("class", "coords")
        .attr("x", width - 5)
        .attr("y", 15);

// 讀取data，畫圖
d3.csv("2330.TW.csv", function(error, data) {

    var accessor = candlestick.accessor();

    //設定資料的讀取格式，把csv轉成key: value的格式
    data = data.slice(0, 200).map(function(d) {
        return {
            date: parseDate(d.Date), //日期
            open: +d.Open,   //開盤
            high: +d.High,   //最高點
            low: +d.Low,     //最低點
            close: +d.Close, //收盤
            volume: +d.Volume//成交量
        };
    }).sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

    // 設定x的資料來源
    x.domain(data.map(accessor.d));
    // 設定y的資料來源
    y.domain(techan.scale.plot.ohlc(data, accessor).domain());

    // 畫candlestick
    svg.append("g")
            .datum(data)
            .attr("class", "candlestick")
            .call(candlestick);
    // 畫x, y軸
    svg.append("g")
            .attr("class", "x axis")
            .call(xTopAxis);

    svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

    svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

    svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + width + ",0)") //利用translate移動到右邊
            .call(yRightAxis);
    // 畫各軸線顯示文字(40, 58, 67.5綠色底的文字)
    svg.append("g")
            .attr("class", "y annotation left")
            .datum([{value: 74}, {value: 67.5}, {value: 58}, {value:40}]) // 74 should not be rendered
            .call(ohlcAnnotation);

    svg.append("g")
            .attr("class", "x annotation bottom")
            .datum([{value: x.domain()[30]}])
            .call(timeAnnotation);

    svg.append("g")
            .attr("class", "y annotation right")
            .datum([{value: 61}, {value:52}])
            .call(ohlcRightAnnotation);

    svg.append("g")
            .attr("class", "x annotation top")
            .datum([{value: x.domain()[80]}])
            .call(timeTopAnnotation);

    svg.append('g')
            .attr("class", "crosshair")
            .datum({ x: x.domain()[80], y: 67.5 })
            .call(crosshair)
            .each(function(d) { move(d); }); // Display the current data

    svg.append('text')
            .attr("x", 5)
            .attr("y", 15)
            .text("Facebook, Inc. (FB)");
});

function enter() {
    coordsText.style("display", "inline");
}

// 滑鼠移出時把顯示文字隱藏起來
function out() {
    coordsText.style("display", "none");
}

//根據十字線經過的座標顯示其日期以及股價
function move(coords) {
    coordsText.text(
        timeAnnotation.format()(coords.x) + ", " + ohlcAnnotation.format()(coords.y)
    );
}