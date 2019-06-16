const run = async () => {
  try {
    let msg = '';
    const questionCollection = await api.getCollection('question');
    await questionCollection.find({solved:{$exists:false}}).forEach(async (question)=>{
        msg+=question._id.toString()+":"+question.word+"\n";
    });
    done(msg);
  } catch (e) {
    done(e.message);
  }
}
run();