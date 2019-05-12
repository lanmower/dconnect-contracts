const { VM, VMScript } = require('vm2');
const seedrandom = require('seedrandom');


class SmartContracts {
  // execute the smart contract and perform actions on the database if needed
  static async executeSmartContract(
    transaction, timestamp, jsVMTimeout,
  ) {
    try {
      const {
        id,
        sender,
        contract,
        action,
        payload
      } = transaction;

      const payloadObj = payload ? JSON.parse(payload) : {};

      // logs used to store events or errors
      const results = {
        logs: {
          errors: [],
          events: [],
        },
      };

      const rng = seedrandom(`${id}`);

      // initialize the state that will be available in the VM
      const vmState = {
        api: {
          sender,
          id,
          action,
          payload: JSON.parse(JSON.stringify(payloadObj)),
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

      const error = await SmartContracts.runContractCode(vmState, contractCode, jsVMTimeout);

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
      // console.log('error', error);
      return { logs: { errors: [`${e.name}: ${e.message}`] } };
    }
  }

  // run the contractCode in a VM with the vmState as a state for the VM
  static runContractCode(vmState, contractCode, jsVMTimeout) {
    return new Promise((resolve) => {
      try {
         console.log('vmState', vmState)
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
        resolve(err);
      }
    });
  }

}

module.exports.SmartContracts = SmartContracts;
