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
        action
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
      // initialize the state that will be available in the VM
      if(transaction.contract == 'system' && transaction.action == 'setcontract') {
	  const payload = JSON.parse(transaction.payload);
        if(!payload.code || !payload.action) return results;
        //console.log("setting contract", {contract:sender, action:payload.action, code:payload.code});
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
      console.log(contract, action, payload);
      if(!payload) return results; 
      const vmState = { 
        api: { 
          sender,
          id,
          action,
          collection,
	  time: new Date(transaction.timestamp).getTime(),
          fromCollection:async (contract)=>{return (await dbo.collection(contract)).find},
          payload: payload,
          random: () => rng(),
          debug: log => console.log(log), 
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
      const error = await SmartContracts.runContractCode(vmState, loadedcontract.code, jsVMTimeout);
      if (error) {
        return { logs: { errors: [error] } };
      }
      return results;
    } catch (e) {
      console.log('error', e); 
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
	console.error(err);
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