
var svg, xAxis, taskcontainer, zoom, width, height, names, timedata, color;
var histFirst = true;

/**
 * Scan the time series task data and modify it with concurrency numbers
 * @param {array} data Array of task objects
 * @returns {dictionary} Mapping of processors to maximum concurrency
 */
function scanData(data){
    data.sort(function(a,b){return a.start - b.start;});
    var ends = {};
    var procs = [];
    var maxes = {};
    for(var i = 0; i < data.length; ++i){
        var proc = data[i].proc_id;
        if(ends[proc] == undefined){
            ends[proc] = [];
            procs.push(proc);
            maxes[proc] = 0;
        }
        var maxval = 0;
        for(var j = 0; j < ends[proc].length; ++j){
            if(ends[proc][j].stop < data[i].start){
                ends[proc].splice(j--,1);
                continue;
            }
            maxval = Math.max(maxval,ends[proc][j].stack);
        }
        data[i].stack = ++maxval;
        maxes[proc] = Math.max(maxes[proc],maxval);
        ends[proc].push({"stop":data[i].stop,"stack":maxval});
    }
    procs.sort();
    var output = [];
    for(var i = 0; i < procs.length; ++i){
        output.push(maxes[procs]);
    }
    return maxes;
};

/**
 * Loads data, prepares and populates all D3 components. Only run once
 */
function Init(){
    d3.json("tasks.json",function(data){ // Load all task information from the server
        timedata = data[0]; // An array of task objects
        names = data[1]; // A map of function IDs to task names
        var maxStacks = scanData(timedata); // Scan through the data to find concurrencies
        var margin = {top: 20, right: 20, bottom: 30, left: 120};
        width = 1200 - margin.left - margin.right; // TODO: These values should be fixed to adjust to screen size
        height = 800 - margin.top - margin.bottom;

        var x = d3.scale.linear().domain([0,d3.max(timedata,function(d){return d.stop;})]).range([0,width]);
        var y = d3.scale.ordinal().domain(timedata.map(function(d){return d.proc_id;})).rangeRoundBands([0,height],0.1);

        zoom = d3.behavior.zoom() // Zoom only on the x dimension
            .scaleExtent([1,40])// TODO: These should be adjusted by total time
            .x(x)
            .on("zoom", zoomed);

        svg = d3.select("#timeline") // The main view
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")").call(zoom); // Zoom on entire view

        svg.append("rect") // Set up an invisible screen that allows zooming anywhere
            .attr("width",width)
            .attr("height",height)
            .style("fill","none")
            .style("pointer-events","all");

        /*D3 tip code from http://bl.ocks.org/Caged/6476579*/
        var tip = d3.tip() // Set up tooltips on hover
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                return "<strong>Func_ID:</strong> <span style='color:red'>" + names[d.func_id] + "</span>";
            });
        svg.call(tip);

        var funcs = d3.set(timedata.map(function(d){return d.func_id;})).values(); // A list of function IDs
        var stacks = d3.set(timedata.map(function(d){return d.stack;})).values(); // A list of possible concurrencies
        var procs = d3.set(timedata.map(function(d){return d.proc_id;})).values(); // A list of processor IDs

        color = d3.scale.ordinal().domain(funcs)// Manually defined colors. TODO: make automatic
            .range(['#a6cee3','#b2df8a','#fb9a99','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928']);

        xAxis = d3.svg.axis().scale(x).orient("bottom");

        var y1s = {}; // Map of processors to d3 ordinal scales
        for(var i = 0; i < procs.length; ++i){
            y1s[procs[i]] = d3.scale.ordinal();
            y1s[procs[i]].domain(stacks.slice(0,maxStacks[procs[i]])).rangeRoundBands([y.rangeBand(),0]);
        }

        svg.append("g")
            .attr("class","x axis")
            .attr("transform","translate(0,"+height+")")
            .call(xAxis);


        taskcontainer = svg.append("g"); // Main view container

        var clip = svg.append("defs").append("svg:clipPath") // Set up a clip path so tasks don't appear offscreen
            .attr("id", "clip")
            .append("svg:rect")
            .attr("id", "clip-rect")
            .attr("x", "0")
            .attr("y", "0")
            .attr("width", width)
            .attr("height", height);

        var tasks = taskcontainer.selectAll(".task") // Set up each processor list
            .data(procs)
            .enter().append("g")
            .attr("class","g")
            .attr("transform",function(d){return "translate(0,"+y(d)+")";}); // Put each proc in its own g


        tasks.append("rect") // A box to indicate the range of the processor
            .attr("class","processor")
            .attr("x",-1)
            .attr("y",-1)
            .attr("width",width+2)
            .attr("height",y.rangeBand()+2); // Extra padding to allow a border


        tasks.append("text") // Name of the processor
            .attr("class","proc-label")
            .style("text-anchor", "end")
            .attr("x",-10)
            .attr("y",y.rangeBand()/2)
            .text(function(d){return "Processor #"+ d;});

        var clipg = tasks.append("g") // Limit the actual task boxes by the clipping window
            .attr("clip-path","url(#clip)");

        var subtasks = clipg.append("g").attr("class","subtasks");


        subtasks.selectAll(".task") // Add the actual task boxes
            .data(function(d){return timedata.filter(function(e){return d == e.proc_id;})}) // Limit to just this proc
            .enter().append("rect").attr("class","task")
            .attr("height",function(d){return y1s[d.proc_id].rangeBand();}) // Use local scale
            .attr("y",function(d){return y1s[d.proc_id](d.stack);}) // Scale based on concurrency
            .attr("x",function(d){return x(d.start);})
            .attr("width",function(d){return x(d.stop - d.start);}) // This is associative
            .style("fill",function(d){return color(d.func_id);})
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .on('mouseup',taskClicked);

        var svglegend = d3.select("#legend") // Set up the legend in a separate SVG
            .attr("width",400)
            .attr("height",20*funcs.length+30);

        svglegend.append("text").attr("y",20).attr("x",50).text("Task Name"); // Legend title

        var legend = svglegend.selectAll(".legend") // Generate legend based on entries
            .data(funcs.slice())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(50," + ((i+1) * 20 + 10) + ")"; });

        legend.append("rect") // Box to indicate color
            .attr("x", 0)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(function(d) { return names[d]; });

        updateHist(); // Set up the histogram

    });
}

/**
 * First run populates the histogram chart, and subsequent runs updates the histogram
 */
function updateHist(){
    var bins = []; // List of bin names
    var binned = {}; // Map of bins to values
    var maxval = 0; // Largest bin (for y scale)
    var curChecked = document.getElementById("histcount").checked; // Which element is checked in radio-buttons
    timedata.forEach(function(d){ //Iterate over every element in the task series
        var val = d.func_id; // Everything is stored via function ID
        if(!binned[val]){ // Add to the map if it doesn't exist
            binned[val] = 0;
            bins.push(val); // Register name
        }
        if(curChecked) // If we're just counting the number of occurrences
            binned[val]++;
        else{ // Otherwise base on run time
            binned[val] += d.stop - d.start;
        }
        maxval = Math.max(maxval,binned[val]); // Keep track of largest value
    });

    var margin = {top: 20, right: 30, bottom: 30, left: 60};
    if(maxval>100000){ // TODO: Make scaling proportional to number size
        margin.left = 80;
    }
    var histwidth = 500 - margin.left - margin.right;
    var histheight = 500 - margin.top - margin.bottom;


    var x = d3.scale.ordinal().rangeRoundBands([0,histwidth],0.1)
        .domain(bins.map(function(d){return names[d];}));
    var y = d3.scale.linear().range([histheight,0])
        .domain([0,maxval]);

    var histxAxis = d3.svg.axis().scale(x).orient("bottom");
    var histyAxis = d3.svg.axis().scale(y).orient("left");

    var chart;
    if(histFirst){ // For the first iteration, set everything up
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

        histFirst = false; // Next time just update
    }
    else{ // Otherwise update existing values
        chart = d3.select("#hist").select(".contents");
        chart.transition() // Smoothly move between scales
            .attr("transform","translate(" + margin.left + "," + margin.top + ")");
        chart.select(".x.axis").transition().call(histxAxis);
        chart.select(".y.axis").transition().call(histyAxis);
        if(curChecked) { // Change the label too
            chart.select(".yLabel").transition().attr("y",-margin.left).text("Count");
        }
        else{ // These have to transition as well so they don't pop out
            chart.select(".yLabel").transition().attr("y",-margin.left).text("Total Time (\u03BCs)");
        }
    }

    var bars = chart.selectAll(".bar").data(bins); // The actual data boxes

    bars.enter().append("rect").attr("class","bar");

    bars.transition() // Smoothly move between states
        .attr("x",function(d){return x(names[d]);})
        .attr("y",function(d){return y(binned[d]);})
        .attr("height",function(d){return histheight - y(binned[d]);})
        .attr("width", x.rangeBand())
        .style("fill",function(d){return color(d);});
}

/**
 * Event handler for the main window zoom behavior
 */
function zoomed() {
    // Bound the view even when scaled (Note: X axis is reversed and goes from -width to 0)
    xmov = Math.max(Math.min(d3.event.translate[0],0),-width*d3.event.scale + width);
    zoom.translate([xmov,0]); // Apply the panning movement
    svg.select(".x.axis").call(xAxis); // Apply the movement to the scaled axis
    taskcontainer.selectAll(".subtasks").attr("transform", "translate(" + xmov + ",0)scale(" + d3.event.scale + ",1)");
}

/**
 * Even handler for clicking on the main window
 * @param d Object clicked on
 */
function taskClicked(d){
    var props = d3.select("#properties"); // Properties div

    var nl = "<br/>"; // The newline break
    var output = "Name: " + names[d.func_id] + nl +
            "Task ID: " + d.task_id + nl +
            "Function ID: " + d.func_id + nl +
            "Processor: " + d.proc_id + nl +
            "Start: " + Math.round(d.start) + " &mu;s" + nl +
            "Stop: " + Math.round(d.stop) + " &mu;s" + nl +
            "Duration: " + Math.round(d.stop - d.start) + " &mu;s";

    props.html(output); // TODO: Fix this to prevent XSS
}

Init(); // Set up the page
