var MongoClient = require('mongodb').MongoClient;
const { VM, VMScript } = require('vm2');
const seedrandom = require('seedrandom');
class SmartContracts {
  // execute the smart contract and perform actions on the database if needed
  static async executeSmartContract(
  transaction, jsVMTimeout, dbo
  ) {
    try {
      const {
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
      let collection = await dbo.collection(contract);
      let contracts = await dbo.collection('contract');
      const rng = seedrandom(`${id}`);
      // initialize the state that will be available in the VM
      var payload = null;
      try {
        payload = JSON.parse(transaction.payload);
      } catch(e) {
      }
      if(transaction.contract == 'system' && transaction.action == 'setcontract') {
        if(!payload.code || !payload.contract || !payload.action) return results;
        await contracts.update({contract:sender, action:payload.action}, {$set:{contract:sender, action:payload.action, code:payload.code}});
      }
      const vmState = {
        api: {
          sender,
          id,
          action,
          collection,
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
      if(!contracts[contract]) return results;

      const error = await SmartContracts.runContractCode(vmState, contracts[contract][action], jsVMTimeout);
      if (error) {
        console.log(error);
        const { name, message } = error;
        if (name && typeof name === 'string'
            && message && typeof message === 'string') {
          return { logs: { errors: [`${name}: ${message}`] } };
        }
        return { logs: { errors: ['unknown error'] } };
      }
      return results;
    } catch (e) {
      console.log('error', e); 
      return { logs: { errors: [`${e.name}: ${e.message}`] } };
    }
  }

  static runContractCode(vmState, contractCode, jsVMTimeout) {
    return new Promise((resolve) => {
      try {
        const vm = new VM({
          timeout: jsVMTimeout,
          sandbox: {
            ...vmState,
            done: (error) => {
              resolve(error);
            },
          },
        });
        vm.run(contractCode);
      } catch (err) {
        resolve({
          logs: {
            errors: [err],
            events: [],
          },
        });
      }
    }); 
  }
}
module.exports.SmartContracts = SmartContracts;
