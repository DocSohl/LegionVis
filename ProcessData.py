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

def analyze(data):
    tasks = []
    taskmap = {}
    instances = []
    names = {}
    procs = {}
    for line in data:
        match = re.compile(prefix + r'Prof Task Info (?P<tid>[0-9]+) (?P<fid>[0-9]+) (?P<pid>[a-f0-9]+) (?P<create>[0-9]+) (?P<ready>[0-9]+) (?P<start>[0-9]+) (?P<stop>[0-9]+)( (?P<spawn>[0-9]+))?').match(line)
        if match is not None:
            tasks.append({
                "task_id" : long(match.group('tid')),
                "func_id" : int(match.group('fid')),
                "proc_id" : int(match.group('pid'), 16),
                "create" : long(match.group('create'))/1000,
                "ready" : long(match.group('ready'))/1000,
                "start" : long(match.group('start'))/1000,
                "stop" : long(match.group('stop'))/1000,
                "spawn" : None
            })
            if match.group('spawn') is not None:
                tasks[-1]["spawn"] = int(match.group('spawn'))            
            taskmap[tasks[-1]["task_id"]] = tasks[-1]
        match = re.compile(prefix + r'Prof Task Variant (?P<fid>[0-9]+) (?P<name>[a-zA-Z0-9_<>.]+)').match(line)
        if match is not None:
            names[int(match.group('fid'))] = match.group('name')
        #match = re.compile(prefix + r'Prof Meta Info (?P<opid>[0-9]+) (?P<hlr>[0-9]+) (?P<pid>[a-f0-9]+) (?P<create>[0-9]+) (?P<ready>[0-9]+) (?P<start>[0-9]+) (?P<stop>[0-9]+)').match(line)
        match = re.compile(prefix + r'Prof Inst Info (?P<opid>[0-9]+) (?P<inst>[a-f0-9]+) (?P<mem>[a-f0-9]+) (?P<bytes>[0-9]+) (?P<create>[0-9]+) (?P<destroy>[0-9]+)').match(line)
        if match is not None:
            newinstance = {
                "op_id" : long(match.group('opid')),
                "inst_id" : int(match.group('inst'),16),
                "mem_id" : int(match.group('mem'),16),
                "size" : long(match.group('bytes')),
                "create" : long(match.group('create'))/1000,
                "destroy" : long(match.group('destroy'))/1000            
            }
            if newinstance["op_id"] in taskmap:
                newinstance["proc_id"] = taskmap[newinstance["op_id"]]["proc_id"]
                instances.append(newinstance)
        match = re.compile(prefix + r'Prof Proc Desc (?P<pid>[a-f0-9]+) (?P<kind>[0-9]+)').match(line)
        if match is not None:
            kind = int(match.group('kind'))
            procs[int(match.group('pid'),16)] = processor_kinds[kind]
    for task in tasks:
        task["proc_kind"] = procs[task["proc_id"]]
    return tasks, names, instances


def fromFile(fname):
    test = open(fname, "r")
    testdata = test.readlines()
    return analyze(testdata)


if __name__=="__main__":
    # Load the file
    test = open("data/PROFSimple.log", "r")
    testdata = test.readlines()
    result = analyze(testdata)
    print result
