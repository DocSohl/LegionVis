/**
 * Created by Phil on 11/23/2015.
 */
function HistogramView(_timedata,_width,_height){
    /*Constructor for histogram view */
    var self = this;
    self.timedata = _timedata;
    self.histFirst = true;
    self.histCursorSelect = false;
    self.width = _width;
    self.height = _height;
}

HistogramView.prototype.update = function(checkedOption, histTasks){
    var self = this;

    var bins = []; // List of bin names
    var binned = {}; // Map of bins to values
    var maxval = 0; // Largest bin (for y scale)
    if(checkedOption == "Cursor"){
        if(histTasks == undefined) return;
        histTasks.forEach(function(d){
            var val = d.func_id; // Everything is stored via function ID
            if (!binned[val]) { // Add to the map if it doesn't exist
                binned[val] = 0;
                bins.push(val); // Register name
            }
            binned[val]++;
            maxval = Math.max(maxval, binned[val]); // Keep track of largest value
        });
    }
    else {
        self.histCursorSelect = false;
        self.timedata.forEach(function (d) { //Iterate over every element in the task series
            var val = d.func_id; // Everything is stored via function ID
            if (!binned[val]) { // Add to the map if it doesn't exist
                binned[val] = 0;
                bins.push(val); // Register name
            }
            if (checkedOption == "Count") // If we're just counting the number of occurrences
                binned[val]++;
            else if (checkedOption == "Time") // Otherwise base on run time
                binned[val] += d.stop - d.start;
            maxval = Math.max(maxval, binned[val]); // Keep track of largest value
        });
    }
    bins.sort(function(a, b){return a-b});

    var margin = {top: 20, right: 30, bottom: 30, left: 60};
    if(maxval>100000){ // TODO: Make scaling proportional to number size
        margin.left = 80;
    }
    var histwidth = self.width - margin.left - margin.right;
    var histheight = self.height - margin.top - margin.bottom;


    var x = d3.scale.ordinal().rangeRoundBands([0,histwidth],0.1)
        .domain(bins.map(function(d){return mainview.names[d];}));
    var y = d3.scale.linear().range([histheight,0])
        .domain([0,maxval]);

    var histxAxis = d3.svg.axis().scale(x).orient("bottom");
    var histyAxis = d3.svg.axis().scale(y).orient("left").tickFormat(d3.format("d"));

    var chart;
    if(self.histFirst){ // For the first iteration, set everything up
        chart = d3.select("#hist")
            .attr("width",histwidth + margin.left + margin.right)
            .attr("height",histheight + margin.top + margin.bottom)
            .append("g").attr("class","contents").attr("transform","translate(" + margin.left + "," + margin.top + ")");

        chart.append("g").attr("class","x axis")
            .attr("transform","translate(0," + histheight + ")")
            .call(histxAxis);

        chart.append("g").attr("class","y axis")
            .call(histyAxis);

        chart.append("text").attr("class","yLabel") // Y axis label
            .attr("transform","rotate(-90)")
            .attr("y",-margin.left)
            .attr("x",-histheight/2)
            .attr("dy","1em")
            .style("text-anchor","middle")
            .text("Count");

        self.histFirst = false; // Next time just update
    }
    else{ // Otherwise update existing values
        chart = d3.select("#hist").select(".contents");
        chart.transition() // Smoothly move between scales
            .attr("transform","translate(" + margin.left + "," + margin.top + ")");
        chart.select(".x.axis").transition().call(histxAxis);
        chart.select(".y.axis").transition().call(histyAxis);
        if(checkedOption == "Count") { // Change the label too
            chart.select(".yLabel").transition().attr("y",-margin.left).text("Count");
        }
        else{ // These have to transition as well so they don't pop out
            chart.select(".yLabel").transition().attr("y",-margin.left).text("Total Time (\u03BCs)");
        }
    }

    var bars = chart.selectAll(".bar").data(bins); // The actual data boxes

    bars.enter().append("rect").attr("class","bar").attr("opacity",0).style("fill","transparent");

    bars.transition() // Smoothly move between states
        .attr("opacity",1)
        .attr("x",function(d){return x(mainview.names[d]);})
        .attr("y",function(d){return y(binned[d]);})
        .attr("height",function(d){return histheight - y(binned[d]);})
        .attr("width", x.rangeBand())
        .style("fill",function(d){return mainview.color(d);});

    bars.exit().transition().remove();
};