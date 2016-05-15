/**
 * Created by Phil_ on 5/13/2016.
 */
function GetConcurrencyData(rawData,callback) {
    var parsedData = {};
    var dataIndex = {};
    var maxStacks = {};
    // Initial Parse
    var started = [];
    for (var i = 0; i < rawData.length; ++i) {
        var cur = rawData[i];
        cur.duration = Math.round(cur.stop - cur.start);
        var proc = cur.proc_id;
        if (maxStacks[proc] == undefined) maxStacks[proc] = 1;
        var count = 1;
        for (var j = 0; j < started.length; ++j) {
            if (started[j].stop < cur.start) {
                started.splice(j--, 1);
            }
            else if (started[j].proc_id == proc) count++;
        }
        cur.stack = count;
        maxStacks[proc] = Math.max(maxStacks[proc], count);
        parsedData[cur.task_id] = started.slice(0);
        dataIndex[cur.task_id] = i;
        started = started.slice(0);
        for (var j = 0; j < started.length; ++j) {
            if (parsedData.hasOwnProperty(started[j].task_id) && !(cur in parsedData[started[j].task_id])) {
                console.log("added");
                parsedData[started[j].task_id].push(cur);
            }
        }
        started.push(cur);
    }
    var concurrencyData = {
        parsedData:parsedData,
        dataIndex:dataIndex,
        maxStacks:maxStacks
    };
    callback(null, concurrencyData)
}
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined'){
    module.exports = GetConcurrencyData;
}
else{
    window.GetConcurrencyData = GetConcurrencyData;
}