
from BaseHTTPServer import HTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler 
from shutil import copyfileobj
import ProcessData
import json


class Handler(SimpleHTTPRequestHandler):
    def json_out(self, obj):
        self.wfile.write(json.dumps(obj)+"\n")
    def do_POST(self):
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD':'POST',
                     'CONTENT_TYPE':self.headers['Content-Type'],}
        )
        print form
    def do_GET(self):
        STATICS = ('/Data','/Interface')
        if self.path == "/":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/display.html', 'r'),self.wfile)
        elif self.path == "/js/main.js":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/js/main.js', 'r'),self.wfile)
        elif self.path == "/style.css":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/style.css', 'r'),self.wfile)		
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
        server_address = ('',8080)
        httpd = HTTPServer(server_address, Handler)
    print "Serving..."
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print "Stopping server"
