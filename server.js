const express = require("express");
const http = require("http");
var connection_string = process.env.url;
const port = process.env.PORT || 3000;
const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
var MongoClient = require('mongodb').MongoClient;
const smartcontracts = require('./smartcontract.js').SmartContracts;
MongoClient.connect(process.env.url, { useNewUrlParser: true,reconnectTries: 60, reconnectInterval: 1000}, async function(err, db) {
  console.log(err);
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
  const processedData = await processed.findOne();
  const changeStreamCursor = collection.watch();
  let cursor = collection.find({timestamp:{$gt:processedData.timestamp}}).sort({timestamp:1});
  let count = 0;
  while ( await cursor.hasNext() ) {  // will return false when there are no more results
    let item = await cursor.next();    // actually gets the document
    console.log(item);
    if(await processed.findOne({_id:item._id})) continue;
      await processed.upsert({}, {timestamp:item.timestamp}, {upsert:true}); 
      await smartcontracts.executeSmartContract({
        id:item.transactionId,
        sender:item.authorization[0].actor,
        contract:item.data.app,
        action:item.data.key,
        payload:item.data.value      
      }, 1000,dbo);
    console.log(item.data);
  }
 
  changeStreamCursor.on('change', async (next) => {
    console.log(next.fullDocument.data);
    await processed.insert(next.fullDocument); 
    const res = smartcontracts.executeSmartContract({
      id:next.fullDocument.transactionId,
      sender:next.fullDocument.authorization[0].actor,
      contract:next.fullDocument.data.app,
      action:next.fullDocument.data.key,
      payload:next.fullDocument.data.value
    }, 1000,dbo).fullDocument;
  });

}); 

const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
app.use(express.static('public'));
