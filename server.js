const express = require('express');
const app = express();

app.use(express.static('public'));

var MongoClient = require('mongodb').MongoClient;


MongoClient.connect(process.env.url, { useNewUrlParser: true,reconnectTries: 60, reconnectInterval: 1000}, async function(err, db) {
  let dbo = db.db("dconnectlive");
  let collection = await dbo.collection("transactions");
  
const changeStreamCursor = collection.watch();

  changeStreamCursor.on("change", function(change) {
      console.log(change);
    });
  const listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
  }); 
});