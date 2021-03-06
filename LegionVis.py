
from BaseHTTPServer import HTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler 
from shutil import copyfileobj, rmtree
import ProcessData
import json
import cgi
import logging
import uuid
import os


class Handler(SimpleHTTPRequestHandler):

    def json_out(self, obj):
        self.wfile.write(json.dumps(obj)+"\n")

    def do_POST(self):
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD':'POST',
                     'CONTENT_TYPE':self.headers['Content-Type'],
                     })
        id = uuid.uuid4()
        logfilepath = 'Data/' + str(id) + '.log'
        with open(logfilepath, 'w') as logfile:
            logfile.write(form['datafile'].value)

        directory = 'SharedData/' + str(id)
        if not os.path.exists(directory):
            os.makedirs(directory)

        jsonobj = ProcessData.fromFile(logfilepath)
        jsonpath = directory + '/tasks.json'
        with open(jsonpath, 'w') as jsonfile:
            jsonfile.write(json.dumps(jsonobj)+"\n")
        os.remove(logfilepath)
        print 
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        # This is hacky and horrible and I'll look into a better way.
        self.wfile.write(
        """
<!DOCTYPE html><html lang="en"><html><head><meta charset="UTF-8"><title>LegionViz</title><link rel="stylesheet" href="webstyle.css" type="text/css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js" charset="utf-8"></script>
</head><body><div id="header"><div><a href="index.html" class="logo"><h1>LegionVis</h1></a></div>
<ul><li><a href="index.html">home</a></li><li class="selected"><a href="tool.html">tool</a></li><li><a href="contact.html">contact</a></li></ul></div>
<div id="body"><div class="header"><p><a href='http://"""+form.headers.get('host')+"/Shared/"+str(id)+"""/display.html'>Click here to access your visualization</a></p></div></div></body></html>        
        """)

    def do_GET(self):
        print self.path
        STATICS = ('/Data','/Interface')
        if self.path.startswith('/Shared/'):
            # The beginnings of the link sharing utility.
            pathparts = self.path.split('/')
            id = pathparts[2]
            if pathparts[3] != 'tasks.json':
                pathwithoutshared = self.path[8:]
                index = pathwithoutshared.index('/')
                newpath = pathwithoutshared[index:]
                self.path = newpath
            else:
                self.send_response(200, "OKAY")
                self.end_headers()
                copyfileobj(open('SharedData/'+id+'/tasks.json', 'r'), self.wfile)
                return
        if self.path == "/" or self.path == '/index.html':
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/index.html', 'r'),self.wfile)
        if self.path == "/tool.html":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/tool.html', 'r'),self.wfile)
        if self.path == "/contact.html":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/contact.html', 'r'),self.wfile)
        elif self.path == "/upload.html":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/upload.html', 'r'),self.wfile)
        elif self.path == "/display.html":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/display.html', 'r'),self.wfile)
        elif self.path == "/js/main.js":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/js/main.js', 'r'),self.wfile)
        elif self.path == "/js/mainview.js":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/js/mainview.js', 'r'),self.wfile)
        elif self.path == "/js/histogramview.js":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/js/histogramview.js', 'r'),self.wfile)
        elif self.path == "/js/summaryview.js":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/js/summaryview.js', 'r'),self.wfile)
        elif self.path == "/js/graphview.js":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/js/graphview.js', 'r'),self.wfile)
        elif self.path == "/js/script.js":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/js/script.js', 'r'),self.wfile)
        elif self.path == "/style.css":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/style.css', 'r'),self.wfile)	
        elif self.path == "/webstyle.css":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/webstyle.css', 'r'),self.wfile)	
        elif self.path == "/favicon.ico":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/favicon.ico', 'r'),self.wfile)    
        elif self.path == "/tasks.json":
            self.send_response(200, "OKAY")
            self.end_headers()
            self.json_out(ProcessData.fromFile("Data/PROF.log"))    
        elif reduce(lambda a, b: a or b, (self.path.startswith(k) for k in STATICS)):
            SimpleHTTPRequestHandler.do_GET(self)

if __name__=="__main__":
    print "Opening HTTP server on port 80"
    server_address = ('', 80)
    try:
        httpd = HTTPServer(server_address, Handler)
    except IOError:
        print "Failed on default port 80, attempting to open on port 8080"
        server_address = ('', 8080)
        httpd = HTTPServer(server_address, Handler)
    print "Serving..."
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print "Stopping server"
