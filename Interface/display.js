var timedata = [
    {'task_id': 1, 'proc_id': 1, 'create': 6689.957, 'stop': 7587.202, 'start': 6724.808, 'func_id': 7, 'ready': 6690.146},
    {'task_id': 13, 'proc_id': 1, 'create': 8929.129, 'stop': 9115.885, 'start': 8943.877, 'func_id': 8, 'ready': 8929.34},
    {'task_id': 16, 'proc_id': 2, 'create': 10401.043, 'stop': 10557.656, 'start': 10410.991, 'func_id': 8, 'ready': 10401.288},
    {'task_id': 17, 'proc_id': 3, 'create': 10786.882, 'stop': 10972.508, 'start': 10807.476, 'func_id': 8, 'ready': 10787.101},
    {'task_id': 20, 'proc_id': 4, 'create': 11342.537, 'stop': 11477.228, 'start': 11351.355, 'func_id': 8, 'ready': 11342.754},
    {'task_id': 27, 'proc_id': 1, 'create': 15486.277, 'stop': 15779.435, 'start': 15496.618, 'func_id': 9, 'ready': 15486.92},
    {'task_id': 28, 'proc_id': 2, 'create': 16371.327, 'stop': 16652.097, 'start': 16379.852, 'func_id': 9, 'ready': 16371.922},
    {'task_id': 30, 'proc_id': 3, 'create': 16999.763, 'stop': 17373.699, 'start': 17031.228, 'func_id': 9, 'ready': 17000.37},
    {'task_id': 32, 'proc_id': 4, 'create': 17701.449, 'stop': 17992.149, 'start': 17709.932, 'func_id': 9, 'ready': 17701.999},
    {'task_id': 5, 'proc_id': 1, 'create': 21071.925, 'stop': 22917.987, 'start': 21983.541, 'func_id': 10, 'ready': 21930.39}
];

var svg,xAxis;


function Update(){
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = d3.scale.linear().domain([0,d3.max(timedata,function(d){return d.stop;})]).range([0,width]);
    var y0 = d3.scale.ordinal().rangeRoundBands([0,height],0.1);
    var y1 = d3.scale.ordinal();

    svg = d3.select("#timeline")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var funcs = d3.set(timedata.map(function(d){return d.func_id;})).values();
    var procs = d3.set(timedata.map(function(d){return d.proc_id;})).values();

    var color = d3.scale.ordinal().domain(funcs)
        .range(['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928']);

    xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y0).orient("left");

    y0.domain(timedata.map(function(d){return d.proc_id;}));
    y1.domain(funcs).rangeRoundBands([0,y0.rangeBand()]);

    svg.append("g")
        .attr("class","x axis")
        .attr("transform","translate(0,"+height+")")
        .call(xAxis);

    svg.append("g")
        .attr("class","y axis")
        .call(yAxis);

    /*TODO: Make divisions more obvious with horizontal lines*/

    var tasks = svg.selectAll(".task")
        .data(procs)
        .enter().append("g")
        .attr("class","g")
        .attr("transform",function(d){return "translate(0,"+y0(d)+")";});

    /*D3 tip code from http://bl.ocks.org/Caged/6476579 .
     Feel free to fiddle with this.*/
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>Task_ID:</strong> <span style='color:red'>" + d.task_id + "</span>";
        });
    svg.call(tip);

    tasks.selectAll("rect")
        .data(function(d){return timedata.filter(function(e){return d== e.proc_id;})})
        .enter().append("rect")
        .attr("height",y1.rangeBand())
        .attr("y",function(d){return y1(d.func_id);})
        .attr("x",function(d){return x(d.start);})
        .attr("width",function(d){return x(d.stop) - x(d.start);})
        .style("fill",function(d){return color(d.func_id);})
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    var legend = svg.selectAll(".legend")
        .data(funcs.slice().reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });

    var zoom = d3.behavior.zoom()
        .x(x)
        .on("zoom", zoomed);
    svg.call(zoom);
    /*TODO: Get the zoom to work outside of the X axis.*/
}


function zoomed() {
    svg.select(".x.axis").call(xAxis);
    /*TODO: Get it to scale everything else.*/
    console.log(d3.event.scale );
}

/*TODO: add dragging*/

Update();