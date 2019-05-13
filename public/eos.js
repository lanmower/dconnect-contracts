ScatterJS.plugins( new ScatterEOS() );

const network = {
    blockchain:'eos',
    protocol:'https',
    host:'nodes.get-scatter.com',
    port:443,
    chainId:'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
}
ScatterJS.scatter.connect('dconnectlive').then(connected => {
    if(!connected) return false;
    window.scatter = ScatterJS.scatter;
    const requiredFields = { accounts:[network] };
    scatter.getIdentity(requiredFields).then(() => {
        const account = scatter.identity.accounts.find(x => x.blockchain === 'eos');
        const eosOptions = { expireInSeconds:60 };
        window.eos = scatter.eos(network, Eos, eosOptions);
        window.account = account;
        const transactionOptions = { authorization:[`${account.name}@${account.authority}`] };
    }).catch(error => {
        console.error(error);
    });
});
