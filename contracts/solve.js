
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
  if(newamount < 0)  throw new Error(`can not apply ${amount} ${colname}: insufficient balance`);
  if(Number.isNaN(newamount) || newamount == null) throw new Error(`bad result ${newamount} adding ${amount} ${colname} to user ${_id}, original balance ${user.amount}`);
  let stats = (await nativeCollection.findOne({_id:'stats'}))||{amount:0};
  let statsamount = Number(parseFloat(stats.amount||0)+parseFloat(amount)).toFixed(4);
  if(statsamount < 0) throw new Error('stats can not be less than 0');
  if(statsamount > 1000000000000000000) throw new Error('can not exceed a trillion');
  await nativeCollection.update({_id:user._id}, {$set:{amount:Number(newamount).toFixed(4)}},{upsert:true});
  await nativeCollection.update({_id:'stats'}, {$set:{amount:statsamount}});
}



let id = api.payload.shift();
const questionCollection = await api.getCollection('question');
const question = await questionCollection.findOne({'answer.id':parseInt(id)});
if(!question) throw new Error('answer not found '+id) 
if(question.sender != api.sender) throw new Error(`you didn't ask that quesiton, ${JSON.stringify(question)}`);
await questionCollection.update({_id:parseInt(question._id)}, {$set:{solved:true}});
question.answer.forEach(async function(answer){
    if(answer.id == id) {
        await change(answer.sender, 0.05, 'FF');
        await change(api.sender, 0.05, 'FF');
    }
});
done(`solved: ${question.word} on ${question._id}`);
