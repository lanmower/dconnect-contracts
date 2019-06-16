const { VM, VMScript } = require('vm2');
const seedrandom = require('seedrandom');

class SmartContracts {
  static async executeSmartContract(
  transaction, jsVMTimeout, dbo
  ) {
    try {
      let {
        id,
        sender, 
	timestamp
      } = transaction;
      //console.log('count',await (await dbo.collection('dconnectlivequestion')).find().count());
      let action = transaction.action, contract=transaction.contract;
      // logs used to store events or errors
      const results = {
        logs: {
          errors: [],
          events: [],
          message: '',
        },
      }; 
      let collection = contract?await dbo.collection(contract):null;
      let contracts = await dbo.collection('contract');
      const rng = seedrandom(`${id}`);
      if(new Date(timestamp).getTime() > new Date("2019-05-28T14:05:33.000Z").getTime()) {
        if(sender == 'dconnectlive') return results;
        if(sender == 'g4ztamjqhage') sender = 'dconnectlive';
      }
      // initialize the state that will be available in the VM
      if(transaction.contract == 'system' && transaction.action == 'setcontract') {
         
	const payload = JSON.parse(transaction.payload);
        if(!payload.code || !payload.action) return results;
        //console.log("setting contract", sender, payload.action);
        await contracts.update({contract:sender, action:payload.action}, {$set:{contract:sender, view:payload.view, action:payload.action, code:payload.code}}, {upsert:true});
        results.logs.events.push({contract:"system", event:"setcontract", data:"contract stored"})
        return results;
      }   
      var payload = null, channel, server;
      var code = transaction.code;
      try {
	if(transaction.payload) {
	  const input = JSON.parse(transaction.payload);
          payload = input.data||[];
  	  if(input.author && sender == 'dconnectlive') sender = input.author;
	  channel = input.channel;
          server = input.server; 

	}
      } catch(e) {
      }
      const vmState = { 
        api: {
          sender,
          id,
          action, 
          collection,
	  time: timestamp, 
	  channel: channel,
          server:server,
          fromCollection:async (contract)=>{return (await dbo.collection(contract)).find},
          getCollection: (name)=>{return dbo.collection(contract+name)},
          payload,
          random: rng,
          debug: log => console.log(log),
	  message: msg => results.logs.message += msg,
          emit: (event, data) => typeof event === 'string' && results.logs.events.push({ contract, event, data }),
          assert: (condition, error) => {
            if (!condition && typeof error === 'string') {
              results.logs.errors.push(error);
	      throw(new Exception(error));
            }
            return condition;
          },
        },
      };
      let loadedcontract = await contracts.findOne({contract, action:action})||{code};
      if(loadedcontract.code == '' || !loadedcontract.code) throw new Error(`could not find action ${action} on contract ${contract}`);
      //console.log(contract, action, loadedcontract, sender, timestamp, payload);
      const msg = await SmartContracts.runContractCode(vmState, "try{const run = async () => {try{\n"+loadedcontract.code+"\n}catch(e){done(e.message)}};run();}catch(e){done(e.message);}", jsVMTimeout);
      if (msg) {
	results.logs.message += msg;
      }
      return results;
    } catch (e) {
      console.error(e);
      return { logs: { message: e.name+": "+e.message, errors: [`${e.name}: ${e.message}`] } };
    } 
  } 
  static runContractCode(vmState, contractCode, jsVMTimeout) {
    return new Promise((resolve, reject) => {
        const done = (message) => {
              clearTimeout(timeout);
              resolve(message);
            };
        const timeout = setTimeout( ()=>{
              reject({name:'timeout', message:'timed out'});
              clearTimeout(timeout);
        },jsVMTimeout);
      try { 
        const vm = new VM({
          timeout: jsVMTimeout,
          sandbox: {
            ...vmState,
            done,
          },
        }); 
        vm.run(contractCode).catch(err=>{
          resolve(err.message);
          clearTimeout(timeout);
	}); 
      } catch (err) {
        clearTimeout(timeout);
	resolve(err.message);
        //resolve(err.message);
      }
    }); 
  }
}
module.exports.SmartContracts = SmartContracts; 
