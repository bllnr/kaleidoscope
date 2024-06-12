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

//Socket configuration
io.on("connection", (socket) => {
    //each time someone visits the site and connect to socket.io 
    //this function  gets called
    //it includes the socket object from which you can get the id, 
    //useful for identifying each client
    console.log(`${socket.id} connected`);

    //add a starting position when the client connects
    //px, py are previous positions
    positions[socket.id] = {x:0.5, y:0.5, px:0.5, py:0.5};

    socket.on("disconnect", () => {
        // when this client disconnects, delete its position from the object
        delete positions[socket.id];
        console.log(`${socket.id} disconnected`);
    });

    //client can send message 'updatePosition' each time the clients position changes
    socket.on("updatePosition", (data) => {
        positions[socket.id].px = data.px; //previous position
        positions[socket.id].py = data.py; //previous position
        positions[socket.id].x = data.x;
        positions[socket.id].y = data.y;
    });
});

//send position every framerate to each client
const frameRate = 300;
setInterval(() => {
    io.emit("positions", positions);
}, 1000/frameRate);