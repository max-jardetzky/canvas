// index.js
var windowAddr = window.location.href.substring(window.location.href.indexOf("/", window.location.href.indexOf("/") + 1) + 1, window.location.href.length);
var socket;
var colors = ["rgb(235, 59, 90)", "rgb(250, 130, 49)", "rgb(254, 211, 48)", "rgb(32, 191, 107)", "rgb(56, 103, 214)", "rgb(136, 84, 208)", "rgb(0, 0, 0)", "rgb(255, 255, 255)"];
var blackIndex = 6;
var color = "rgb(235, 59, 90)"; // ^ German Palette for picker, American Palette for background (FlatUIColors)
var rainbow = false;
var random = false;
var pencilCol = document.getElementById("pencilCol");
var userText = document.getElementById("userText");
var counter1 = 0;
var counter2 = 0;
var smallPencil = true;
const gridWidth = 25;
openSocket();

document.oncontextmenu = new Function("return false;");

var container = document.getElementById("grid");
for (var i = 0; i < 25; i++) {
    var row = document.createElement("div");
    row.className = "row gridRow";
    for (var j = 0; j < 25; j++) {
        var col = document.createElement("div");
        col.className = "col gridCol"; 
        col.id = counter1.toString();
        col.style.backgroundColor = "rgb(99, 110, 114)";
        counter1++;
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

pencilCol.onclick = function() {
    if (this.className == "col sizeCol small") {
        smallPencil = false;
        this.className = "col sizeCol large";
    } else {
        smallPencil = true;
        this.className = "col sizeCol small";
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

document.addEventListener("keydown", function(event){
    switch (event.keyCode) {
        case 192: //`
            pencilCol.click();
            break;
        case 49: //1
            pickerCols[0].click(); //red
            break;
        case 50: //2
            pickerCols[1].click(); //orange
            break;
        case 51: //3
            pickerCols[2].click(); //yellow
            break;
        case 52: //4
            pickerCols[3].click(); //green
            break;
        case 53: //5
            pickerCols[4].click(); //blue
            break;
        case 54: //6
            pickerCols[5].click(); //purple
            break;
        case 55: //7
            pickerCols[6].click(); //black
            break;
        case 56: //8
            pickerCols[7].click(); //white
            break;
        case 57: //9
            pickerCols[8].click(); //rainbow
            break;
        case 48: //0
            pickerCols[9].click(); //random
            break;
        case 27: //escape
            pickerCols[10].click(); //erase
    }
})

function openSocket() {
    socket = new WebSocket("ws://" + windowAddr + "draw");

    socket.onmessage = function(e) {
        console.log(e.data);
        var spaceIndex = e.data.indexOf(" ");
        var command = e.data.substring(0, spaceIndex);
        var data = e.data.substring(spaceIndex + 1);
        switch (command) {
            case "canvas":
                var splitData = data.match(/^(\S+)\s(.*)/).slice(1);
                document.getElementById(splitData[0]).style.backgroundColor = splitData[1];
                break;
            case "users":
                console.log(data);
                userText.innerText = data + " connected user";
                if (data != "1") {
                    userText.innerText += "s";
                }
                break;
        }
        
    };
}

function draw(id) {
    if (rainbow) {
        send(id, colors[counter2]);
        counter2++;
        if (counter2 >= blackIndex) {
            counter2 = 0;
        }
    } else if (random) {
        send(id, colors[Math.floor(Math.random()*blackIndex)]);
    } else {
        send(id, color);
    }
}

function send(id, color) {
    if (smallPencil) {
        socket.send(id + " " + color);
    } else {
        intId = parseInt(id);
        var squares = new Array(9);
        if ((intId + 1) % 25 != 1) {
            squares[0] = intId - gridWidth - 1; //top left
            squares[3] = intId - 1; //left
            squares[6] = intId + gridWidth - 1; //bottom left
        } else {
            squares[0] = -1; //top left
            squares[3] = -1; //left
            squares[6] = -1; //bottom left
        }
        squares[1] = intId - gridWidth; //top middle
        squares[4] = intId; //center
        squares[7] = intId + gridWidth; //bottom middle
        if ((intId + 1) % 25 != 0) {
            squares[2] = intId - gridWidth + 1; //top right
            squares[5] = intId + 1; //right
            squares[8] = intId + gridWidth + 1; //bottom right
        } else {
            squares[2] = -1; //top right
            squares[5] = -1; //right
            squares[8] = -1; //bottom right
        }
        for (var i = 0; i < squares.length; i++) {
            if (squares[i] >= 0 && squares[i] < gridWidth * gridWidth) {
                socket.send(squares[i] + " " + color);
            }
        }
    }
}