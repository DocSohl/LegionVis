
var svg, xAxis, taskcontainer, zoom, width, height, names, timedata, color, histview, mainview;

/**
 * Scan the time series task data and modify it with concurrency numbers
 * @param {array} data Array of task objects
 * @returns {dictionary} Mapping of processors to maximum concurrency
 */
function scanData(data){
    data.sort(function(a,b){return a.start - b.start;});
    var ends = {};
    var procs = [];
    var maxes = {};
    for(var i = 0; i < data.length; ++i){
        var proc = data[i].proc_id;
        if(ends[proc] == undefined){
            ends[proc] = [];
            procs.push(proc);
            maxes[proc] = 0;
        }
        var maxval = 0;
        for(var j = 0; j < ends[proc].length; ++j){
            if(ends[proc][j].stop < data[i].start){
                ends[proc].splice(j--,1);
                continue;
            }
            maxval = Math.max(maxval,ends[proc][j].stack);
        }
        data[i].stack = ++maxval;
        maxes[proc] = Math.max(maxes[proc],maxval);
        ends[proc].push({"stop":data[i].stop,"stack":maxval});
    }
    procs.sort();
    var output = [];
    for(var i = 0; i < procs.length; ++i){
        output.push(maxes[procs]);
    }
    return maxes;
}

/**
 * Loads data, prepares and populates all D3 components. Only run once
 */
function Init(){
    d3.json("tasks.json",function(data){ // Load all task information from the server
        timedata = data[0]; // An array of task objects
        names = data[1]; // A map of function IDs to task names
        var maxStacks = scanData(timedata); // Scan through the data to find concurrencies

        mainview = new MainView(timedata, names, maxStacks);
        mainview.update();

        histview = new HistogramView(timedata);
        d3.select("#histcount").on("change",function(){
            histview.update("Count");
        });
        d3.select("#histtime").on("change",function(){
            histview.update("Time");
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
 * Even handler for clicking on the main window
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

Init(); // Set up the page
