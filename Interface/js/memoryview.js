
function MemoryView(_instances,_width,_height){
    var self = this;


    var margin = {top: 20, right: 20, bottom: 30, left: 120};
    self.width = _width - margin.left - margin.right;
    self.height = _height - margin.top - margin.bottom;

    self.svg = d3.select("#memory")
        .attr("width", self.width + margin.left + margin.right)
        .attr("height", self.height + margin.top + margin.bottom)
        .append("g").attr("transform","translate("+margin.left+","+margin.top+")")
        .call(mainview.zoom);

    self.svg.append("rect") // Set up an invisible screen that allows zooming anywhere
        .attr("width",self.width)
        .attr("height",self.height)
        .style("fill","none")
        .style("pointer-events","all");
}