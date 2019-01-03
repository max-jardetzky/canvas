// index.js
var windowAddr = window.location.href.substring(window.location.href.indexOf("/", window.location.href.indexOf("/") + 1) + 1, window.location.href.length);
var socket;
var colors = ["rgb(235, 59, 90)", "rgb(250, 130, 49)", "rgb(254, 211, 48)", "rgb(32, 191, 107)", "rgb(56, 103, 214)", "rgb(136, 84, 208)"];
var color = "rgb(235, 59, 90)"; // ^ German Palette for picker, American Palette for background (FlatUIColors)
var rainbow = false;
var random = false;
var counter = 0;
openSocket();

var container = document.getElementById("grid");
var counter = 0;
for (var i = 0; i < 13; i++) {
    var row = document.createElement("div");
    row.className = "row gridRow";
    for (var j = 0; j < 13; j++) {
        var col = document.createElement("div");
        col.className = "col gridCol"; 
        col.id = counter.toString();
        col.style.backgroundColor = "rgb(99, 110, 114)";
        counter++;
        row.appendChild(col);
    }
    container.appendChild(row);
}

var pickerCols = document.getElementsByClassName("pickerCol");
for (var i = 0; i < pickerCols.length; i++) {
    pickerCols[i].onclick = function() {
        for (var j = 0; j < pickerCols.length; j++) {
            pickerCols[j].className = "col pickerCol unselected";
        }
        this.className = "col pickerCol selected";
        if (this.id == "rainbow") {
            rainbow = true;
            random = false;
        } else if (this.id == "random") {
            random = true;
            rainbow = false;
        } else {
            color = getComputedStyle(this).color;
            rainbow = false;
            random = false;
        }
    }
}

var gridCols = document.getElementsByClassName("gridCol");
for (var i = 0; i < gridCols.length; i++) {
    gridCols[i].onclick = function() {
        draw(this.id);
    }
}

document.addEventListener("mousedown", function(event){
    for (var i = 0; i < gridCols.length; i++) {
        gridCols[i].onmouseover = function() {
            draw(this.id);
        }
    }
}, false);

document.addEventListener("mouseup", function(event){
    for (var i = 0; i < gridCols.length; i++) {
        gridCols[i].onmouseover = function(){};
    }
}, false);

function openSocket() {
    socket = new WebSocket("ws://" + windowAddr + "draw");

    socket.onmessage = function(e) {
        var data = e.data.match(/^(\S+)\s(.*)/).slice(1);
        document.getElementById(data[0]).style.backgroundColor = data[1];
    };
}

function draw(id) {
    if (rainbow) {
        socket.send(id + " " + colors[counter]);
        counter++;
        if (counter >= colors.length) {
            counter = 0;
        }
    } else if (random) {
        socket.send(id + " " + colors[Math.floor(Math.random()*colors.length)]);
    } else {
        socket.send(id + " " + color);
    }
}