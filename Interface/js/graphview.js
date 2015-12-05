

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
        .call(self.zoom);
        //.on("mousedown.zoom", null)
        //.on("touchstart.zoom", null)
        //.on("touchmove.zoom", null)
        //.on("touchend.zoom", null);

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

    self.tree = d3.layout.tree()
        .size([self.height,self.width - 160]);

    self.diagonal = d3.svg.diagonal()
        .projection(function(d){return [d.y, d.x]});

    var root;
    self.timedata.forEach(function(d){
        if(d.spawn != null){
            var none = true;
            for(var i = 0; i < self.timedata.length; ++i){
                if(d.spawn == self.timedata[i].task_id) {
                    if(!self.timedata[i].hasOwnProperty("children")) self.timedata[i].children = [];
                    self.timedata[i].children.push(d);
                    none = false;
                    break;
                }
            }
            if(none){
                root = d;
            }
        }
        else{
            root = d;
        }
    });

    if(root == undefined) return;

    self.nodes = self.tree.nodes(root);
    self.links = self.tree.links(self.nodes);

    var link = self.svg.selectAll(".link").data(self.links)
        .enter().append("path")
        .attr("class","link")
        .attr("d",self.diagonal);

    var node = self.svg.selectAll(".node")
        .data(self.nodes)
        .enter()
        .append("g")
        .attr("class","node")
        .attr("transform",function(d){return "translate(" + d.y + "," + d.x + ")";})
        .append("circle")
        .attr("r",5)
        .style("fill",function(d){return mainview.color(d.func_id)})
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

};