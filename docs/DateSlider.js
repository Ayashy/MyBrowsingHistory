
// --------------------------------------------------------------- //
// ------------------------------  svg_DateSlider init 
// --------------------------------------------------------------- //

var margin = {
    top: 10, right: 10, bottom: 10, left: 10
};
var svg_DateSlider = d3.select("#svg_DateSlider"),
    svg_DateSlider_width = svg_DateSlider.attr('width') - margin.left - margin.right ,
    svg_DateSlider_height = svg_DateSlider.attr('height') - margin.top - margin.bottom;

svg_DateSlider.attr("width", svg_DateSlider_width + margin.left + margin.right)
    .attr("height", svg_DateSlider_height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleTime()
    .domain([new Date(2017, 12, 30), new Date(2018, 12, 1) ])
    .rangeRound([0, svg_DateSlider_width]);

svg_DateSlider.append("g")
    .attr("class", "axis axis--grid")
    .attr("transform", "translate(0," + svg_DateSlider_height + ")")
    .call(d3.axisBottom(x)
        .ticks(d3.timeWeek)
        .tickSize(-svg_DateSlider_height)
        .tickFormat(function () { return null; }))
    .selectAll(".tick")
    .classed("tick--minor", function (d) { return d.getHours(); });

svg_DateSlider.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + svg_DateSlider_height + ")")
    .call(d3.axisBottom(x)
        .ticks(d3.timeMonth)
        .tickPadding(0))
    .attr("text-anchor", null)
    .selectAll("text")
    .attr("x", 6);

svg_DateSlider.append("g")
    .attr("class", "brush")
    .call(d3.brushX()
        .extent([[0, 0], [svg_DateSlider_width, svg_DateSlider_height]])
        .on("end", brushended));

// --------------------------------------------------------------- //
// ---------------- Data change function 
// --------------------------------------------------------------- //

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

    // --------------------------------------------------------------------------------------
    // ------------------------------ CHANGES TO NODEGRAPH ----------------------------------
    // --------------------------------------------------------------------------------------

    force_layout(d1)
    function formatDate(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
    
        return [year, month, day].join('-');
    }

    // --------------------------------------------------------------------------------------
    // ------------------------------ CHANGES TO TREEMAP ------------------------------------
    // --------------------------------------------------------------------------------------
    d3.select("#currentdate").selectAll("p").remove()
    d3.select("#currentdate").append("p")
    .attr("id", "myNewParagrap")
    .append("text")
    .text(formatDate(d1[0])+"  -  "+formatDate(d1[1]))
    .attr("font-color", "white")

    data = filter_data(d1[0], d1[1], raw_data)

    console.log(data.length)

    var data = d3.nest()
        .key(function (d) { return d.category; })
        .key(function (d) { return d.domain; })
        .rollup(function (v) { return v.length; })
        .entries(data);

    var donnees_mod = {};
    // Add the data to the tree
    donnees_mod.key = "Data";
    donnees_mod.values = data;
    // Change the key names and children values from .next and add values for a chosen column to define the size of the blocks
    data = reSortRoot(donnees_mod, "value");

    d3.select("#svg_TreeMap").selectAll("g").remove();

    var svg_TREEMAP = d3.select("#svg_TreeMap")

    draw_MT(data, treemap, svg_TREEMAP, color, format)

    // --------------------------------------------------------------------------------------
    // ------------------------------ CHANGES TO BARCHART -----------------------------------
    // --------------------------------------------------------------------------------------

    draw_barchart(d1)

    // --------------------------------------------------------------------------------------
    // ------------------------------ CHANGES TO HEATMAP ------------------------------------
    // --------------------------------------------------------------------------------------



    draw_heatmap(d1)


}