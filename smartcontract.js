var MongoClient = require('mongodb').MongoClient;
const { VM, VMScript } = require('vm2');
const seedrandom = require('seedrandom');
const contracts = {};
class SmartContracts {
  // execute the smart contract and perform actions on the database if needed
  static async executeSmartContract(
  transaction, jsVMTimeout,
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
      MongoClient.connect(process.env.url, { useNewUrlParser: true,reconnectTries: 60, reconnectInterval: 1000}, async function(err, db) {
        let dbo = db.db("dconnectlive");
        let collection = await dbo.collection("transactions");
      });
      const rng = seedrandom(`${id}`);
      // prepare the db object that will be available in the VM
      const db = {
        find: (table, query) => ()=>{
        },
        findInContract: (contractName, table, query) =>{
        },
        findOne: (table, query) => {
        },
        findOneInContract: (contractName, table, query) =>{
        },
        insert: (table, record) => ()=>{
        },
        remove: (table, record) => ()=>{
        },
        update: (table, record) => ()=>{
        },
      };
      // initialize the state that will be available in the VM
      const vmState = {
        api: {
          sender,
          id,
          action,
          payload: JSON.parse(JSON.stringify(payload)),
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
      try {
        const payload = JSON.parse(transaction.payload);
        if(transaction.contract == 'system' && transaction.action == 'setcontract') {
          console.log('setting contract', payload.name, payload.code);
          contracts[payload.name] = payload.code;
        }
      } catch (e) {
      }
      console.log(contract, contracts);
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
      // console.error('ERROR DURING CONTRACT EXECUTION: ', e);
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
        console.log(err);
        resolve(err);
      }
    }); 
  }
}
module.exports.SmartContracts = SmartContracts;
