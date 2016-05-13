/**
 * Created by Phil on 4/28/2016.
 */

(function(){
    var prefix = '\\[([0-9]+) - ([0-9a-f]+)] \\{\\w+}\\{legion_prof}: ';

    var processor_kinds = {
        1: 'GPU',
        2: 'CPU',
        3: 'Utility',
        4: 'I/O'
    };

    var procPretty = function(proc){
        while(proc.length <= 6){
            proc = "0" + proc;
        }
        var node = parseInt(proc.slice(1,5),16);
        proc = parseInt(proc.slice(5,proc.length),16);
        return "Node: " + node + " Processor: " + proc;
    };

    var analyzeLegionData = function(data,callback){
        var tasks = [];
        var taskmap = {};
        var tidnames = {};
        var names = {};
        var tid2vid = {};
        var procs = {};
        var lines = data.split("\n");
        lines.forEach(function(line){
            var full_regex = new RegExp(prefix + 'Prof Task Info ([0-9]+) ([0-9]+) ([a-f0-9]+) ([0-9]+) ([0-9]+) ([0-9]+) ([0-9]+)( ([0-9]+))?');
            var info = full_regex.exec(line);
            if(info != null){
                var task = {
                    "task_id":Number(info[3]),
                    "func_id":Number(info[4]),
                    "proc_id":info[5],
                    "create":Number(info[6])/1000,
                    "ready":Number(info[7])/1000,
                    "start":Number(info[8])/1000,
                    "stop":Number(info[9])/1000,
                    "spawn":info[10]!= null ? Number(info[10]) : null
                };
                taskmap[task["task_id"]] = task;
                tasks.push(task);
            }
            full_regex = new RegExp(prefix + "Prof Task Kind ([0-9]+) ([a-zA-Z0-9_<>.]+)");
            info = full_regex.exec(line);
            if(info != null){
                tidnames[Number(info[3])] = info[4];
            }
            full_regex = new RegExp(prefix + "Prof Task Variant ([0-9]+) ([0-9]+) ([a-zA-Z0-9_<>.]+)");
            info = full_regex.exec(line);
            if(info != null){
                tid2vid[Number(info[3])] = info[4];
            }
            full_regex = new RegExp(prefix + "Prof Proc Desc ([a-f0-9]+) ([0-9]+)");
            info = full_regex.exec(line);
            if(info != null) {
                var kind = Number(info[4]);
                procs[info[3]] = processor_kinds[kind];
            }
        });
        Object.keys(tidnames).forEach(function(n) {
            names[tid2vid[n]] = tidnames[n];
        });
        var proclist = [];
        Object.keys(procs).forEach(function(proc){
            proclist.push({
                'num':Number(proc),
                'id':procPretty(proc),
                'name':procs[proc]
            });
        });
        proclist.sort(function(a,b){
           return a['num'] - b['num'];
        });
        tasks.forEach(function(task){
            task["proc_kind"] = procs[task["proc_id"]];
            task["proc_id"] = procPretty(task["proc_id"])
        });
        tasks.sort(function (a, b) {
            return a.start - b.start;
        });
        var retval = {
            "tasks":tasks,
            "names":names,
            "proclist":proclist
        };
        callback(null,retval);
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined'){
        module.exports = analyzeLegionData;
    }
    else{
        window.analyzeLegionData = analyzeLegionData;
    }
})();
