// Don't forget to tell ScatterJS which plugins you are using.
ScatterJS.plugins( new ScatterEOS() );

// Networks are used to reference certain blockchains.
// They let you get accounts and help you build signature providers.
const network = {
    blockchain:'eos',
    protocol:'https',
    host:'nodes.get-scatter.com',
    port:443,
    chainId:'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
}

// First we need to connect to the user's Scatter.
ScatterJS.scatter.connect('My-App').then(connected => {

    // If the user does not have Scatter or it is Locked or Closed this will return false;
    if(!connected) return false;
    console.log('loaded');
    window.scatter = ScatterJS.scatter;

    // Now we need to get an identity from the user.
    // We're also going to require an account that is connected to the network we're using.
    const requiredFields = { accounts:[network] };
    scatter.getIdentity(requiredFields).then(() => {

        // Always use the accounts you got back from Scatter. Never hardcode them even if you are prompting
        // the user for their account name beforehand. They could still give you a different account.
        const account = scatter.identity.accounts.find(x => x.blockchain === 'eos');

        // You can pass in any additional options you want into the eosjs reference.
        const eosOptions = { expireInSeconds:60 };

        // Get a proxy reference to eosjs which you can use to sign transactions with a user's Scatter.
        const eos = scatter.eos(network, Eos, eosOptions);

        // ----------------------------
        // Now that we have an identity,
        // an EOSIO account, and a reference
        // to an eosjs object we can send a transaction.
        // ----------------------------
        window.account = account;

        // Never assume the account's permission/authority. Always take it from the returned account.
        const transactionOptions = { authorization:[`${account.name}@${account.authority}`] };
/*       await eos.transaction({
         actions: [{
           account: 'dconnectlive',
           name: type,
           authorization: [{
             actor: actor.name,
             permission: 'active',
           }],
           data: {
             app: this.getHash('dconnect-blog'),
             account: actor.name,
             key: this.getHash(key),
             value:value
           },
         }]
       }, {
         blocksBehind: 9,
         expireSeconds: 180
       });*/

        /*eos.transfer(account.name, 'dconnectlive', '1.0000 EOS', 'memo', transactionOptions).then(trx => {
            // That's it!
            console.log(`Transaction ID: ${trx.transaction_id}`);
        }).catch(error => {
            console.error(error);
        });*/

    }).catch(error => {
        // The user rejected this request, or doesn't have the appropriate requirements.
        console.error(error);
    });
});
