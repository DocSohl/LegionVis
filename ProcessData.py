from __future__ import division
import math
import re

prefix = r'\[(?P<node>[0-9]+) - (?P<thread>[0-9a-f]+)\] \{\w+\}\{legion_prof\}: '


def analyze(data):
    tasks = []
    for line in data:
        match = re.compile(prefix + r'Prof Task Info (?P<tid>[0-9]+) (?P<fid>[0-9]+) (?P<pid>[a-f0-9]+) (?P<create>[0-9]+) (?P<ready>[0-9]+) (?P<start>[0-9]+) (?P<stop>[0-9]+)').match(line)
        if match is not None:
            tasks.append({
                "task_id" : long(match.group('tid')),
                "func_id" : int(match.group('fid')),
                "proc_id" : int(match.group('pid'), 16),
                "create" : long(match.group('create'))/1000,
                "ready" : long(match.group('ready'))/1000,
                "start" : long(match.group('start'))/1000,
                "stop" : long(match.group('stop'))/1000
            })
    return tasks




if __name__=="__main__":
    # Load the file
    test = open("data/PROF.log", "r")
    testdata = test.readlines()
    result = analyze(testdata)
    print result
