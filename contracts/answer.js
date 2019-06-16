let _id = api.payload.shift();
let answer = api.payload.join(' ');
if(!answer.trim().length) throw(new Error('you have to answer the question'));
const questionCollection = await api.getCollection('question');
let id = api.random.int32();
id = id>0?id:-id;
await questionCollection.update({_id:parseInt(_id)}, {$push:{answer:{id, sender:api.sender, answer}}});
done(`answered: ${answer} on ${_id}`);
