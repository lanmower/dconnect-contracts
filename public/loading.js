if(!dconnect) var dconnect = {};
if(!dconnect.init) dconnect.init = {};
dconnect.init.loading = (function() {
  this.eos = new Eos({
     httpEndpoint: 'https://dconnect.live',
     chainId: '342f1b4af05f4978a8f5d8e3e3e3761cb22dacf21a93e42abe0753bdacb6b621'
  });

  async function get(path, scope = 'dconnectlive', reverse = false) {
     const key = getHash(path);
     console.log(key);
     const resp = await eos.getTableRows({
         json: true,
         scope,
         code: 'dconnectlive',
         table:'posts',
         table_key: 'key',
         key_type: 'name',
         index_position: 2,
         lower_bound: key,
         upper_bound: key,
         limit: 1,
         reverse
     });

     if (resp.rows.length && resp.rows[0].key == key) return resp.rows[0];
  }

  async function getPrimary(key, scope = 'dconnectlive') {
     const resp = await this.eos.getTableRows({
         json: true,
         scope,
         code: 'dconnectlive',
         table,
         lower_bound: key,
         upper_bound: key,
         limit: 1
     });

     if (resp.rows.length && resp.rows[0].key == key) return resp.rows[0];
  }

  /*const swarm = ['/dns4/dconnect.live/tcp/4005/wss/ipfs/QmVaQgohmu7PyQNGJ74KgtvatwkWfz4LfJ4rtWAo6ph5fT', '/dns4/gostomp.co.za/tcp/4005/wss/ipfs/QmbRAcsHYWefgUMzcKPiKmCJf5PgyoXnT32pPvRFDF9che'];

  this.ipfs = new Ipfs({
    init:true,
    relay: {
      enabled: true,
      hop: {
        enabled: true
      }
    },
    EXPERIMENTAL: {
      pubsub: true // enable pubsub
    },
    config: {
      Bootstrap: []
    }
  })


  this.ipfs.on('ready', () => {
    console.log('IPFS READY, LOADING DCONNECT ENDPOINTS');
    for(let index = 0; index < swarm.length; index++) {
      console.log(swarm[index]);
      this.ipfs.swarm.connect(swarm[index], (err) => {
        if (err) {
          return console.error(err)
        }
      });
    }
    
  })
}).bind(window.dconnect);*/
dconnect.init.loading();