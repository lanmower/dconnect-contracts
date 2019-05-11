const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

// Connection string of MongoDb database hosted on Mlab or locally

var connection_string = process.env.url;


// our localhost port
const port = process.env.PORT || 3000;

const app = express();

app.use(express.static('public'));
// our server instance
const server = http.createServer(app);

var MongoClient = require('mongodb').MongoClient;
// This creates our socket using the instance of the server

MongoClient.connect(process.env.url, { useNewUrlParser: true,reconnectTries: 60, reconnectInterval: 1000}, async function(err, db) {
  let dbo = db.db("dconnectlive");
  let collection = await dbo.collection("transactions");
  const changeStreamCursor = collection.watch([]);
  function pollStream(cursor) {
    while (!cursor.isExhausted()) {
      if (cursor.hasNext()) {
        const change = cursor.next();
        console.log(JSON.stringify(change));
      }
    }
    pollStream(cursor);
  }
  let updateOps = {
    $match: {
      $and: [
        { operationType: "insert" }
      ]
    }
  };
  // disconnect is fired when a client leaves the server
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

/* Below mentioned steps are performed to return the Frontend build of create-react-app from build folder of backend Comment it out if running locally*/


  const listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
  }); 

app.use(express.static('public'));
