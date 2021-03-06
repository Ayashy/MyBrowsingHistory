
// --------------------------------------------------------------- //
// ---------------------------- svg_BarChart init
// --------------------------------------------------------------- //

var margin = {
  top: 50, right: 50, bottom: 1, left: 50
};
var svg_BarChart = d3.select("#svg_BarChart")
var svg_BarChart_width = svg_BarChart.attr('width') - margin.left - margin.right - 20,
svg_BarChart_height = svg_BarChart.attr('height')- margin.top - margin.bottom;

//SVG container
svg_BarChart.attr("width", svg_BarChart_width + margin.left + margin.right)
    .attr("height", svg_BarChart_height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


g = svg_BarChart.append("g")


var x0 = d3.scaleBand()
  .rangeRound([0, svg_BarChart_width - 100])
  .paddingInner(0.05);

var x1 = d3.scaleBand()
  .padding(0.05);

var y = d3.scaleLinear()
  .rangeRound([svg_BarChart_height, 10]);

var z = d3.scaleOrdinal()
  .range(["#98abc5", "#a05d56", "#d0743c", "#ff8c00", "#50e188", "#b53901", "#ef695e", "#296b84"]);



// --------------------------------------------------------------- //
// ------------------------------  Functions 
// --------------------------------------------------------------- //

function draw_barchart(date_filter) {

  var data = raw_data

  //filter data
  data = data.filter(ligne => ( new Date(ligne.time_usec / 1000) >= date_filter[0] && new Date(ligne.time_usec / 1000) <= date_filter[1]));

  // Nest stock values by symbol.
  var dataByYear = d3.nest()
    .key(function (d) { return new Date(d.time_usec / 1000).getMonth(); })
    .key(function (d) { return d.category; })
    .rollup(function (v) { return v.length; })
    .entries(data);


  dataByYear.forEach(y => {
    y.month = y.key;
    delete y.key;
    y.values.forEach(d => {
      d.category = d.key;
      d.sum_price = +d.value;
      delete d.key;
      delete d.value;
    });

    y.values.sort((a, b) => {
      return b.sum_price - a.sum_price;
    });

  });

  let symbolList = ["Learning", "TechReads", "Social", "Email", "Shopping", "Travel", "Search", "Other"]

  let yearList = [ "0","1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]

  x0.domain(yearList);
  x1.domain(symbolList).rangeRound([0, x0.bandwidth()]);
  y.domain([0, d3.max(dataByYear, d => { return d3.max(d.values, el => { return el.sum_price; }); })]).nice();
  z.domain(symbolList);

  g.selectAll('g').remove()
  
  var year = g.append("g")
    .selectAll("g")
    .data(dataByYear)
    .enter().append("g")
    .attr("transform", d => { return "translate(" + x0(d.month) + ",0)"; })

  var rect = year.selectAll("rect")
    .data(d => { return d.values; })
    .enter().append("rect")
    .attr("y", svg_BarChart_height)
    .attr("width", x0.bandwidth())
    .attr("height", 0);

  let drawGroupedBars = () => {
    rect.transition()
      .duration(500)
      .delay((d, i) => { return i * 10; })
      .attr("x", d => { return x1(d.category); })
      .attr("y", d => { return y(d.sum_price); })
      .attr("width", x1.bandwidth())
      .attr("height", d => { return svg_BarChart_height - y(d.sum_price); })
      .attr("fill", d => { return z(d.category); });
  }

  let drawAxis = () => {
    
    g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + svg_BarChart_height + ")")
      .call(d3.axisBottom(x0));
    
    g.append("line")          // attach a line
    .style("stroke", "black")  // colour the line
    .attr("x1", 36)     // x position of the first end of the line
    .attr("y1", svg_BarChart_height)      // y position of the first end of the line
    .attr("x2", svg_BarChart_width - 100    )     // x position of the second end of the line
    .attr("y2", svg_BarChart_height);

    g.append("line")          // attach a line
    .style("stroke", "black")  // colour the line
    .attr("x1", 36)     // x position of the first end of the line
    .attr("y1", svg_BarChart_height)      // y position of the first end of the line
    .attr("x2", 36    )     // x position of the second end of the line
    .attr("y2", 0);

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisRight(y).ticks(null, "s"))
      .append("text")
      .attr("x", -6)
      .attr("y", y(y.ticks().pop()) + 10)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")
  }

  let drawLegend = (data) => {
    var legend = g.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .selectAll("g")
      .data(data)
      .enter().append("g")
      .attr("transform", (d, i) => { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
      .attr("x", svg_BarChart_width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", z);

    legend.append("text")
      .attr("x", svg_BarChart_width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(d => { return d; });
  }

  drawGroupedBars();
  drawAxis();
  drawLegend(symbolList);

  d3.selectAll("input").on("change", change);


  var timeout = setTimeout(() => {
    d3.select("input[value=\"grouped\"]").property("checked", true).each(change);
  }, 2000);

  function change() {
    clearTimeout(timeout);
    if (this.value === "grouped") transitionGrouped();
    else transitionStacked();
  }

  function transitionGrouped() {

    rect.transition()
      .duration(500)
      .delay((d, i) => { return i * 10; })
      .attr("x", d => { return x1(d.category); })
      .attr("width", x1.bandwidth())
      .transition()
      .attr("y", d => { return y(d.sum_price); })
      .attr("height", d => { return svg_BarChart_height - y(d.sum_price); });
  }

  function transitionStacked() {

    rect.transition()
      .duration(500)
      .delay((d, i) => { return i * 10; })
      .attr("y", d => { return y(d.sum_price); })
      .attr("height", d => { return svg_BarChart_height - y(d.sum_price); })
      .transition()
      .attr("x", d => { return x0(d.category); })
      .attr("width", x0.bandwidth());
  }

}

