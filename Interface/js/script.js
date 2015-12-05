var first = true;

function test(){
    if(first) {
        d3.select(".header").style("display", "none");
        d3.select(".tool").style("display", "block");
        //var display = d3.select("#responsedisplay").select("body");
        //console.log(display.text());
        //display.attr("src",display.html())
        var iframe = document.getElementById('responsedisplay');
        var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframe.src = innerDoc.body.innerHTML;
        first = false;
    }
}