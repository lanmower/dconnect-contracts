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

api.debug('send', {sender:api.sender, payload:api.payload});

let [target, amount, tokenName=`FF`] = api.payload;
tokenName = tokenName.toUpperCase();

const token = await api.collection.findOne({_id:tokenName});
if(!token) throw new Error('token not found'); 
const tokenCollection = await api.getCollection(tokenName);
if(!tokenCollection) throw new Error('token collection not found');

amount = parseFloat(Number(amount).toFixed(4));
if(!amount || Number.isNaN(amount))  throw new Error('bad amount');

if(api.sender == target) throw new Error('can not send to self');

await change(api.sender, -amount, tokenName);
await change(target, amount, tokenName);
api.emit('transfer', {user:api.sender._id, amount, tokenName, to:target});
done(`sent ${amount} ${tokenName} to <@${target}>`);
