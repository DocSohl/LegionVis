/**
 * Created by Phil on 4/28/2016.
 */
var fs = require('fs');
var analyze = require('./processdata.js');

fs.readFile("Data/PROFSimple.log",function(err,data){
    var processed = analyze(data.toString());
    console.log(processed);
});