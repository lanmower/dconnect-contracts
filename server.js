const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

// Connection string of MongoDb database hosted on Mlab or locally

var connection_string = process.env.url;

// Collection name should be "FoodItems", only one collection as of now.

// Document format should be as mentioned below, at least one such document:

// {
//     "_id": {
//         "$oid": "5c0a1bdfe7179a6ca0844567"
//     },
//     "name": "Veg Roll",
//     "predQty": 100,
//     "prodQty": 295,
//     "ordQty": 1
// }

const db = require("monk")(connection_string);

const collection_transactions = db.get("transactions");

// our localhost port
const port = process.env.PORT || 3000;

const app = express();

// our server instance
const server = http.createServer(app);

// This creates our socket using the instance of the server
const io = socketIO(server);

io.on("connection", socket => {
  console.log("New client connected" + socket.id);

  // disconnect is fired when a client leaves the server
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

/* Below mentioned steps are performed to return the Frontend build of create-react-app from build folder of backend Comment it out if running locally*/

app.use(express.static('public'));

server.listen(port, () => console.log(`Listening on port ${port}`));