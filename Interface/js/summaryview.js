/**
 * Created by Phil on 12/2/2015.
 */
function SummaryView(_timedata, _names, _concurrent,_width,_height) {
    var self = this;


    self.timedata = _timedata;
    self.names = _names;
    self.concurrent = _concurrent;
    var margin = {top: 10,  right: 50, bottom: 20, left: 190};
    self.width = _width - margin.left - margin.right;
    self.height = _height - margin.top - margin.bottom;
    var maxtime = d3.max(self.timedata,function(d){return d.stop;});

    var numsamples = 200;
    var stepsize = maxtime/numsamples;
    var counthist = [];
    for(var t = 0; t < maxtime; t+=stepsize){

        var counts = {mintime: t, maxtime: t + stepsize, total: 0};

        mainview.funcs.forEach(function (d) {
            counts[d] = 0;
        });
        var tasks = self.concurrent.integrate(t,stepsize);
        tasks.forEach(function (d) {
            counts[d.func_id] += 1;
            counts.total += 1;
        });

        var y0 = 0;
        counts.funcs = mainview.funcs.map(function (func_id) {
            return {func_id: func_id, y0: y0, y1: y0 += counts[func_id]};
        });
        counthist.push(counts);
    }
    var maxcount = d3.max(counthist, function(d){return d.total;});
    self.x = d3.scale.linear()
        .domain([0,maxtime])
        .range([0,self.width]);
    self.y = d3.scale.linear()
        .domain([0,maxcount])
        .range([self.height,0]);
    self.svg = d3.select("#summary")
        .attr("width", self.width + margin.left + margin.right)
        .attr("height", self.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    self.xAxis = d3.svg.axis().scale(self.x).orient("bottom");
    self.yAxis = d3.svg.axis().scale(self.y).ticks(5).orient("left");
    self.svg.append("g")
        .attr("class","x axis")
        .attr("transform","translate(0,"+self.height+")")
        .call(self.xAxis);
    self.svg.append("g")
        .attr("class","y axis")
        .attr("transform","translate(0,0)")
        .call(self.yAxis);

    var times = self.svg.selectAll(".times")
        .data(counthist)
        .enter().append("g")
        .attr("class", "g")
        .attr("transform", function(d) { return "translate(" + self.x(d.mintime) + ",0)"; });
    var timewidth = self.x(counthist[0].maxtime) - self.x(counthist[0].mintime);
    times.selectAll("rect")
        .data(function(d) { return d.funcs; })
        .enter().append("rect")
        .attr("width", timewidth)
        .attr("y", function(d) { return self.y(d.y1); })
        .attr("height", function(d) { return self.y(d.y0) - self.y(d.y1); })
        .style("fill", function(d) { return mainview.color(d.func_id); });
    self.brush = d3.svg.brush()
        .x(self.x)
        .on("brush", function() {
            var extent = self.brush.extent();
            var width = extent[1] - extent[0];
            var scale = maxtime/width;
            var min = maxtime/40;
            if(width < min) {
                var padding = ( min - width )/2;
                if(padding > extent[0]){
                    var extra = padding - extent[0];
                    extent[0] = 0;
                    extent[1] += (padding+extra);
                }
                else if(padding+ extent[1] > maxtime){
                    var extra = padding- (maxtime - extent[1]);
                    extent[0] -=(padding+extra);
                    extent[1] = maxtime;
                }
                else {
                    extent[0] -= padding;
                    extent[1] += padding;
                }
                self.brush.extent(extent);
                d3.select(".x.brush").call(self.brush);
            }
            var translate = -1*self.x(self.brush.extent()[0])*scale;
            mainview.updateZoom(scale,translate);
            mainview.x.domain(self.brush.extent());
            mainview.svg.select(".x.axis").call(mainview.xAxis);

        });
    self.svg.append("g")
        .attr("class", "x brush")
        .call(self.brush)
        .selectAll("rect")
        .attr("y", 0)
        .attr("height", self.height);
}

SummaryView.prototype.updateBrush = function(){
    var self = this;
    self.brush.extent(mainview.x.domain());
    self.svg.select(".x.brush").call(self.brush);
};