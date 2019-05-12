const express = require("express");
const http = require("http");
var connection_string = process.env.url;
const port = process.env.PORT || 3000;
const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
var MongoClient = require('mongodb').MongoClient;
const  smartcontracts = require('./smartcontract.js').SmartContracts;
MongoClient.connect(process.env.url, { useNewUrlParser: true,reconnectTries: 60, reconnectInterval: 1000}, async function(err, db) {
  let dbo = db.db("dconnectlive");
  let collection = await dbo.collection("transactions");
  const changeStreamCursor = collection.watch();
  
  app.get('/transactions', (req, res) => {
    collection.find().sort({_id:-1})
      .pipe(require('JSONStream').stringify())
      .pipe(res.type('json'));
    
  })
  
  collection.find().sort({_id:-1}).forEach(async (item)=>{
    console.log((await smartcontracts.executeSmartContract({
      id:item.transactionId,
      sender:item.authorization[0].actor,
      contract:item.data.app,
      action:item.data.key,
      payload:item.data.value
    }, 1000)).logs.events);
  });
  changeStreamCursor.on('change', next => {
    smartcontracts.executeSmartContract({
      id:item.transactionId,
      sender:item.authorization[0].actor,
      contract:item.data.app,
      action:item.data.key,
      payload:item.data.value
    }, 1000).fullDocument;
  });
  // disconnect is fired when a client leaves the server
}); 

/* Below mentioned steps are performed to return the Frontend build of create-react-app from build folder of backend Comment it out if running locally*/


  const listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
  }); 

app.use(express.static('public'));
