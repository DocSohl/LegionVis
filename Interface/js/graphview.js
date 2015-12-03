

function GraphView(_timedata,_width,_height){
    var self = this;
    self.timedata = _timedata;

    var margin = {top: 20, right: 20, bottom: 30, left: 120};
    self.width = _width - margin.left - margin.right;
    self.height = _height - margin.top - margin.bottom;

    self.svg = d3.select("#graph").attr("width",self.width).attr("height",self.height);

    self.radius = d3.scale.pow().exponent(0.5)
        .domain([0,d3.max(self.timedata,function(d){return d.stop;})])
        .range([5,100]);

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
        .linkDistance(30)
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
        .call(self.force.drag);

    node.append("title")
        .text(function(d){return mainview.names[d.func_id];});

    self.force.on("tick", function(){
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });


        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    });

};