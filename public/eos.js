window.network = {
    secured:true,
    host: "api.eosnewyork.io",
  port:443
}
window.config = {
  chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906', // 32 byte (64 char) hex string          
  expireInSeconds: 60,
  httpEndpoint: "http" + (network.secured ? 's' : '') + '://'  + network.host + ':' + network.port
};

window.eosPublic = new window.Eos(config);
ScatterJS.plugins(new ScatterEOS());

  const connectionOptions = {
     initTimeout: 10000,
    network
  }
  this.signin = async function signin ()  {
   if($('#loading'))$('#loading').style.display = 'block';
   connected = await ScatterJS.scatter.connect("dConnect", connectionOptions);
    if(!connected) {
      alert("Unable to connect to local wallet, please ensure that it is running.");
      return;
    }
     const scatter = dconnect.scatter = ScatterJS.scatter;
     if (!connected) {
         return false;
     }
     await scatter.suggestNetwork(network);
     await scatter.login();
     const actor = scatter.account('eos');
     const eosOptions = {
         expireInSeconds: 60
     };
     const eos = scatter.eos(network, Eos, eosOptions);

    window.actor = actor;
    window.signedin(actor);
  }
  
}).bind(dconnect)


dconnect.init.saving();