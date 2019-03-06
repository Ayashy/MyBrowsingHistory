
// --------------------------------------------------------------- //
// ---------------------------- svg_TreeMap init
// --------------------------------------------------------------- //
var margin = {
  top: 10, right: 10, bottom: 10, left: 10
};
var svg_TreeMap = d3.select("#svg_TreeMap"),
  svg_TreeMap_width = svg_TreeMap.attr('width') - margin.left - margin.right,
  svg_TreeMap_height = svg_TreeMap.attr('height') - margin.top - margin.bottom;

svg_TreeMap.attr("width", svg_TreeMap_width + margin.left + margin.right)
  .attr("height", svg_TreeMap_height + margin.top + margin.bottom)



var fader = function (color) { return d3.interpolateRgb(color, "#fff")(0.2); },
  color = d3.scaleOrdinal(d3.schemeCategory20.map(fader)),
  format = d3.format(",d");

var treemap = d3.treemap()
  .tile(d3.treemapResquarify)
  .size([svg_TreeMap_width, svg_TreeMap_height])
  .round(true)
  .paddingInner(1);

// --------------------------------------------------------------- //
// ------------------ Functions
// --------------------------------------------------------------- //

function draw_MT(data, treemap, svg, color, format) {

  var root = d3.hierarchy(data)
    .eachBefore(function (d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
    .sum(sumBySize)
    .sort(function (a, b) { return b.height - a.height || b.value - a.value; });

  treemap(root);

  var cell = svg.selectAll("g")
    .data(root.leaves())
    .enter().append("g")
    .attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

  cell.append("rect")
    .attr("id", function (d) { return d.data.id; })
    .attr("width", function (d) { return d.x1 - d.x0; })
    .attr("height", function (d) { return d.y1 - d.y0; })
    .attr("fill", function (d) { return color(d.parent.data.id); });

  cell.append("clipPath")
    .attr("id", function (d) { return "clip-" + d.data.id; })
    .append("use")
    .attr("xlink:href", function (d) { return "#" + d.data.id; });

  cell.append("text")
    .attr("clip-path", function (d) { return "url(#clip-" + d.data.id + ")"; })
    .selectAll("tspan")
    .data(function (d) { return d.data.name.split(/(?=[A-Z][^A-Z])/g); })
    .enter().append("tspan")
    .attr("x", 4)
    .attr("y", function (d, i) { return 13 + i * 10; })
    .text(function (d) { return d; });

  cell.append("title")
    .text(function (d) { return d.data.id + "\n" + format(d.value); });

  d3.selectAll("input")
    .data([sumBySize, sumByCount], function (d) { return d ? d.name : this.value; })
    .on("change", changed);

  var timeout = d3.timeout(function () {
    d3.select("input[value=\"sumByCount\"]")
      .property("checked", true)
      .dispatch("change");
  }, 2000);

  function changed(sum) {
    timeout.stop();

    treemap(root.sum(sum));

    cell.transition()
      .duration(750)
      .attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
      .select("rect")
      .attr("width", function (d) { return d.x1 - d.x0; })
      .attr("height", function (d) { return d.y1 - d.y0; });
  }
}

function sumByCount(d) {
  return d.children ? 0 : 1;
}

function sumBySize(d) {
  return d.size;
}


function reSortRoot(root, value_key) {
  //console.log("Calling");
  for (var key in root) {
    if (key == "key") {
      root.name = root.key;
      delete root.key;
    }
    if (key == "values") {
      root.children = [];
      for (item in root.values) {
        root.children.push(reSortRoot(root.values[item], value_key));
      }
      delete root.values;
    }
    if (key == value_key) {
      root.size = parseFloat(root[value_key]);
      delete root[value_key];
    }
  }
  return root;
}

function filter_data(date_min, date_max, data) {
  data = data.filter(ligne => (new Date(ligne.date) > date_min && new Date(ligne.date) < date_max));
  return data;
}

function formatDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}


function prepare_data(data) {
  var donnees = d3.nest()
    .key(function (d) { return d.category; })
    .key(function (d) { return d.domain; })
    .rollup(function (v) { return v.length; })
    .entries(data);

  var donnees_mod = {};
  // Add the data to the tree
  donnees_mod.key = "Data";
  donnees_mod.values = donnees;
  // Change the key names and children values from .next and add values for a chosen column to define the size of the blocks
  data = reSortRoot(donnees_mod, "value");
  return data
}
