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

async function create(tokenName) {
  const token = await api.collection.findOne({_id:tokenName});
  if(token) { done('token already exists'); return; }
  const tokenCollection = await api.getCollection(tokenName);
  await api.collection.insert({_id:tokenName, owner:api.sender},{upsert:true});
  await tokenCollection.update({_id:'stats'}, {$set:{amount:Number(0).toFixed(4)}},{upsert:true});
}

let [tokenName] = api.payload;
tokenName = tokenName.trim().toUpperCase();
if(!tokenName.length) throw new Error('please specify the name of the token you wish to create.')
const existingCount = await api.collection.find({owner:api.sender}).count(); 
await change(api.sender, -1,'FF')
create(tokenName)
done(`${tokenName} created, 1 FF deducted from your account`)

