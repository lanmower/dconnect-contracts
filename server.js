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
  app.get('/transactions', async (req, res) => {
    const collection = await dbo.collection("transactions");
    collection.find().sort({_id:-1})
      .pipe(require('JSONStream').stringify())
      .pipe(res.type('json'));
  })
  app.get('/state', async (req, res) => {
    const collection = await dbo.collection("state");
    collection.find().sort({_id:-1})
      .pipe(require('JSONStream').stringify())
      .pipe(res.type('json'));
  })
  const collection = await dbo.collection("transactions");
  const processed = await dbo.collection("processed");
  const changeStreamCursor = collection.watch();
  //processed.drop();
  const queue =[];
  collection.find().sort({timestamp:1}).forEach(async (item)=>{
      if(await processed.findOne({_id:item._id})) return;
      await processed.insert(item); 
      const res = (await smartcontracts.executeSmartContract({
        id:item.transactionId,
        sender:item.authorization[0].actor,
        contract:item.data.app,
        action:item.data.key,
        payload:item.data.value      
      }, 1000,dbo)); 
  });
  changeStreamCursor.on('change', next => {
    const res = smartcontracts.executeSmartContract({
      id:next.fullDocument.transactionId,
      sender:next.fullDocument.authorization[0].actor,
      contract:next.fullDocument.data.app,
      action:next.fullDocument.data.key,
      payload:next.fullDocument.data.value
    }, 1000,dbo).fullDocument;
    //if(res && res.logs && res.logs.events && res.logs.events.length) console.log(res.logs.events);
  });
  // disconnect is fired when a client leaves the server
}); 
/* Below mentioned steps are performed to return the Frontend build of create-react-app from build folder of backend Comment it out if running locally*/
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
}); 
app.use(express.static('public'));
