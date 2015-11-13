
from BaseHTTPServer import HTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler 
from shutil import copyfileobj


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
	elif self.path == "/display.js":
            self.send_response(200, "OKAY")
            self.end_headers()
            copyfileobj(open('Interface/display.js', 'r'),self.wfile)	    
	elif reduce(lambda a, b: a or b, (self.path.startswith(k) for k in STATICS)):
		SimpleHTTPRequestHandler.do_GET(self)

if __name__=="__main__":
    server_address = ('', 8001)
    httpd = HTTPServer(server_address, Handler)
    httpd.serve_forever()
