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
    self.x = d3.scale.linear()
        .domain([0,d3.max(self.timedata,function(d){return d.stop;})])
        .range([0,self.width]);

    self.svg = d3.select("#summary")
        .attr("width", self.width + margin.left + margin.right)
        .attr("height", self.height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
}