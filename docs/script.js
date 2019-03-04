// ------------------------- svg3 init ------------------------//

var width = 600,
  height = 200;

var svg3 = d3.select("#DIAG").append("svg")
  .attr("width", width)
  .attr("height", height);

var link = svg3.selectAll(".link"),
  node = svg3.selectAll(".node"),
  fill = d3.scaleOrdinal(d3.schemeCategory20);

var simulation;


var tooltip = d3.select("#DIAG").append('div')
  .attr('class', 'hidden tooltip');

// ---------------------------- DATA parse ------------------------//


var donnee = {};

var graph = { nodes: [], links: [] };

var nb_nodes = 100, nb_cat = 10;

var idx = 0

d3.json("BrowserHistory.json", function (json) {
  var entries = json["Browser History"]
  for (var i in entries) {
    var entry = entries.reverse()[i];
    var site = entry.url.split('/')[2]
    // Adding the node
    if (site in donnee) {
      donnee[site].counter += 1
    }
    else {
      donnee[site] = { "url": site, 'id': idx, "counter": 1, date: new Date(entry.time_usec / 1000) }
      idx = idx + 1
    }

    // Adding the link
    var prev = undefined
    if (entry.page_transition == "LINK") {
      prev = entries.reverse()[Number(i) - 1].url.split('/')[2]
    }
    donnee[site].prev = prev

  }

  // ---------------------------- GRAPH init ------------------------//


  graph.nodes = Object.keys(donnee).map(function (d) {
    return { cat: Math.floor(nb_cat * Math.random()), size: 10, url: donnee[d].url, prev: donnee[d].prev, date: donnee[d].date };
  })

  graph.nodes.map(function (d, i) {
    graph.nodes.map(function (e, j) {
      if (e.prev == d.url && i != j)
        graph.links.push({ "source": i, "target": j })
    });
  });


  // ---------------------------------- Generate graph ----------------//




  drag = simulation => {

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  force_layout([new Date(2013, 2, 1), new Date(2020, 7, 15) - 1]);

  node.call(drag(simulation));
});




// ------------------------------  Functions --------------------------------//

function force_layout(date_filter) {
  drag = simulation => {

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  console.log(graph.nodes.filter(function (d) { return d.date >= date_filter[0] && d.date <= date_filter[1]; }).length)

  svg3.selectAll(".link").remove()
  svg3.selectAll(".node").remove()
  link = svg3.selectAll(".link")
  node = svg3.selectAll(".node")

  link = link.data(graph.links.filter(
    function (d) { 
      return d.source.date >= date_filter[0] 
      && d.source.date <= date_filter[1]
      && d.target.date >= date_filter[0]
      && d.target.date <= date_filter[1]; 
    }))
    .enter()
    .append("line")
    .attr("class", "link")

  node = node.data(graph.nodes.filter(function (d) { return d.date >= date_filter[0] && d.date <= date_filter[1]; }))
    .enter()
    .append("g")
    .on('mousemove', function (d, i) {
      var mouse = d3.mouse(svg3.node()).map(function (d) {
        return parseInt(d);
      });

      tooltip.classed('hidden', false)
        .attr('style', 'left:' + (mouse[0] + 15) + 'px; top:' + (mouse[1] + 150) + 'px')
        .html(graph.nodes[i].url);
    })
    .on('mouseout', function () {
      tooltip.classed('hidden', true)
    })
    .attr("class", "node")

  node.append("circle")
    .attr("r", function (d) { return d.size; })

    graph.nodes.forEach(function(d, i) {
      d.x = width/4 + 2*width*Math.random()/4;
      d.y = height/4 + 2*height*Math.random()/4;
    })

  simulation = d3.forceSimulation(graph.nodes)
    .force("link", d3.forceLink(graph.links).id(d => d.index))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX())
    .force("y", d3.forceY());

  graph_update(500);

  simulation.on("tick", function () {
    graph_update(0)
  });
  node.call(drag(simulation));

}

function graph_update(delay) {

  link.transition().duration(delay)
    .attr("x1", function (d) { return d.target.x; })
    .attr("y1", function (d) { return d.target.y; })
    .attr("x2", function (d) { return d.source.x; })
    .attr("y2", function (d) { return d.source.y; });

  node.transition().duration(delay)
    .attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

}

// ################################### SLIDER ###################################

var margin = {top: 10, right: 40, bottom: 10, left: 40},
    width = 960 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

var x = d3.scaleTime()
    .domain([new Date(2019, 1, 1), new Date(2019, 7, 15) - 1])
    .rangeRound([0, width]);

var svg4 = d3.select("#SLIDER").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg4.append("g")
    .attr("class", "axis axis--grid")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)
        .ticks(d3.timeHour, 12)
        .tickSize(-height)
        .tickFormat(function() { return null; }))
  .selectAll(".tick")
    .classed("tick--minor", function(d) { return d.getHours(); });

svg4.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x)
        .ticks(d3.timeMonth)
        .tickPadding(0))
    .attr("text-anchor", null)
  .selectAll("text")
    .attr("x", 6);

svg4.append("g")
    .attr("class", "brush")
    .call(d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("end", brushended));

function brushended() {
  if (!d3.event.sourceEvent) return; // Only transition after input.
  if (!d3.event.selection) return; // Ignore empty selections.
  var d0 = d3.event.selection.map(x.invert),
      d1 = d0.map(d3.timeDay.round);

  // If empty when rounded, use floor & ceil instead.
  if (d1[0] >= d1[1]) {
    d1[0] = d3.timeDay.floor(d0[0]);
    d1[1] = d3.timeDay.offset(d1[0]);
  }

  d3.select(this).transition().call(d3.event.target.move, d1.map(x));
  force_layout(d1)
}