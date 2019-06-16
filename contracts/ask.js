async function loadUser(_id, tokenCollection) {
  let user = (await tokenCollection.findOne({_id}))||{_id, amount:0};
  user.amount = parseFloat(Number(user.amount).toFixed(4));
  if(Number.isNaN(user.amount) || user.amount == null) { user.amount = 0; }
  if(!user) { done('no user'); return; }
  if(typeof user._id != 'string') { done(`invalid id, ${user._id}, ${_id}`); return; }
  return user;
}
async function change(_id, amount, colname) {
  const nativeCollection = await api.getCollection(colname);
  let user = await loadUser(_id, nativeCollection);
  if(!user) throw new Error('no user');
  if(typeof user._id != 'string') throw new Error(`invalid id, ${user._id}`);
  let newamount = parseFloat(user.amount)+parseFloat(amount);
  if(newamount < 0)  throw new Error('can not apply ${amount} ${coinname}: insufficient balance');
  if(Number.isNaN(newamount) || newamount == null) throw new Error(`bad result ${newamount} adding ${amount} ${colname} to user ${_id}, original balance ${user.amount}`);
  let stats = (await nativeCollection.findOne({_id:'stats'}))||{amount:0};
  let statsamount = Number(parseFloat(stats.amount||0)+parseFloat(amount)).toFixed(4);
  if(statsamount < 0) throw new Error('stats can not be less than 0');
  if(statsamount > 1000000000000000000) throw new Error('can not exceed a trillion');
  await nativeCollection.update({_id:user._id}, {$set:{amount:Number(newamount).toFixed(4)}},{upsert:true});
  await nativeCollection.update({_id:'stats'}, {$set:{amount:statsamount}});
}


let word = api.payload.join(' ');
if(!word.trim().length) throw(new Error('you have to ask something'));
const questionCollection = await api.getCollection('question');
let _id = api.random.int32();
_id = _id>0?_id:-_id;

await change(api.sender, -0.10, 'FF')
await questionCollection.insert({_id, timestamp:new Date(api.time), sender:api.sender, word, server:api.server, channel:api.channel, answer:[]});
done(`listed: ${word}`)