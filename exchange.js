require('dotenv').config();
const http = require('http');


const express = require("express");
const port = process.env.PORT || 3000;
const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
var MongoClient = require('mongodb').MongoClient;
var db = null, rdb = null;
const smartcontracts = require('./smartcontract.js').SmartContracts;
MongoClient.connect("mongodb://localhost/admin", { useNewUrlParser: true, reconnectTries: 60, reconnectInterval: 2000}, async function(err, dbi) {
MongoClient.connect(process.env.url, { useNewUrlParser: true, poolSize:1, reconnectTries: 60, reconnectInterval: 2000}, async function(err, rdbi) {
  console.log(err);
  db = dbi;
  rdb = rdbi;
  let rdbo = rdb.db("dconnectlive");
  let dbo = db.db("dconnectlive");
  app.get('/db/*', async (req, res) => {
    const collection = await dbo.collection(req.path.replace('/db/',''));
    collection.find().sort({_id:-1})
      .pipe(require('JSONStream').stringify())
      .pipe(res.type('json'));
  })
  app.get('/state', async (req, res) => {
    const collection = await await rdbo.collection("state");
    collection.find().sort({_id:-1})
      .pipe(require('JSONStream').stringify())
      .pipe(res.type('json'));
  })
  const collection = await rdbo.collection("transactions");
  const processed = await dbo.collection("processed");
  const logs = await dbo.collection("logs");
// try{processed.drop();}catch(e){} 
  const processedData = (await processed.findOne())||{timestamp:new Date(0)};
  const afterTime = processedData?processedData.timestamp:0;
  let cursor = collection.find({timestamp:{$exists:true}, account:'dconnectlive', timestamp:{$gt:new Date(afterTime)}}).sort({timestamp:1});
  async function run(item) { 
    const before = new Date().getTime();
    const date = new Date(item.timestamp).getTime();
    //console.log(item.data);
    const res = await smartcontracts.executeSmartContract({
      id:item.transactionId, 
      sender:item.authorization[0].actor,
      contract:item.data.app,
      action:item.data.key,
      payload:item.data.value      
    }, 2000, dbo); 
    //console.log(new Date().getTime()-before);
    await logs.insert({id:item.transactionId, res, timestamp:item.timestamp}); 
    await processed.update({}, {timestamp:item.timestamp}, {upsert:true}); 
    //console.log(item, res);
  }  
  const total = await cursor.count();
  let count =0; 
  while ( await cursor.hasNext() ) { 
    const  item = await cursor.next();
    await run(item);
    //console.log(total-(count++));
  }
  collection.watch({account:'dconnectlive'}).on('change', async (next) => {
    run(next.fullDocument);
  });
}); 
}); 
const listener = app.listen(port, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
app.use(express.static('public'));


// Create a function to terminate your app gracefully:
function gracefulShutdown(){
    // First argument is [force], see mongoose doc.
    if(db) db.close(false, () => {
      console.log('MongoDb connection closed.');
    });
    if(rdb) rdb.close(false, () => {
      console.log('MongoDb connection closed.');
    });
}

process.stdin.resume();//so the program will not close instantly
process.on('exit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', gracefulShutdown);