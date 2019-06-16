async function loadUser(_id, tokenCollection) {
  let user = (await tokenCollection.findOne({_id}))||{_id, amount:0};
  user.amount = parseFloat(Number(user.amount).toFixed(4));
  if(Number.isNaN(user.amount) || user.amount == null) { user.amount = 0; }
  return user;
}

async function change(_id, amount, colname) {
  const nativeCollection = await api.getCollection(colname);
  let user = await loadUser(_id, nativeCollection);
  if(!user) throw new Error('no user');
  if(typeof user._id != 'string') throw new Error('invalid id');
  let newamount = parseFloat(user.amount)+parseFloat(amount);
  if(newamount < 0)  throw new Error(`can not apply ${amount} ${colname}: insufficient balance`);
  if(Number.isNaN(newamount) || newamount == null) throw new Error(`bad result ${newamount} adding ${amount} ${colname} to user ${_id}, original balance ${user.amount}`);
  let stats = (await nativeCollection.findOne({_id:'stats'}))||{amount:0};
  let statsamount = Number(parseFloat(stats.amount||0)+parseFloat(amount)).toFixed(4);
  if(statsamount < 0) throw new Error('stats can not be less than 0');
  if(statsamount > 1000000000000000000) throw new Error('can not exceed a trillion');
  await nativeCollection.update({_id:user._id}, {$set:{amount:Number(newamount).toFixed(4)}},{upsert:true});
  await nativeCollection.update({_id:'stats'}, {$set:{amount:statsamount}});
}


let [amount, tokenName, targetAmount, targetName] = api.payload;
if(!amount || !tokenName || !targetAmount || !targetName) {
  throw new Error('try: amount symbol amount symbol');
}
tokenName = tokenName.toUpperCase();
targetName = targetName.toUpperCase();

const token = await api.collection.findOne({_id:tokenName});
const target = await api.collection.findOne({_id:targetName});

if(!token) throw new Error(`token ${tokenName} not found`); 
if(!target) throw new Error(`target ${targetName} not found`);

const tokenCollection = await api.getCollection(tokenName);
const targetCollection = await api.getCollection(targetName);
const offerCollection = await api.getCollection('offers');

if(!tokenCollection) { done('token collection not found'); return; }
if(!targetCollection) { done('target collection not found'); return; }

amount = parseFloat(Number(amount).toFixed(4));
targetAmount = parseFloat(Number(targetAmount).toFixed(4));
if(!amount || Number.isNaN(amount)) throw new Error('bad amount');
if(!targetAmount || Number.isNaN(targetAmount)) new Error('bad target amount'); 

change(api.sender, -amount, tokenName);

let _id = api.random.int32();
_id = _id>0?_id:-_id;
await offerCollection.insert({_id, user:api.sender, tokenName, amount, targetAmount, targetName, time:api.time});
api.debug(["TIME", api.time]);
await offerCollection.find().forEach(async (item)=>{
  if(item._id < 0 || !item.time || api.time > item.time+2592000000) {
    await offerCollection.deleteOne({_id:item._id});
    const u = await loadUser(item.user, tokenCollection);
    if(u && !Number.isNaN(u.amount)) await tokenCollection.update({_id:item.user}, {$set:{amount:Number(parseFloat(u.amount)+parseFloat(item.amount)).toFixed(4)}},{upsert:true});
  }
});

api.emit('offer',{user:api.sender,amount, targetAmount,tokenName})

done(`placed offer: ${amount} ${tokenName} for ${targetAmount} ${targetName}`);