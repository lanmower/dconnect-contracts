window.network = {
  blockchain: 'eos',
  protocol: 'https',
  host: 'dconnect.live',
  port: 443,
  chainId: '342f1b4af05f4978a8f5d8e3e3e3761cb22dacf21a93e42abe0753bdacb6b621',
  secured: true
}
window.config = {
  chainId: network.chainId, // 32 byte (64 char) hex string          
  expireInSeconds: 60,
  httpEndpoint: "http" + (network.secured ? 's' : '') + '://'  + network.host + ':' + network.port
};

window.eosPublic = new window.Eos(config);
$('#searchform').onsubmit = async ()=>{
  console.log('test');
  const search = $('#search').value;
  console.log(search);
  $('#searchoutput').innerHTML = JSON.stringify(await eosPublic.getAccount(search));
};