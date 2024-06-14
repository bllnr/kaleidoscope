const express = require("express");
const app = express();
const http = require("http").createServer(app);
// set to use websocket only. This loads socket.io and connects it to the server.
const io = require("socket.io")(http, {transports: ["websocket"]})

const port = process.env.PORT || 8080;

// makes sure we can put all html/css/js in the public directory
app.use(express.static(__dirname + "/public"));

//we have just 1 route to the home page rendering an index html
app.get("/", (req, res) => {
    res.render("index.html");
});

// run the server which uses express
http.listen(port, () => {
    console.log(`Server is active at port:${port}`);
});

//store the positions for each client in this object
//It would be safer to connect it to a database as well so the data doesn't get destroyed when the server restarts
//but we'll just use an object for simplicity.
const positions = {};
const sharedDataColor = {hue:0, saturation:0, lightness:0};
const sharedDataRainbowStatus = {rainbowStatus:'Inactive'};
const sharedDataBrushSize = {brushSize: 8};
const sharedDataSymmetry = {symmetry: 20};

//Socket configuration
io.on("connection", (socket) => {
    //each time someone visits the site and connect to socket.io 
    //this function gets called
    //it includes the socket object from which you can get the id, 
    //useful for identifying each client
    console.log(`${socket.id} connected`);

    io.emit("sharedDataColor", sharedDataColor);
    io.emit("sharedDataRainbowStatus", sharedDataRainbowStatus);
    io.emit("sharedDataSymmetry", sharedDataSymmetry);
    io.emit("sharedDataBrushSize", sharedDataBrushSize);
    
    //add a starting position when the client connects
    //x, y are current positions
    //px, py are previous positions
    //isPressed to check/record if mouse is pressed to draw
    //color to create cursors for different users
    positions[socket.id] = {x:0.5, y:0.5, px:0.5, py:0.5, isPressed:false};

    socket.on("disconnect", () => {
        // when this client disconnects, delete its position from the object
        delete positions[socket.id];
        console.log(`${socket.id} disconnected`);
    });

    socket.on('reconnect_attempt', (attempt) => {
        console.log(`Reconnect attempt #${attempt}`);
    });

    socket.on('reconnect_error', (error) => {
        console.error('Reconnect error:', error);
    });

    socket.on('reconnect_failed', () => {
        console.error('Reconnect failed');
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log(`Reconnected successfully on attempt #${attemptNumber}`);
        // Optionally, request the latest state if necessary
        socket.emit('sharedDataColor');
    });

    //client can send message 'updatePosition' each time the clients position changes
    socket.on("updatePosition", (data) => {
        positions[socket.id].px = data.px; //previous position
        positions[socket.id].py = data.py; //previous position
        positions[socket.id].x = data.x;
        positions[socket.id].y = data.y;
        positions[socket.id].isPressed = data.isPressed;
    });

    socket.on("updateSharedDataColor", (data) => {
        // only update and make other clients update if the color is different from before
        if(sharedDataColor.hue != data.hue || sharedDataColor.saturation != data.saturation || sharedDataColor.lightness != data.lightness){
            sharedDataColor.hue = data.hue;
            sharedDataColor.saturation = data.saturation;
            sharedDataColor.lightness = data.lightness;
            io.emit("sharedDataColor", sharedDataColor);
        }
    });

    socket.on("requestSharedDataColor", () => {
        io.emit("sharedDataColor", sharedDataColor);
    });

    socket.on("updateSharedDataRainbowStatus", (data) => {
        sharedDataRainbowStatus.rainbowStatus = data.rainbowStatus;
    });

    socket.on("updateSharedDataSymmetry", (data) => {
        // only update and send out data if actually changed
        if(sharedDataSymmetry.symmetry != data.sharedDataSymmetry){
            sharedDataSymmetry.symmetry = data.sharedDataSymmetry;
            io.emit("sharedDataSymmetry", sharedDataSymmetry);
        }
    });

    socket.on("updateSharedDataBrushSize", (data) => {
        // only update and send out data if actually changed
        if(sharedDataBrushSize.brushSize !== data.sharedDataBrushSize){
            sharedDataBrushSize.brushSize = data.sharedDataBrushSize;
            io.emit("sharedDataBrushSize", sharedDataBrushSize);
        } 
    });

});

//send position every framerate to each client
const frameRate = 60;
setInterval(() => {
    // send shared data to all users
    io.emit("positions", positions);
    io.emit("sharedDataColor", sharedDataColor);
    io.emit("sharedDataRainbowStatus", sharedDataRainbowStatus);
}, 1000/frameRate);