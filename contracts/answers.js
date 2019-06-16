let msg = '';
const questionCollection = await api.getCollection('question');
await questionCollection.find({sender:api.sender, solved:{$exists:false}}).forEach(async (question)=>{
 msg+="\`Q:"+question._id.toString()+": "+question.word+"\`\n";
 api.debug(question);
 question.answer.forEach((answer)=>{
  if(answer.answer && answer.id) msg+="A: "+answer.id+":"+answer.answer+"\n";
 })
 msg+="\n";
});
done(`Your questions: \n\n${msg}`);
