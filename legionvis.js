/**
 * Created by Phil_ on 4/29/2016.
 */
var express = require('express');
var fs = require('fs');
var app = express();
app.use(express.static('Interface'));
app.get('/js/processdata.js',function(req,res){
    fs.readFile('processdata.js',function(err,data){
        res.end(data);
    });
});
app.listen(8080);