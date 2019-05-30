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
        contract,
        action,
	timestamp 
      } = transaction;
      // logs used to store events or errors
      const results = {
        logs: {
          errors: [],
          events: [],
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
        console.log("setting contract", sender, payload.action);
        await contracts.update({contract:sender, action:payload.action}, {$set:{contract:sender, action:payload.action, code:payload.code}}, {upsert:true});
        results.logs.events.push({contract:"system", event:"setcontract", data:"contract stored"})
        return results;
      }   
      var payload = null;
      try {
	if(transaction.payload) {
	  const input = JSON.parse(transaction.payload);
          payload = input.data;
  	  if(input.author && sender == 'dconnectlive') sender = input.author;
	  //console.log(payload, "read, sender changed to", input.author);
	}
      } catch(e) {
      }
      console.info(contract, action);
      //console.log(transaction);
      if(!payload) return results; 
      const vmState = { 
        api: { 
          sender,
          id,
          action, 
          collection,
	  time: timestamp, 
	  channel: input.channel,
          server:input.server,
          fromCollection:async (contract)=>{return (await dbo.collection(contract)).find},
          getCollection: (name)=>{return dbo.collection(contract+name)},
          payload: payload,
          random: rng,
          debug: log => {},//console.log(log), 
          emit: (event, data) => typeof event === 'string' && results.logs.events.push({ contract, event, data }),
          assert: (condition, error) => {
            if (!condition && typeof error === 'string') {
              results.logs.errors.push(error);
            }
            return condition;
          },
        },
      }; 
      const loadedcontract = await contracts.findOne({contract, action:action});
      
      if(!loadedcontract) return results;
      const error = await SmartContracts.runContractCode(vmState, "try{"+loadedcontract.code+"}catch(e){done();}", jsVMTimeout);
      if (error) {
        return { logs: { errors: [error] } };
      }
      return results;
    } catch (e) {
      //console.log('error', e); 
      return { logs: { errors: [`${e.name}: ${e.message}`] } };
    }
  } 
  static runContractCode(vmState, contractCode, jsVMTimeout) {
    return new Promise((resolve, reject) => {
      try { 
        let done = false;
        const timeout = setTimeout( ()=>{
              done = true;
              console.log('timeout');
              reject({name:'timeout', message:'timed out'});
              clearTimeout(timeout);
        },jsVMTimeout);
        const vm = new VM({
          timeout: jsVMTimeout,
          sandbox: {
            ...vmState,
            done: (error) => {
              clearTimeout(timeout);
              done = true;
              resolve(error);
            },
          },
        }); 

        vm.run(contractCode); 
      } catch (err) {
	console.error(err.message);
        resolve({
          logs: {
            errors: [err.message],
            events: [],
          },
        });
      }
    }); 
  }
}
module.exports.SmartContracts = SmartContracts; 
