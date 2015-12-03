/**
 * Created by Phil on 11/30/2015.
 */
function MainView(_timedata, _names, _concurrent){
    var self = this;

    self.timedata = _timedata;
    self.names = _names;
    self.concurrent = _concurrent;
}

MainView.prototype.update = function(){
    var self = this;
    var margin = {top: 20, right: 20, bottom: 30, left: 120};
    width = 1200 - margin.left - margin.right; // TODO: These values should be fixed to adjust to screen size
    height = 800 - margin.top - margin.bottom;
    var x = d3.scale.linear().domain([0,d3.max(self.timedata,function(d){return d.stop;})]).range([0,width]);
    var y = d3.scale.ordinal().domain(self.timedata.map(function(d){return d.proc_id;})).rangeRoundBands([0,height],0.1);

    zoom = d3.behavior.zoom() // Zoom only on the x dimension
        .scaleExtent([1,40])// TODO: These should be adjusted by total time
        .x(x)
        .on("zoom", zoomed);

    svg = d3.select("#timeline") // The main view
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")").call(zoom); // Zoom on entire view
    svg.on("mousemove",function(){
        d3.select("#stylus")
            .attr("x1",d3.mouse(this)[0])
            .attr("x2",d3.mouse(this)[0])
            .moveToFront();
        var converted = x.invert(d3.mouse(this)[0]);
        if(histCursorSelect) {
            histview.update("Cursor",self.concurrent.atTime(converted));
        }
        //console.log("Concurrency: "+self.concurrent.atTime(converted).length);
    });

    svg.append("rect") // Set up an invisible screen that allows zooming anywhere
        .attr("width",width)
        .attr("height",height)
        .style("fill","none")
        .style("pointer-events","all");

    svg.append("line")
        .attr("id","stylus")
        .attr({
            x1: 0,
            y1: 0,
            x2: 0,
            y2: height,
            stroke: "#000"
        })
        .style("pointer-events","none");

    /*D3 tip code from http://bl.ocks.org/Caged/6476579*/
    var tip = d3.tip() // Set up tooltips on hover
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>Func_ID:</strong> <span style='color:red'>" + self.names[d.func_id] + "</span>";
        });
    svg.call(tip);

    var funcs = d3.set(self.timedata.map(function(d){return d.func_id;})).values(); // A list of function IDs
    var stacks = d3.set(self.timedata.map(function(d){return d.stack;})).values(); // A list of possible concurrencies
    var procs = d3.set(self.timedata.map(function(d){return d.proc_id;})).values(); // A list of processor IDs

    color = d3.scale.ordinal().domain(funcs)// Manually defined colors. TODO: make automatic
        .range(['#a6cee3','#b2df8a','#fb9a99','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928']);

    xAxis = d3.svg.axis().scale(x).orient("bottom");

    var y1s = {}; // Map of processors to d3 ordinal scales
    for(var i = 0; i < procs.length; ++i){
        y1s[procs[i]] = d3.scale.ordinal();
        y1s[procs[i]].domain(stacks.slice(0,self.concurrent.maxStacks[procs[i]])).rangeRoundBands([y.rangeBand(),0]);
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
        .data(function(d){return self.timedata.filter(function(e){return d == e.proc_id;})}) // Limit to just this proc
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
        .text(function(d) { return self.names[d]; });

}