/**
 * Created by Phil on 11/30/2015.
 */
function MainView(_timedata, _names, _concurrent, _instances, _width, _height){
    var self = this;

    self.timedata = _timedata;
    self.names = _names;
    self.concurrent = _concurrent;
    self.instances = _instances;
    self.memory = false;
    self.annotations = [];
    self.funcs = d3.set(self.timedata.map(function(d){return d.func_id;})).values(); // A list of function IDs
    self.stacks = d3.set(self.timedata.map(function(d){return d.stack;})).values(); // A list of possible concurrencies
    self.procs = []; // A list of processor IDs
    self.timedata.forEach(function(d){
        var obj = {id:d.proc_id, name: d.proc_kind};
        var inProcs = false;
        for(var i = 0; i < self.procs.length; ++i) {
            if (obj.id == self.procs[i].id){
                inProcs = true;
                break;
            }
        }
        if(!inProcs) self.procs.push(obj);
    });

    var margin = {top: 20, right: 20, bottom: 30, left: 90};
    if(parseInt(self.timedata[0].proc_id) > 100) margin.left += 5;

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
    self.y = d3.scale.ordinal().domain(self.timedata.map(function(d){return d.proc_id;})).rangeRoundBands([0,self.height],0.1);


    self.memorylines = {};
    self.timedata.forEach(function(d){
        if(!(d.proc_id in self.memorylines)){
            self.memorylines[d.proc_id] = [{x:0,y:0, proc:d.proc_id}];
        }
    });
    //this.instances.sort(function(a,b){return a.create - b.create;});
    var events = [];
    for(var i = 0; i < self.instances.length; ++i){
        events.push({key:self.instances[i].create,  val:self.instances[i], type:true});
        events.push({key:self.instances[i].destroy, val:self.instances[i], type:false});
    }
    events.sort(function(a,b){return a.key - b.key;});
    var maxmem = 0;
    for(var i = 0; i < events.length; ++i){
        var event = events[i];
        var proc = self.memorylines[event.val.proc_id];
        var last = proc[proc.length-1].y;
        proc.push({x:event.key, y:last, proc:event.val.proc_id});
        proc.push({x:event.key, y:last + (event.val.size * (event.type ? 1 : -1)), proc:event.val.proc_id});
        maxmem = Math.max(maxmem,proc[proc.length-1].y);
    }

    for(var key in self.memorylines){
        if(self.memorylines.hasOwnProperty(key)){
            self.memorylines[key].push({x:maxtime,y:0, proc:key});
        }
    }


    self.memy = d3.scale.linear().domain([0,maxmem*1.1]).range([self.y.rangeBand(),0]);

    self.line = d3.svg.line()
        .x(function(d){return self.x(d.x);})
        .y(function(d){return self.memy(d.y);});



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
            return "<strong>Func_ID:</strong> <span style='color:red'>" + self.names[d.func_id] + "</span>";
        });
    self.svg.call(self.tip);
    self.svg.on("mouseup",function(){
        var xVal = d3.mouse(this)[0];
        var stuff = self.x.invert(xVal);
        var y = 0;
    });


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


    var svglegend = d3.select("#legend") // Set up the legend in a separate SVG
        .attr("width",400)
        .attr("height",20*self.funcs.length+30).append("g");

    svglegend.append("text").attr("y",20).attr("x",50).text("Task Name"); // Legend title

    var legend = svglegend.selectAll(".legend") // Generate legend based on entries
        .data(self.funcs.slice())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(50," + ((i+1) * 20 + 10) + ")"; });

    legend.append("rect") // Box to indicate color
        .attr("x", 0)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", self.color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function(d) { return self.names[d]; });



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
        .on("mousemove",function(){
        d3.select("#stylus")
            .attr("x1",d3.mouse(this)[0])
            .attr("x2",d3.mouse(this)[0])
            .moveToFront();
        var converted = self.x.invert(d3.mouse(this)[0]);
        if(histview.histCursorSelect) {
            histview.update("Cursor",self.concurrent.atTime(converted));
        }
        else{

        }
    });


    tasks.append("text") // Name of the processor
        .attr("class","proc-label")
        .style("text-anchor", "end")
        .attr("x",-10)
        .attr("y",self.y.rangeBand()/2)
        .text(function(d){return d.name + " 0x" + parseInt(d.id).toString(16).toUpperCase();})
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
        });
    tasks.exit().remove();

    self.subtasks.append("path")
        .datum(function(d){
            return self.memorylines[d.id];
        })
        .attr("class","line")
        .attr("d",self.line);
}

MainView.prototype.update = function(){
    var self = this;

    if(!self.memory) {
        self.subtasks.selectAll(".task").style("fill", function (d) {
                return self.color(d.func_id);
            });
        self.subtasks.selectAll(".line").style("stroke","steelblue");
    }
    else{
        self.subtasks.selectAll(".task").style("fill","none");
        self.subtasks.selectAll(".line").style("stroke","steelblue");
    }
};
MainView.prototype.updateZoom = function(scale,translate){
    var self = this;
    //console.log(translate);
    // Bound the view even when scaled (Note: X axis is reversed and goes from -width to 0)
    var xmov = Math.max(Math.min(translate,0),-self.width*scale + self.width);
    self.zoom.translate([xmov,0]); // Apply the panning movement
    d3.select("#xAxis").select(".x.axis").call(self.xAxis); // Apply the movement to the scaled axis
    self.subtasks.selectAll('.line').attr('d',self.line).attr("transform", "translate(" + (-xmov/scale) + ",0)scale(" + 1/scale + ",1)"); // This is really horrible
    self.taskcontainer.selectAll(".subtasks").attr("transform", "translate(" + xmov + ",0)scale(" + scale + ",1)");
};