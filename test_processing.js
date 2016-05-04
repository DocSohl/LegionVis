/**
 * Created by Phil on 4/28/2016.
 */
var fs = require('fs');
var analyze = require('./processdata.js');

fs.readFile("Data/PROF.log",function(err,data){
    analyze(data.toString(),function(result){
        console.log(result);
    });
});