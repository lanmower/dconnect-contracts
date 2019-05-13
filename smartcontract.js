var MongoClient = require('mongodb').MongoClient;
const { VM, VMScript } = require('vm2');
const seedrandom = require('seedrandom');
const contracts = {};
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
        action,
        payload
      } = transaction;
      // logs used to store events or errors
      const results = {
        logs: {
          errors: [],
          events: [],
        },
      };
      let collection = await dbo.collection(contract);
      const rng = seedrandom(`${id}`);
      // initialize the state that will be available in the VM
      if(transaction.contract == 'system' && transaction.action == 'setcontract') {
        const payload = JSON.parse(transaction.payload);
        if(!payload.code || !payload.contract || !payload.action) return results;
        console.log('setting contract', payload);
        if(!contracts[payload.action]) contracts[payload.action] = {};
        contracts[payload.action][payload.contract] = payload.code;
      }
      
      const vmState = {
        api: {
          sender,
          id,
          action,
          collection,
          fromCollection:async (contract)=>{return (await dbo.collection(contract)).find},
          payload: JSON.parse(payload),
          random: () => rng(),
          debug: log => console.log(log), // eslint-disable-line no-console
          // emit an event that will be stored in the logs
          emit: (event, data) => typeof event === 'string' && results.logs.events.push({ contract, event, data }),
          // add an error that will be stored in the logs
          assert: (condition, error) => {
            if (!condition && typeof error === 'string') {
              results.logs.errors.push(error);
            }
            return condition;
          },
        },
      };
      
      if(!contracts[contract]) return results;
      console.log('running contract');
      const error = await SmartContracts.runContractCode(vmState, contracts[contract], jsVMTimeout);
      if (error) {
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
  // run the contractCode in a VM with the vmState as a state for the VM
  static runContractCode(vmState, contractCode, jsVMTimeout) {
    return new Promise((resolve) => {
      try {
        //console.log('vmState', vmState)
        // run the code in the VM
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
