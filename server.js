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
  app.get('/db/*', async (req, res) => {
    const collection = await dbo.collection(req.path.replace('/db/',''));
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
  //  try{processed.drop();}catch(e){}

  const processedData = (await processed.findOne())||{timestamp:new Date(0)};
  const afterTime = processedData?processedData.timestamp:0;
  let cursor = collection.find({timestamp:{$exists:true}, timestamp:{$gt:processedData.timestamp?processedData.timestamp:new Date(0)}}).sort({timestamp:1});
  
  async function run(item) {
    await processed.update({}, {timestamp:item.timestamp}, {upsert:true}); 
    const res = await smartcontracts.executeSmartContract({
      id:item.transactionId,
      sender:item.authorization[0].actor,
      contract:item.data.app,
      action:item.data.key,
      payload:item.data.value      
    }, 1000,dbo);
    console.log(item, res);
  }
  
  while ( await cursor.hasNext() ) { 
    const  item = await cursor.next();
    run(item);
  }
 
  collection.watch().on('change', async (next) => {
    run(next.fullDocument);
  });

}); 

const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
app.use(express.static('public'));
