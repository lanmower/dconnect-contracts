const express = require('express');
const app = express();

app.use(express.static('public'));

var MongoClient = require('mongodb').MongoClient;


MongoClient.connect(process.env.url, { useNewUrlParser: true,reconnectTries: 60, reconnectInterval: 1000}, async function(err, db) {
  let dbo = db.db("dconnectlive");
  let collection = await dbo.collection("transactions");
  
  let updateOps = {
    $match: {
      $and: [
        { operationType: "insert" }
      ]
    }
  };

  const changeStreamCursor = collection.watch([updateOps]);


  pollStream(changeStreamCursor);
  //this function polls a change stream and prints out each change as it comes in
  function pollStream(cursor) {
    while (cursor.hasNext()) {
        const change = cursor.next();
        print(JSON.stringify(change));
    }
    pollStream(cursor);
  }

  const listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
  }); 
});