/**
 * Created by Phil on 11/30/2015.
 */
function MainView(_timedata, _names, _procs, _concurrent, _width, _height){
    var self = this;

    self.timedata = _timedata;
    self.names = _names;
    self.procs = _procs;
    self.concurrent = _concurrent;
    self.memory = false;
    self.annotations = [];
    self.funcs = d3.set(self.timedata.map(function(d){return d.func_id;})).values(); // A list of function IDs
    self.stacks = d3.set(self.timedata.map(function(d){return d.stack;})).values(); // A list of possible concurrencies
    if(self.procs == null) {
        self.procs = []; // A list of processor IDs
        self.timedata.forEach(function (d) {
            var obj = {id: d.proc_id, name: d.proc_kind};
            var inProcs = false;
            for (var i = 0; i < self.procs.length; ++i) {
                if (obj.id == self.procs[i].id) {
                    inProcs = true;
                    break;
                }
            }
            if (!inProcs) self.procs.push(obj);
        });
    }

    var margin = {top: 20, right: 50, bottom: 30, left: 190};

    d3.select("#timelinecontainer").style("height",_height).style("width",_width + 30).style("margin-right",30);
    if(self.procs.length <= 6){
        self.height = _height - margin.top - margin.bottom;
    }
    else{

        self.height = (_height)*(self.procs.length/6) - margin.top - margin.bottom;
    }
    self.width = _width - margin.left - margin.right;
    var maxtime = d3.max(self.timedata,function(d){return d.stop;});
    self.x = d3.scale.linear().domain([0,maxtime]).range([0,self.width]);
    self.y = d3.scale.ordinal().domain(self.procs.map(function(d){return d.id;})).rangeRoundBands([0,self.height],0.1);

    self.stylusMove = function(){
        var pos = d3.mouse(self.svg[0][0])[0];
        d3.select("#stylus")
            .attr("x1",pos)
            .attr("x2",pos)
            .moveToFront();
        var converted = self.x.invert(pos);
        if(histview.histCursorSelect) {
            histview.update("Cursor",self.concurrent.atTime(converted));
        }
    };

    self.zoom = d3.behavior.zoom() // Zoom only on the x dimension
        .scaleExtent([1,40])// TODO: These should be adjusted by total time
        .x(self.x)
        .on("zoom", function(){
            // Bound the view even when scaled (Note: X axis is reversed and goes from -width to 0)
            mainview.updateZoom(d3.event.scale,d3.event.translate[0]);
            summaryview.updateBrush();

        });

    self.svg = d3.select("#timeline") // The main view
        .attr("width", self.width + margin.left + margin.right)
        .attr("height", self.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")").call(self.zoom); // Zoom on entire view


    self.svg.append("rect") // Set up an invisible screen that allows zooming anywhere
        .attr("class","invisible")
        .attr("width",self.width)
        .attr("height",self.height)
        .style("fill","none")
        .style("pointer-events","all");

    self.svg.append("line")
        .attr("id","stylus")
        .attr({
            x1: 0,
            y1: 0,
            x2: 0,
            y2: self.height,
            stroke: "#000"
        })
        .style("pointer-events","none");



    /*D3 tip code from http://bl.ocks.org/Caged/6476579*/
    self.tip = d3.tip() // Set up tooltips on hover
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return self.names[d.func_id];
        });
    self.svg.call(self.tip);


    self.color = d3.scale.ordinal().domain(self.funcs)// Manually defined colors. TODO: make automatic
        .range(['#a6cee3','#b2df8a','#fb9a99','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928']);

    self.xAxis = d3.svg.axis().scale(self.x).orient("bottom");

    self.y1s = {}; // Map of processors to d3 ordinal scales
    for(var i = 0; i < self.procs.length; ++i){
        self.y1s[self.procs[i].id] = d3.scale.ordinal();
        self.y1s[self.procs[i].id].domain(self.stacks.slice(0,self.concurrent.maxStacks[self.procs[i].id]))
            .rangeRoundBands([self.y.rangeBand(),0]);
    }

    d3.select("#xAxis")
        .attr("width", self.width + margin.left + margin.right)
        .attr("height",  margin.bottom).append("g")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(self.zoom)
        .attr("width",self.width).append("g")
        .attr("class","x axis")
        .attr("transform","translate(0,0)")
        .call(self.xAxis);


    self.taskcontainer = self.svg.append("g"); // Main view container



    self.svg.append("defs").append("svg:clipPath") // Set up a clip path so tasks don't appear offscreen
        .attr("id", "clip")
        .append("svg:rect")
        .attr("id", "clip-rect")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", self.width)
        .attr("height", self.height);


    



    var supertasks = self.taskcontainer.selectAll(".supertask") // Set up each processor list
        .data(self.procs);

    var tasks = supertasks.enter().append("g")
        .attr("class","g")
        .attr("transform",function(d){
            return "translate(0,"+self.y(d.id)+")";}); // Put each proc in its own g

    supertasks.exit().remove();

    tasks.append("rect") // A box to indicate the range of the processor
        .attr("class","processor")
        .attr("x",-1)
        .attr("y",-1)
        .attr("width",self.width+2)
        .attr("height",self.y.rangeBand()+2) // Extra padding to allow a border
        .style("fill","white")
        .on("mousemove",self.stylusMove);


    tasks.append("text") // Name of the processor
        .attr("class","proc-label")
        .style("text-anchor", "end")
        .attr("x",-10)
        .attr("y",self.y.rangeBand()/2)
        .text(function(d){return d.name + " " + d.id})
        .on("mousemove",null);

    var clipg = tasks.append("g") // Limit the actual task boxes by the clipping window
        .attr("clip-path","url(#clip)");

    self.subtasks = clipg.append("g").attr("class","subtasks");



    var tasks = self.subtasks.selectAll(".task") // Add the actual task boxes
        .data(function (d) {
            return self.timedata.filter(function (e) {
                return d.id == e.proc_id;
            })
        }); // Limit to just this proc
    tasks.enter().append("rect").attr("class", "task")
        .attr("height", function (d) {
            return self.y1s[d.proc_id].rangeBand();
        }) // Use local scale
        .attr("y", function (d) {
            return self.y1s[d.proc_id](d.stack);
        }) // Scale based on concurrency
        .attr("x", function (d) {
            return self.x(d.start);
        })
        .attr("width", function (d) {
            return self.x(d.stop) - self.x(d.start);
        })// Apparently, this isn't associative
        .on('mouseover', self.tip.show)
        .on('mouseout', self.tip.hide)
        .on('mouseup', function (d) {

            var props = d3.select("#properties"); // Properties div

            var nl = "<br/>";
            var output = "Name: " + self.names[d.func_id] + nl +
                "Task ID: " + d.task_id + nl +
                "Function ID: " + d.func_id + nl +
                "Processor: " + d.proc_id + nl +
                "Start: " + Math.round(d.start) + " &mu;s" + nl +
                "Stop: " + Math.round(d.stop) + " &mu;s" + nl +
                "Duration: " + Math.round(d.stop - d.start) + " &mu;s";

            props.html(output); // TODO: Fix this to prevent XSS
        })
        .on("mousemove",self.stylusMove);
    tasks.exit().remove();

}

MainView.prototype.update = function(){
    var self = this;

    if(!self.memory) {
        self.subtasks.selectAll(".task").style("fill", function (d) {
                return self.color(d.func_id);
            });
        //self.subtasks.selectAll(".line").style("stroke","steelblue");
    }
    else{
        self.subtasks.selectAll(".task").style("fill","none");
        //self.subtasks.selectAll(".line").style("stroke","steelblue");
    }
};

MainView.prototype.updateZoom = function(scale,translate){
    var self = this;
    //console.log(translate);
    // Bound the view even when scaled (Note: X axis is reversed and goes from -width to 0)
    var xmov = Math.max(Math.min(translate,0),-self.width*scale + self.width);
    self.zoom.translate([xmov,0]); // Apply the panning movement
    d3.select("#xAxis").select(".x.axis").call(self.xAxis); // Apply the movement to the scaled axis
    self.taskcontainer.selectAll(".subtasks").attr("transform", "translate(" + xmov + ",0)scale(" + scale + ",1)");
};