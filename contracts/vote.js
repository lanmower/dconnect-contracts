let channel = api.channel;
if(!channel) {
  done('no channel');
  return;
}
let word = api.payload.join(' ');
if(!word.trim().length) throw new Error('you have to vote for something');
let words = {};
const voteCollection = await api.getCollection('votes');
await voteCollection.deleteMany({timestamp:{$lt:new Date(new Date(api.time).getTime()-600000)}})
await voteCollection.update({sender:api.sender, channel},{$set:{timestamp:new Date(api.time), sender:api.sender, word, channel}}, {upsert:true});
await voteCollection.find({channel}).forEach((vote)=>{
  words[vote.word] = words[vote.word]+1||1;
})
msg = '';
Object.keys(words).forEach((word)=>{
  msg += `${word}:${words[word]}\n`;
});
done(`voted ${word}\n\n\`\`\`Votes:\n${msg}\`\`\``);
