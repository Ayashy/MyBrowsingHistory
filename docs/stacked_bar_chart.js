
      var margin = {top: 20, right: 20, bottom: 30, left: 40};
      var width = 960 - margin.left - margin.right;
      var height = 500 - margin.top - margin.bottom;
      var duration = 800;

          // Create svg canvas

      var svg = d3.select("#SBC")
      .append("svg")
      .attr("width",width+margin.left+margin.right)
      .attr("height",height+margin.bottom+margin.top)
      

      var g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


      // COLOR SCALE 


      var color = d3.scaleOrdinal()
      .domain(["Learning","Social","Search", "Email"])
      .range(["#ef3b17", "#b0ff32", "#3a82ff", "#d1cec8"]);

            // Loading data


            d3.csv("stocks.csv", function(data) {

            // DATE PARSING FUNCTIONS

            var parseDate = d3.timeParse("%b %Y");
        var formatTime = d3.timeFormat("%Y")

        // SCALE DEFINITIONS

        var x0 = d3.scaleBand()
        .range([0,width], .2);


      var x1 = d3.scaleBand()
          .padding(0.2)

      var y = d3.scaleLinear()
          .range([height,0]);

      var xStack = d3.scaleBand()
        .range([0,width])
        .align(0.1)
        .padding(0.2)

      var yStack = d3.scaleLinear()
        .range([height,0])



      // DATA PREPROCESSING 


      // Construct the dataset that we'll use for both stackedBar and groupedBar
        // stock values by date, grouped by year

        var ByYear = d3.nest()
        .key(function(d){ return formatTime(parseDate(d.date));})
        .entries(data);

        /* ByYear :  [{key:"2000",values:[{symbol:MSFT, date="Jan 2000",price="39.81"},{},.....]},{key = 2001,}  ] */
        var YearMean = [];

        ByYear.forEach(function(Year) {

          var BySymbol = d3.nest()
          .key(function(d) {return d.symbol;})
          .rollup(function(e) {return d3.mean(e,function(d) {return d.price;})})
          .object(Year.values);

        /*BySymbol contains the mean of the stock based on the current year in the iteration, by symbol : {MSFT:55,AMZN:58,...} */ 
          YearMean.push({
            key: +Year.key,
            values: BySymbol
          });
        });


        /*YearMean contains the year as key, and the stocks mean by symbol in objets in the values array : [{key:2000,values:{MSFT:46,AMZN:98,...}}] */ 
        /* Creation of final dataset */
        var stocks = YearMean.map(function(d) {
          // Add the year 
          var final= { year: d.key};

          // Add the stocks by symbol by copying them into final
          // object.keys(d.values) gets into d.values, forEach gets all the d.values (symbols) and adds them to the final data
          Object.keys(d.values).forEach(function(key) {
            final[key] = d.values[key];
          });

          return final;

        });

        /* Stocks now has the following structure : [{year:2000,MSFT:46,AMZN:89,..},{....}]*/

        // USEFULL VARIABLES FOR SCALES

        // keys has the array with the symbol names, usefull for the x1 domain

        var keys = d3.keys(stocks[0]).slice(1);
        // total has the totals for each year of all the stock means, usefull for the yStack domain
        var total =[];
        stocks.forEach(function(d){
          total.push(d3.sum(keys,function(symbol){return d[symbol];}))
        })

        
        // SCALE DOMAINS DEFINITION

        // x0 positions the bars for the grouped bar based on the year
        x0.domain(stocks.map(function(d) {return d.year}));
        // x1 positions the bars for the grouped bar based on the symbol, taking in count the x0 bandwidth
        x1.domain(keys)
        .range([0,x0.bandwidth()-10]);
        // y positions the bars for the grouped bar based on the price of the stocks (makes them higher)
        // we take the max in stocks based on the max in the keys values of each year, only on the symbols
        y.domain([0,d3.max(stocks, function(d) {
                            return d3.max(keys,function(symbol){
                                              return d[symbol]
                                              })
                            })
        ]);

        // xStacks est similaire à x
        xStack.domain(stocks.map(function(d) {return d.year}));
        // yStack takes only the sum of each year which is contained on total
        yStack.domain([0,d3.max(total)]);


        // CREATION OF THE CHARTS

        var grouped = g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(keys)(stocks))
        .enter()
        .append("g")
        .attr("fill",function(d) {return color(d.key)});

        // Creates the rect elements that will change based on the transition, initialized as a StackedBar

        var rect = grouped.selectAll("rect")
        .data(function(d) {return d;})
        .enter()
        .append("rect")
        .attr("x",function(d) {return xStack(d.data.year);})
        .attr("y",function(d) {return yStack(d[1]);})
        .attr("height",function(d) {return yStack(d[0]) - yStack(d[1]);})
        .attr("width",xStack.bandwidth());

        // Executes the function changed() if the input si changed
        d3.selectAll("input")
        .on("change",changed);

        // Executes the functions GroupedBar or StackedBar based on the value of the input

        function changed() {
          if (this.value ==="grouped") GroupedBar();
          else StackedBar();
        }

        function GroupedBar() {

          rect
          .transition()
          .duration(duration)
          .attr("width", x1.bandwidth()) //first change the width of the rects to the x1 scale 
          .transition()
          .duration(duration)
          .attr("x",function(d,i) { //then separate them with their x coordinates
            return x0(d.data.year) + x1(this.parentNode.__data__.key);
          })
          .transition()
          .duration(duration) //then rescale them with their y and height simultaneously
          .attr("y",function(d) {return y(d[1]-d[0]);})
          .attr("height",function(d) {return y(0)-y(d[1]-d[0]);});

        };

        function StackedBar(){
          rect
          .transition()
          .duration(duration)
          .attr("y",function(d) {return yStack(d[1]-d[0]);})
          .attr("height",function(d){return yStack(d[0])-yStack(d[1]);})
          .transition()
          .duration(duration)
          .attr("y", function(d) {return yStack(d[1]);})
          .transition()
          .duration(duration)
          .attr("x",function(d) {return xStack(d.data.year);})
          .attr("width",xStack.bandwidth());
        };

            });

      // LEGEND CREATION

      // positions the group and gives the class legend
      var legend = svg.selectAll(".legend")
      .data(color.domain())
      .enter()
      .append("g")
      .attr("class","legend")
      .attr("transform",function(d,i) {
        return "translate(0," + i * 15 + ")";
      });

      legend.append("path")
      .style("fill",function(d) {return color(d);})
      .attr("d", d3.symbol().type(d3.symbolSquare).size(120))
      .attr("transform",function(d) {
        return "translate (" + width/5 + "," + 10 +")";
      })

      legend.append("text")
      .attr("x",width/5 + 15)
      .attr("y",10)
      .attr("dy",".30em")
      .text(function(d) {return d;})

      svg.append("text")
      .attr("x",width/2 - 40)
      .attr("y",20)
      .attr("dy",".20em")
      .attr("font-size",25)
      .attr("class","title")