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


//
ScatterJS.scatter.connect("Put_Your_App_Name_Here").then(connected => {
    // User does not have Scatter Desktop, Mobile or Classic installed.
    if(!connected) return false;

    const scatter = ScatterJS.scatter;
    -----------------------
    ^^^ See the section below about storing this in state.
    -----------------------

    window.ScatterJS = null;
    -----------------------
    ^^^ See the section below about nulling out the window reference
    -----------------------
});