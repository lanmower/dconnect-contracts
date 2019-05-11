const express = require('express');
const app = express();

app.use(express.static('public'));
const Mongo = require('mongodb').MongoClient;
const conn = new Mongo("mongodb://localhost:27017/demo?replicaSet=rs");
const db = conn.getDB("demo");
const collection = db.stock; 

let updateOps = {
  $match: {
    $and: [
      { "updateDescription.updatedFields.quantity": { $lte: 10 } },
      { operationType: "update" }
    ]
  }
};

const changeStreamCursor = collection.watch([updateOps]);

pollStream(changeStreamCursor);

//this function polls a change stream and prints out each change as it comes in
function pollStream(cursor) {
  while (!cursor.isExhausted()) {
    if (cursor.hasNext()) {
      change = cursor.next();
      print(JSON.stringify(change));
    }
  }
  pollStream(cursor);
}

const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
}); 