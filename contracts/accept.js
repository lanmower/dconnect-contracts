
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

let [_id] = api.payload;
if(!_id) throw(new Error('please add an offer id'));
const offerCollection = await api.getCollection('offers');
const offer = await offerCollection.findOne({_id:parseInt(_id)});
if(!offer) throw(new Error('offer not found'));

let tokenName = offer.tokenName.toUpperCase();
let targetName = offer.targetName.toUpperCase();
const token = await api.collection.findOne({_id:offer.tokenName.toUpperCase()});
const targetToken = await api.collection.findOne({_id:offer.targetName.toUpperCase()});

if(!token) throw(new Error('token not found')); 
if(!targetToken) throw(new Error('target token not found'));

const tokenCollection = await api.getCollection(offer.tokenName);
const targetTokenCollection = await api.getCollection(offer.targetName);

if(!tokenCollection) throw(new Error('token collection not found'));
if(!targetTokenCollection) throw(new Error('target collection not found'));

let amount = parseFloat(Number(offer.amount)).toFixed(4);
let targetAmount = parseFloat(Number(offer.targetAmount)).toFixed(4);

if(!amount || Number.isNaN(amount)) throw(new Error('bad amount'));
if(!offer.targetAmount || Number.isNaN(offer.targetAmount)) throw(new Error('bad target amount'));

await change(api.sender, amount, tokenName);
await change(api.sender, -targetAmount, targetName);
await change(offer.user, targetAmount, targetName);
await offerCollection.deleteOne({_id:parseInt(_id)});

api.emit('swap',{user:api.sender,amount,targetAmount,tokenName})

done(`accepted ${amount} ${tokenName}`);
