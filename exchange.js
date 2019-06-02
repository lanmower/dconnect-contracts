require('dotenv').config();
const http = require('http');
console.log('test');

const express = require("express");
const port = process.env.PORT || 3000;
const app = express();
 
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

var expressWs = require('express-ws')(app);
var clients = {};
global.id = 0;
app.ws('/', function(ws, req) {
  ++global.id;
  clients[id] = ws;
  ws.on('message', function(msg) {
    ws.send(msg);
  });
  ws.onclose = ()=> {
    delete clients[ws]; 
  }
  update.push(
   ws
  );
  ws.send(msg);
}); 

var MongoClient = require('mongodb').MongoClient;
var db = null, rdb = null, dbinput;
const smartcontracts = require('./smartcontract.js').SmartContracts;


MongoClient.connect(process.env.url, { useNewUrlParser: true, poolSize:1, reconnectTries: 60, reconnectInterval: 2000}, async function(err, rdbi) {
  rdb = rdbi;  
 MongoClient.connect("mongodb://localhost/admin", { useNewUrlParser: true, reconnectTries: 60, reconnectInterval: 2000}, async function(err, dbi) {
  console.log(err);
  db =  dbi;
  let rdbo = rdb.db("dconnectlive");
  let dbo = db.db("dconnectlive");

  let dba = dbo.admin();
  let dbt = await db.db("test");
   
   app.get('/db/*', async (req, res) => {
	const name = req.path.replace('/db/','');
	const col = await dbo.collection(name);
	//console.log(await col.findOne());
	col.find().sort({_id:-1})
        .pipe(require('JSONStream').stringify())
        .pipe(res.type('json'));
   });
   
  app.post('/test', async function (req, res) {

    const body = req.body;
    let code, payload;
    if(body.code) {
	code = body.code;
	payload = {data:JSON.parse(body.payload)};
    }
    await dbt.dropDatabase();
    await dba.command({ copydb: 1, fromhost: "localhost", fromdb: "dconnectlive", todb: "test" });
    dbt = await db.db("test");
    const result = await smartcontracts.executeSmartContract({
      id:Math.random().toString(), 
      sender:"429000479331057675",
      code,
      contract:body.contract,
      payload:JSON.stringify(payload),
      timestamp:new Date().toString()
    }, 1000, dbt); 
    res.send(result);
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
//  try{processed.drop();}catch(e){}   
  async function run(item, col) { 
   try {
    const before = new Date().getTime();
    const date = new Date(item.timestamp).getTime();
    //console.log(item.data);
    const res = await smartcontracts.executeSmartContract({
      id:item.transactionId, 
      sender:item.authorization[0].actor,
      contract:item.data.app,
      action:item.data.key,
      payload:item.data.value,
      timestamp:item.timestamp
    }, 1000, dbo); 
    //console.log(new Date().getTime()-before);
    await logs.insert({id:item.transactionId, res, timestamp:item.timestamp}); 
    setTimeout(()=>{
      Object.keys(clients).forEach((ws)=>{
  	//console.log(clients[ws].readyState);
	if(clients[ws].readyState == 3) delete clients[ws];
	else {
		//console.log('sending to websocket');
		clients[ws].send(JSON.stringify(res));
	}
      }, 0); 
    });
    //console.log(item, res);
   } catch(e) {
    console.error(e);
    gracefulShutdown();
   }
  }  
  //run old transactions from dconnectlive
  let processedData = (await processed.findOne())||{timestamp:new Date(0)};
  let afterTime = processedData?processedData.timestamp:0;
  console.log(processedData, afterTime);
  let cur = collection.find({timestamp:{$exists:true}, account:'dconnectlive', timestamp:{$gt:new Date(afterTime), $lt:new Date("2019-05-28T14:05:33.000Z")}}).sort({timestamp:1});
  console.log('replaying old logs', await cur.count());
  while ( await cur.hasNext() ) {
    await processed.update({}, {timestamp:afterTime}, {upsert:true});
    try {
      const  item = await cur.next();
      afterTime = new Date(new Date(item.timestamp).getTime());
      await run(item);
    } catch(e) {
    }
  } 
  //run new transactions from dconnectlive
  processedData = (await processed.findOne())||{timestamp:new Date(0)};
  afterTime = processedData?processedData.timestamp:0;
console.log("AFTER",afterTime);
  let cursor = collection.find({timestamp:{$exists:true}, account:'dconnectlive', timestamp:{$gt:new Date(afterTime)}}).sort({timestamp:1});
  console.log('replaying new logs', await cursor.count()); 
  console.log(afterTime);
  while ( await cursor.hasNext() ) { 
    try { 
      const  item = await cursor.next();
      afterTime = new Date(new Date(item.timestamp).getTime());
      await processed.update({}, {timestamp:afterTime}, {upsert:true});
      await run(item);
    } catch(e) {
    }
  }
  collection.watch({account:'g4ztamjqhage'}).on('change', async (next) => {
    await run(next.fullDocument);
  });
}); 
});
const listener = app.listen(port, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
app.use(express.static('public'));


// Create a function to terminate your app gracefully:
async function gracefulShutdown(){
    if(db) db.close(false);
    if(rdb) rdb.close(false);
    process.exit();
}
 
process.stdin.resume(); 
process.on('exit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', gracefulShutdown);
