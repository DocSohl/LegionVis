/**
 * Created by Phil on 12/2/2015.
 */
function SummaryView(_timedata, _names, _concurrent,_width,_height) {
    var self = this;


    self.timedata = _timedata;
    self.names = _names;
    self.concurrent = _concurrent;
    var margin = {top: 20, right: 20, bottom: 30, left: 120};
    self.width = _width - margin.left - margin.right;
    self.height = _height - margin.top - margin.bottom;
    var maxtime = d3.max(self.timedata,function(d){return d.stop;});
    self.x = d3.scale.linear()
        .domain([0,maxtime])
        .range([0,self.width]);
    var numsamples = 100;
    var stepsize = maxtime/numsamples;
    var counthist = [];
    for(var t = stepsize/2; t < maxtime; t+=stepsize){
        var tasks = self.concurrent.atTime(t);
        var counts = {time:t,total:0};
        mainview.funcs.forEach(function(d){
            counts[d] = 0;
        });
        tasks.forEach(function(d){
            counts[d.func_id]+=1;
            counts.total+=1;
        });
        counthist.push(counts);
    }
    var maxcount = d3.max(counthist, function(d){return d.total;});
    console.log(maxcount);
    self.svg = d3.select("#summary")
        .attr("width", self.width + margin.left + margin.right)
        .attr("height", self.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    self.xAxis = d3.svg.axis().scale(self.x).orient("bottom");

    self.svg.append("g")
        .attr("class","x axis")
        .attr("transform","translate(0,"+self.height+")")
        .call(self.xAxis);
}