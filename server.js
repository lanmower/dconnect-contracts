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

var util = require('util')
var stream = require('stream')
var Transform = stream.Transform

util.inherits(Stringer, Transform)

function Stringer() {
  Transform.call(this, { objectMode: true } )
  // 'object mode allows us to consume one object at a time

}

Stringer.prototype._transform = function(chunk, encoding, cb) {
  var pretty = JSON.stringify(chunk, null, 2) 
  this.push(pretty) // 'push' method sends data down the pike.
  cb() // callback tells the incoming stream we're done processing 
}

var ss = new Stringer()


MongoClient.connect(process.env.url, { useNewUrlParser: true,reconnectTries: 60, reconnectInterval: 1000}, async function(err, db) {
  let dbo = db.db("dconnectlive");
  let collection = await dbo.collection("transactions");
  const changeStreamCursor = collection.watch();
  
  app.get('/transactions', (req, res) => {
    collection.find()
      .pipe(require('JSONStream').stringify())
      .pipe(res.type('json'))
  })
  
  changeStreamCursor.on('change', next => {
    console.log(next);  
  });
  let updateOps = {
    $match: {
      $and: [
        { operationType: "insert" }
      ]
    }
  };
  // disconnect is fired when a client leaves the server
});

/* Below mentioned steps are performed to return the Frontend build of create-react-app from build folder of backend Comment it out if running locally*/


  const listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
  }); 

app.use(express.static('public'));
