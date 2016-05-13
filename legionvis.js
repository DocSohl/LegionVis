/**
 * Created by Phil_ on 4/29/2016.
 */
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var uuid = require('node-uuid');
var processdata = require('./processdata.js');
var getConcurrencyData = require('./getconcurrency.js');

var app = express();
app.use(express.static('Interface'));
app.use(express.static('JsonData'));
app.use(bodyParser.text({limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));

app.post('/upload',function(req,res){
    if(req.headers.hasOwnProperty("content-type")){
        var guid = uuid.v4();
        if(req.headers["content-type"].includes("text/plain")){
            processdata(req.body,function(error,data){
                getConcurrencyData(data.tasks,function(error,concurrencydata) {
                    data.concurrencyData = concurrencydata;
                    fs.writeFile("JsonData/" + guid + ".json", JSON.stringify(data), function (err) {
                        res.end(JSON.stringify({"id": guid.toString()}));
                    });
                });
            });
        }
        else if (req.headers["content-type"].includes("application/json")){
            fs.writeFile("JsonData/"+guid + ".json",JSON.stringify(req.body),function(err){
                res.end(JSON.stringify({"id":guid.toString()}));
            });
        }

    }
    else{
        res.sendStatus(415);
        res.end("Error! Unsupported Content-Type!");
    }
});
app.get('/js/processdata.js',function(req,res){
    fs.readFile('processdata.js',function(err,data){
        res.end(data);
    });
});

app.get('/js/getconcurrency.js',function(req,res){
    fs.readFile('getconcurrency.js',function(err,data){
        res.end(data);
    });
});
app.listen(80 || 8080);