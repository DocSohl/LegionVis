
var histview, mainview, graphview, summaryview;


function Concurrency(data){
    this.rawData = data;
    this.parsedData = {};
    this.dataIndex = {};
    this.maxStacks = {};
    this.rawData.sort(function(a,b){return a.start - b.start;});
    // Initial Parse
    var started = [];
    for(var i = 0; i < this.rawData.length; ++i){
        var cur = this.rawData[i];
        cur.duration = Math.round(cur.stop - cur.start);
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
        this.dataIndex[cur.task_id] = i;
        started = started.slice(0);
        for(var j = 0; j < started.length; ++j){
            if(this.parsedData.hasOwnProperty(started[j].task_id) && !(cur in this.parsedData[started[j].task_id])){
                //console.log("added");
                this.parsedData[started[j].task_id].push(cur);
            }
        }
        started.push(cur);
    }

    this.findClosest = function(t){
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
            if(i == 0) return null;
            closest = this.rawData[--i];
        }
        if(closest.start > t || closest.stop < t) closest = this.broadSearch(t);
        return closest
    }

    this.atTime = function(t){
        var closest = this.findClosest(t);
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

    this.integrate = function(t, dt){
        var closest = this.findClosest(t);
        if(closest == null) return [];
        var within = [];
        for(var i = this.dataIndex[closest.task_id]; i < this.rawData.length; ++i){
            if(this.rawData[i].start > t + dt){
                break;
            }
            if(this.rawData[i].stop > t) within.push(this.rawData[i]);
        }
        var output = [];
        for(var i = 0; i < within.length; ++i){
            var concurrent = this.parsedData[within[i].task_id];
            if(within[i].start <= t + dt && within[i].stop >= t) {
                var existing = false;
                for(var k = 0; k < output.length; ++k) {
                    if(output[k].task_id == within[i].task_id){
                        existing = true;
                        break;
                    }
                }
                if(!existing) output.push(within[i]);
            }
            for(var j = 0; j < concurrent.length; ++j){
                if(concurrent[j].start <= t + dt && concurrent[j].stop >= t) {
                    var existing = false;
                    for(var k = 0; k < output.length; ++k) {
                        if(output[k].task_id == concurrent[j].task_id){
                            existing = true;
                            break;
                        }
                    }
                    if(!existing) output.push(concurrent[j]);
                }
            }
        }
        return output;
    };

    return this;
}

/**
 * Loads data, prepares and populates all D3 components. Only run once
 */
function Init(){
    d3.json("tasks.json",function(data){ // Load all task information from the server
        var timedata = data[0]; // An array of task objects
        var names = data[1]; // A map of function IDs to task names
        var instances = data[2];
        var concurrent = new Concurrency(timedata);
        var w = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            x = w.innerWidth || e.clientWidth || g.clientWidth,
            y = (w.innerHeight|| e.clientHeight|| g.clientHeight) - 50 - 120;

        d3.select("#summarycontainer").style("width",0.72*x+"px");
        d3.select("#summarycontainer").style("height",y+"px");
        d3.select("#timelinecontainer").style("width",0.72*x+"px");
        d3.select("#timelinecontainer").style("height",0.7*y+"px");
        mainview = new MainView(timedata, names, concurrent, instances, 0.7 * x, 0.7 * y);
        mainview.update();

        summaryview = new SummaryView(timedata, names, concurrent, 0.7 * x, 0.2 * y);

        histview = new HistogramView(timedata, 0.2 * x, 0.5 * y);
        d3.select("#histcount").on("change",function(){
            histview.update("Count");
        });
        d3.select("#histtime").on("change",function(){
            histview.update("Time");
        });
        d3.select("#histcursor").on("change",function(){
            histview.histCursorSelect = true;
        });

        histview.update("Count"); // Set up the histogram

        //Prepare the Graph view
        d3.select("#graphcontainer").style("width",0.72*x+"px");
        graphview = new GraphView(timedata, 0.7*x, 0.9*y);

    });
}

function resizeViews(){
    d3.select("#timeline").select("g").remove();
    d3.select("#graph").select("g").remove();
    d3.select("#summary").select("g").remove();
    d3.select("#hist").select("g").remove();
    d3.select("#legend").select("g").remove();



    Init();
}

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

function switchViews(viewname){
    var time = d3.select("#timelinecontainer");
    var summ = d3.select("#summarycontainer");
    var grap = d3.select("#graphcontainer");
    var memo = d3.select("#memorycontainer");
    time.style("display","none");
    summ.style("display","none");
    grap.style("display","none");
    memo.style("display","none");
    if(viewname == "timeline" || viewname == "memory"){
        time.style("display","block");
        summ.style("display","block");
        mainview.memory = false;
        if(viewname == "memory") mainview.memory = true;
        mainview.update();
    }
    if(viewname == "graph"){
        grap.style("display","block");
    }
}

Init(); // Set up the page
