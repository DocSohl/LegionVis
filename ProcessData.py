from __future__ import division
import math
import re

prefix = r'\[(?P<node>[0-9]+) - (?P<thread>[0-9a-f]+)\] \{\w+\}\{legion_prof\}: '

processor_kinds = {
    1 : 'GPU',
    2 : 'CPU',
    3 : 'Utility',
    4 : 'I/O',
}

def procPretty(proc):
    h = hex(long(proc))
    node = str(int(h[3:7],16))
    proc = str(int(h[7:-1],16))
    return "Node: %s Processor: %s" % (node,proc)

def analyze(data):
    tasks = []
    taskmap = {}
    tidnames = {}
    names = {}
    tid2vid = {}
    procs = {}
    for line in data:
        match = re.compile(prefix + r'Prof Task Info (?P<tid>[0-9]+) (?P<fid>[0-9]+) (?P<pid>[a-f0-9]+) (?P<create>[0-9]+) (?P<ready>[0-9]+) (?P<start>[0-9]+) (?P<stop>[0-9]+)( (?P<spawn>[0-9]+))?').match(line)
        if match is not None:
            tasks.append({
                "task_id" : long(match.group('tid')),
                "func_id" : int(match.group('fid')),
                "proc_id" : str(int(match.group('pid'), 16)),
                "create" : long(match.group('create'))/1000,
                "ready" : long(match.group('ready'))/1000,
                "start" : long(match.group('start'))/1000,
                "stop" : long(match.group('stop'))/1000,
                "spawn" : None
            })
            if match.group('spawn') is not None:
                tasks[-1]["spawn"] = int(match.group('spawn'))            
            taskmap[tasks[-1]["task_id"]] = tasks[-1]
        match = re.compile(prefix + r'Prof Task Kind (?P<tid>[0-9]+) (?P<name>[a-zA-Z0-9_<>.]+)').match(line)
        if match is not None:
            tidnames[int(match.group('tid'))] = match.group('name')
	match = re.compile(prefix + r'Prof Task Variant (?P<tid>[0-9]+) (?P<vid>[0-9]+) (?P<name>[a-zA-Z0-9_<>.]+)').match(line)
	if match is not None:
	    tid2vid[int(match.group('tid'))] = int(match.group('vid'))
        #match = re.compile(prefix + r'Prof Meta Info (?P<opid>[0-9]+) (?P<hlr>[0-9]+) (?P<pid>[a-f0-9]+) (?P<create>[0-9]+) (?P<ready>[0-9]+) (?P<start>[0-9]+) (?P<stop>[0-9]+)').match(line)
        match = re.compile(prefix + r'Prof Proc Desc (?P<pid>[a-f0-9]+) (?P<kind>[0-9]+)').match(line)
        if match is not None:
            kind = int(match.group('kind'))
            procs[str(int(match.group('pid'),16))] = processor_kinds[kind]
    for n in tidnames:
	if n in tid2vid:
	    names[tid2vid[n]] = tidnames[n]
    proclist = []
    for proc in procs:
	proclist.append({'id':procPretty(proc),'name':procs[proc]})
    for task in tasks:
        task["proc_kind"] = procs[task["proc_id"]]
	task["proc_id"] = procPretty(task["proc_id"])
    return tasks, names, proclist


def fromFile(fname):
    test = open(fname, "r")
    testdata = test.readlines()
    return analyze(testdata)


if __name__=="__main__":
    # Load the file
    test = open("Data/normal.log", "r")
    testdata = test.readlines()
    result = analyze(testdata)
    print result
