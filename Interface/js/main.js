
var svg, xAxis, taskcontainer, zoom, width, height, names, timedata, color, histview, mainview, histCursorSelect;


function Concurrency(data){
    this.rawData = data;
    this.parsedData = {};
    this.maxStacks = {};
    this.rawData.sort(function(a,b){return a.start - b.start;});
    // Initial Parse
    var started = [];
    for(var i = 0; i < this.rawData.length; ++i){
        var cur = this.rawData[i];
        var proc = cur.proc_id;
        if(this.maxStacks[proc] == undefined) this.maxStacks[proc] = 1;
        var count = 1;
        for(var j = 0; j < started.length; ++j){
            if(started[j].stop < cur.start){
                started.splice(j--,1);
            }
            else if(started[j].proc_id == proc) count++;
        }
        cur.stack = count;
        this.maxStacks[proc] = Math.max(this.maxStacks[proc],count);
        this.parsedData[cur.task_id] = started.slice(0);
        started = started.slice(0);
        started.push(cur);
    }


    this.atTime = function(t){
        var high = this.rawData.length - 1;
        var low = 0;
        while(high - low > 1){
            var mid = Math.floor((high + low) / 2);
            if(this.rawData[mid].start < t) low = mid;
            else high = mid;
        }
        var closest = this.rawData[high];
        var i = high;
        if(t - this.rawData[low].start <= this.rawData[high].start - t){
            closest = this.rawData[low];
            i = low;
        }
        if(closest.start > t){
            if(i == 0) return [];
            closest = this.rawData[--i];
        }
        if(closest.start > t || closest.stop < t) closest = this.broadSearch(t);
        if(closest == null) return [];
        var concurrent = this.parsedData[closest.task_id];
        var output = [closest];
        for(var j = 0; j < concurrent.length; ++j){
            if(concurrent[j].start <= t && concurrent[j].stop >= t) output.push(concurrent[j])
        }
        return output;
    };

    this.broadSearch = function(t){
        for(var i = 0; i < this.rawData.length; ++i){
            if(this.rawData[i].start <= t && this.rawData[i].stop >= t) return this.rawData[i];
        }
        return null;
    };
    return this;
}

/**
 * Loads data, prepares and populates all D3 components. Only run once
 */
function Init(){
    d3.json("tasks.json",function(data){ // Load all task information from the server
        histCursorSelect = false;
        timedata = data[0]; // An array of task objects
        names = data[1]; // A map of function IDs to task names
        var concurrent = Concurrency(timedata);

        mainview = new MainView(timedata, names, concurrent);
        mainview.update();

        histview = new HistogramView(timedata);
        d3.select("#histcount").on("change",function(){
            histview.update("Count");
            histCursorSelect = false;
        });
        d3.select("#histtime").on("change",function(){
            histview.update("Time");
            histCursorSelect = false;
        });
        d3.select("#histcursor").on("change",function(){
            histCursorSelect = true;
        });

        histview.update("Count"); // Set up the histogram

    });
}

/**
 * Event handler for the main window zoom behavior
 */
function zoomed() {
    // Bound the view even when scaled (Note: X axis is reversed and goes from -width to 0)
    xmov = Math.max(Math.min(d3.event.translate[0],0),-width*d3.event.scale + width);
    zoom.translate([xmov,0]); // Apply the panning movement
    svg.select(".x.axis").call(xAxis); // Apply the movement to the scaled axis
    taskcontainer.selectAll(".subtasks").attr("transform", "translate(" + xmov + ",0)scale(" + d3.event.scale + ",1)");
}

/**
 * Event handler for clicking on the main window
 * @param d Object clicked on
 */
function taskClicked(d){
    var props = d3.select("#properties"); // Properties div

    var nl = "<br/>"; // The newline break
    var output = "Name: " + names[d.func_id] + nl +
            "Task ID: " + d.task_id + nl +
            "Function ID: " + d.func_id + nl +
            "Processor: " + d.proc_id + nl +
            "Start: " + Math.round(d.start) + " &mu;s" + nl +
            "Stop: " + Math.round(d.stop) + " &mu;s" + nl +
            "Duration: " + Math.round(d.stop - d.start) + " &mu;s";

    props.html(output); // TODO: Fix this to prevent XSS
}

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

Init(); // Set up the page
