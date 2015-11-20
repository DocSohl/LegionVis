# LegionVis
### A web-based visualization for Legion profiling results.

This repository contains code for a web server capable of visualizing performance profiles from programs written with the Legion programming system.

### What is Legion?
[Legion](http://legion.stanford.edu/) is a "data-centric parallel programming system for writing portable high performance programs targeted at distributed heterogeneous architectures." Legion provides an abstraction for highly parallelized code to be scheduled in an efficient and structurally aware manner, and thus makes code execution decisions that may not be immediately apparent to the programmer.

### Function
This project allows a user to upload a performance log of a program written with Legion, and provides an interactive visualization of the execution. The intended setup for this system is in a client-server format, but can be run locally.

For more details please refer to our [Design Process Book](https://github.com/DocSohl/LegionVis/blob/master/process_book.pdf).

### Requirements
Running this program requires several software packages:

Server:
 * [Python 2.7](http://www.python.org/)

Client:
 * Chrome, Firefox, Opera, or IE9+
 * An internet connection, or access to:
   * [D3.js](http://d3js.org/)
   * [D3.tip](https://github.com/Caged/d3-tip)

### Operation
Running the web server is as easy as downloading and extracting this repository, then running
`python LegionVis.py`
then navigating to the IP of the server, or if on the same machine, the IP `localhost`.

The web server automatically attempts to launch using the default HTTP port 80, but if another service is using the port, or if running without root privileges on a Unix machine, will attempt to launch using port 8080.

### Contact
For queries about the project or to report bugs, please use the Github issue tracker, or contact:
 * Ian Sohl (https://github.com/DocSohl)
 * Phil Cutler (https://github.com/PhilCutler)
 * Ariel Herbert-Voss (https://github.com/neurophoenix)