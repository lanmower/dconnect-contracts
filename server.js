const express = require('express');
const app = express();

app.use(express.static('public'));

var MongoClient = require('mongodb').MongoClient;


MongoClient.connect(process.env.url, { useNewUrlParser: true,reconnectTries: 60, reconnectInterval: 1000}, async function(err, db) {
  let dbo = db.db("dconnectlive");
  let collection = await dbo.collection("transactions");
  
const changeStreamCursor = collection.watch();
resumeStream(changeStreamCursor, true);

function resumeStream(changeStreamCursor, forceResume = false) {
  let resumeToken;
  while (!changeStreamCursor.isExhausted()) {
    if (changeStreamCursor.hasNext()) {
      change = changeStreamCursor.next();
      print(JSON.stringify(change));
      resumeToken = change._id;
      if (forceResume === true) {
        print("\r\nSimulating app failure for 10 seconds...");
        sleepFor(10000);
        changeStreamCursor.close();
        const newChangeStreamCursor = collection.watch([], {
          resumeAfter: resumeToken
        });
        print("\r\nResuming change stream with token " + JSON.stringify(resumeToken) + "\r\n");
        resumeStream(newChangeStreamCursor);
      }
    }
  }
}
  resumeStream(changeStreamCursor, forceResume);
  const listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
  }); 
});