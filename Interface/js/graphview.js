

function GraphView(_timedata,_width,_height){
    var self = this;
    self.timedata = _timedata;

    var margin = {top: 20, right: 20, bottom: 30, left: 120};
    self.width = _width - margin.left - margin.right;
    self.height = _height - margin.top - margin.bottom;

    self.zoom = d3.behavior.zoom()
        .scaleExtent([0.1,10])
        .on("zoom",function(){
            self.svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        });


    self.svg = d3.select("#graph")
        .attr("width", self.width + margin.left + margin.right)
        .attr("height", self.height + margin.top + margin.bottom)
        .append("g").attr("transform","translate("+margin.left+","+margin.top+")")
        .call(self.zoom)
        .on("mousedown.zoom", null)
        .on("touchstart.zoom", null)
        .on("touchmove.zoom", null)
        .on("touchend.zoom", null);

    var rect = self.svg.append("rect")
        .attr("width", self.width)
        .attr("height", self.height)
        .style("fill", "none")
        .style("pointer-events", "all");

    self.tip = d3.tip() // Set up tooltips on hover
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>Func_ID:</strong> <span style='color:red'>" + mainview.names[d.func_id] + "</span>";
        });
    self.svg.call(self.tip);

    self.svg = self.svg.append("g");

    var maxtime = d3.max(self.timedata,function(d){return d.stop;});

    self.radius = d3.scale.pow().exponent(0.5)
        .domain([0,maxtime])
        .range([5,50]);

    if(!("spawn" in self.timedata[0])){
        self.svg.append("text")
            .attr("x",50)
            .attr("y",100)
            .text("The graph view does not currently support your file. We apologize for the inconvenience.");
        self.active = false;
            return;
    }
    self.active = true;

    self.force = d3.layout.force()
        .charge(-120)
        .size([self.width,self.height])
        .linkDistance(function(d){return (self.radius(d.source.duration) + self.radius(d.target.duration)) * 1.5;});

    self.links = [];
    self.timedata.forEach(function(d){
        if(d.spawn != null){
            for(var i = 0; i < self.timedata.length; ++i){
                if(d.spawn == self.timedata[i].task_id) {
                    self.links.push({"source": self.timedata[i], "target": d});
                    break;
                }
            }
        }
    });

    self.force.nodes(self.timedata)
        .links(self.links)
        .start();

    var link = self.svg.selectAll(".link").data(self.links)
        .enter().append("line")
        .attr("class","link");

    var node = self.svg.selectAll(".node")
        .data(self.timedata)
        .enter().append("circle")
        .attr("class","node")
        .attr("r",function(d){return self.radius(d.duration);})
        .style("fill",function(d){return mainview.color(d.func_id)})
        .call(self.force.drag)
        .on('mouseover', self.tip.show)
        .on('mouseout', self.tip.hide)
        .on('mouseup',function(d){
            var props = d3.select("#properties"); // Properties div

            var nl = "<br/>";
            var output = "Name: " + mainview.names[d.func_id] + nl +
                "Task ID: " + d.task_id + nl +
                "Function ID: " + d.func_id + nl +
                "Processor: " + d.proc_id + nl +
                "Start: " + Math.round(d.start) + " &mu;s" + nl +
                "Stop: " + Math.round(d.stop) + " &mu;s" + nl +
                "Duration: " + Math.round(d.stop - d.start) + " &mu;s";

            props.html(output); // TODO: Fix this to prevent XSS
        });

    node.append("title")
        .text(function(d){return d.task_id;});

    self.force.on("tick", function(e){
        self.timedata.forEach(function(d){
            d.x += (d.start/maxtime - 0.5) * e.alpha * 40;
        });

        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });


        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    });

};