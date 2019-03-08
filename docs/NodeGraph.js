
// --------------------------------------------------------------- //
// ---------------------------- svg_NodeGraph init
// --------------------------------------------------------------- //

var margin = {
  top: 10, right: 10, bottom: 10, left: 10
};
var svg_NodeGraph = d3.select("#svg_NodeGraph"),
  svg_NodeGraph_width = svg_NodeGraph.attr('width') - margin.left - margin.right,
  svg_NodeGraph_height = svg_NodeGraph.attr('height') - margin.top - margin.bottom;

svg_NodeGraph.attr("width", svg_NodeGraph_width + margin.left + margin.right)
  .attr("height", svg_NodeGraph_height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var link = svg_NodeGraph.selectAll(".link"),
  node = svg_NodeGraph.selectAll(".node"),
  fill = d3.scaleOrdinal(d3.schemeCategory20);

var simulation;

var tooltip = svg_NodeGraph.select(function() {
  return this.parentNode;
}).append('div')
  .attr('class', ' tooltip')
  .style('visibility', 'hidden')

var donnee = {};

var graph = { nodes: [], links: [] };

var nb_nodes = 100, nb_cat = 10;

var idx = 0

var entries = []


// --------------------------------------------------------------- //
// ------------------------------  Functions 
// --------------------------------------------------------------- //

function force_layout(date_filter) {

  donnee = {};

  graph = { nodes: [], links: [] };

  for (var i in entries) {
    var entry = entries.reverse()[i];
    var date = new Date(entry.time_usec / 1000)

    if (date < date_filter[0] || date > date_filter[1])
      continue;

    var site = entry.domain
    // Adding the node
    if (site in donnee) {
      donnee[site].counter += 1
    }
    else {
      donnee[site] = { "url": site, 'id': idx, "counter": 1, icon: entry.favicon_url }
      idx = idx + 1
    }

    // Adding the link
    var prev = undefined
    if (entry.page_transition == "LINK" && entries.reverse()[Number(i) - 1]!=undefined) {
      prev = entries.reverse()[Number(i) - 1].domain
    }
    donnee[site].prev = prev

  }

  // ---------------------------- GRAPH init ------------------------//

  graph.nodes = Object.keys(donnee).map(function (d) {
    return { cat: Math.floor(nb_cat * Math.random()), size: 10, url: donnee[d].url, prev: donnee[d].prev, icon: donnee[d].icon };
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

  console.log(graph.nodes.length)

  svg_NodeGraph.selectAll(".link").remove()
  svg_NodeGraph.selectAll(".node").remove()
  link = svg_NodeGraph.selectAll(".link")
  node = svg_NodeGraph.selectAll(".node")

  link = link.data(graph.links)
    .enter()
    .append("line")
    .attr("class", "link")



  node = node.data(graph.nodes)
    .enter()
    .append("g")
    .attr("background", function (d) { return d.icon; })
    .on('mousemove', function (d, i) {
      var mouse = d3.mouse(svg_NodeGraph.node()).map(function (d) {
        return parseInt(d);
      });

      tooltip.style('visibility', 'visible')
        .attr('style', 'left:' + (mouse[0]+10) + 'px; top:' + (mouse[1] + 15) + 'px')
        .html(graph.nodes[i].url);
    })
    .on('mouseout', function () {
      tooltip.style('visibility', 'hidden')

    })
    .attr("class", "node")

  node.append("circle")
    .attr("r", function (d) { return svg_BarChart_height*0.05; })

  node.append("image")
    .attr("xlink:href", function (d) { return d.icon; })
    .attr("x", function (d) { return 2.5 - d.size; })
    .attr("y", function (d) { return 2.5 - d.size; })
    .attr("width", function (d) { return 1.4 * d.size; })
    .attr("height", function (d) { return 1.4 * d.size; });


  graph.nodes.forEach(function (d, i) {
    d.x = svg_NodeGraph_width / 4 + 2 * svg_NodeGraph_width * Math.random() / 4;
    d.y = svg_NodeGraph_height / 4 + 2 * svg_NodeGraph_height * Math.random() / 4;
  })

  simulation = d3.forceSimulation(graph.nodes)
    .force("link", d3.forceLink(graph.links).id(d => d.index).distance(function distance() { return 50; }))
    .force("charge", d3.forceManyBody().strength(-50))
    .force("center", d3.forceCenter(svg_NodeGraph_width / 2, svg_NodeGraph_height / 2))
    .force("collide", d3.forceCollide().radius(12))
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

  function positionLink(d) {
    var offset = 30;

    var midpoint_x = (d.source.x + d.target.x) / 2;
    var midpoint_y = (d.source.y + d.target.y) / 2;

    var dx = (d.target.x - d.source.x);
    var dy = (d.target.y - d.source.y);

    var normalise = Math.sqrt((dx * dx) + (dy * dy));

    var offSetX = midpoint_x + offset * (dy / normalise);
    var offSetY = midpoint_y - offset * (dx / normalise);

    return "M" + d.source.x + "," + d.source.y +
      "S" + offSetX + "," + offSetY +
      " " + d.target.x + "," + d.target.y;
  }

}
