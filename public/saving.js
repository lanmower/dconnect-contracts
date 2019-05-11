if(!dconnect) var dconnect = {};
if(!dconnect.init) dconnect.init = {};
dconnect.init.saving = (function() {

  this.httpRequest = function httpRequest(method, url, done=console.log) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
      done(null, xhr.response);
    };
    xhr.onerror = function () {
      done(xhr.response);
    };
    xhr.send();
  }

  ScatterJS.plugins(new ScatterEOS());
  
  const network = dconnect.network =  {
         blockchain: 'eos',
         protocol: 'https',
         host: 'dconnect.live',
         port: 443,
         chainId: '342f1b4af05f4978a8f5d8e3e3e3761cb22dacf21a93e42abe0753bdacb6b621'
     };

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

     this.save = async (key, value, type = "set") => {
       await eos.transaction({
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
       });
     }

     this.vote = async (vote, memo, amount = 0.1, pk = 0) => {
       const balance = (await dconnect.eos.getCurrencyBalance("glitchtester", "moonshine", "STOKE"))[0];
       const splitbalance = balance.split(' ')[0];
       const floatbalance = parseFloat(splitbalance);
       if(floatbalance*amount < 1) {
         alert("not enough to process reward, please wait 24h for your tokens to increase");
         return;
       }
       const quantity = Number(Math.ceil(floatbalance*amount));
       await eos.transaction({
          actions: [{
           account: 'glitchtester',
           name: 'reward',
           authorization: [{
             actor: actor.name,
             permission: 'active',
           }],
           data: {
             to: actor.name,
             vote,
             quantity: ""+quantity.toFixed(4)+" STOKE",
             memo,
             content:pk             
           }
         }]
       }, {
         blocksBehind: 9,
         expireSeconds: 180
       });
     }

     this.erase = async (primary) => {
      const actor = scatter.identity.accounts.find(x => x.blockchain === 'eos');
      const eosOptions = {
          expireInSeconds: 60
      };
      await eos.transaction({
        actions: [{
          account: 'dconnectlive',
          name: 'erase',
          authorization: [{
            actor: actor.name,
            permission: 'active',
          }],
          data: {
            app: this.getHash('dconnect-blog'),
            account: actor.name,
            primary: primary
          },
        }]
      }, {
        blocksBehind: 9,
        expireSeconds: 180
      });
    }
    dconnect.actor = actor;
    dconnect.signedin(actor);
  }
  
}).bind(dconnect)


dconnect.init.saving();