/* eslint-disable */
var invalidPrototcolRegex = /^(%20|\s)*(javascript|data)/im;
var ctrlCharactersRegex = /[^\x20-\x7E]/gmi;
var urlSchemeRegex = /^([^:]+):/gm;
var relativeFirstCharacters = ['.', '/']

function isRelativeUrl(url) {
  return relativeFirstCharacters.indexOf(url[0]) > -1;
}

function sanitizeUrl(url) {
  var urlScheme, urlSchemeParseResults;
  var sanitizedUrl = url.replace(ctrlCharactersRegex, '');

  if (isRelativeUrl(sanitizedUrl)) {
    return sanitizedUrl;
  }

  urlSchemeParseResults = sanitizedUrl.match(urlSchemeRegex);
  if (!urlSchemeParseResults) {
    return 'about:blank';
  }

  urlScheme = urlSchemeParseResults[0];
  if (invalidPrototcolRegex.test(urlScheme)) {
    return 'about:blank';
  }

  return sanitizedUrl;
}


var defaultIndex = 0;
if(this.location.protocol === "https:"){
  defaultIndex = 1;
}
const network = {
    blockchain: 'eos',
    protocol: 'https',
    host: 'dconnect.live',
    port: 443,
    chainId: '342f1b4af05f4978a8f5d8e3e3e3761cb22dacf21a93e42abe0753bdacb6b621',
    secured: true,
    token: {
      contract: 'eosio.token',
      symbol: 'FF',
      decimals: '4',
    }
}

var eosVoter = class {
  constructor() {    
    this.eos = null;
  }

  addTd(text) {
    var td = document.createElement('td');
    td.innerHTML = text;
    return td;
  }

  reg(errorHandler, successHandler) {    
    this.verifyScatter();
    this.working = true;
    this.eos.regproducer(this.name, document.getElementById("producerkey").value, "www.google.com", 10)
  }
  
  vote(errorHandler, successHandler) {    
    document.getElementById("vote_button").disabled = true;
    this.verifyScatter();
    this.working = true;
    return this.eos.transaction(tr => {
      var accountName = this.name;
      return tr.voteproducer(accountName, "", this.getSelectedBPs());
    }).then(res => {
      document.getElementById("vote_button").disabled = false;
      this.voteSuccess(res);
      this.working = false;
    }).catch(error => {
      document.getElementById("vote_button").disabled = false;
      this.voteError(error);
      this.working = false;
    });
  }

  getSelectedBPs() {
    var selected = [];
    document.getElementsByName("bpVote").forEach(function (bp) {
      if (bp.checked)
        selected.push(bp.value);
    });
    selected.sort();
    if (selected.length > 30) {
      var msg = '<div class="alert alert-danger"> Too many block producers in vote (maximum 30)</div>';
      document.getElementById("messages").innerHTML = msg;
      document.getElementById("vote_button").disabled = true;
    }
    else {
      document.getElementById("messages").innerHTML = '';
      if (!this.working)
        document.getElementById("vote_button").disabled = false;
    }
    return selected;
  }


  bpClick() {
    var bps = voter.getSelectedBPs();
  }

  voteSuccess(res) {
    console.log(res);
    var msg = '<div class="alert alert-success">' + "Vote Successfully Submitted" + '</div>';
    document.getElementById("messages").innerHTML = msg;
  }

  voteError(res) {
    console.log(res);
    var msg = '<div class="alert alert-danger">' + res.message + '</div>';
    document.getElementById("messages").innerHTML = msg;
  }

  populateBPs() {
    return this.eosPublic.getTableRows({
      "json": true,
      "scope": 'eosio',
      "code": 'eosio',
      "table": "producers",
      "limit": 500
    });
  }

  refreshBPs() {
    var eosOptions = {};
    var table;

    var config = {
      chainId: network.chainId, // 32 byte (64 char) hex string          
      expireInSeconds: 60,
      httpEndpoint: "http" + (network.secured ? 's' : '') + '://'  + network.host + ':' + network.port
    };

    this.eosPublic = new Eos(config);
    this.populateBPs().then(res => {
      console.log(res);
      this.buildTable(res);
    });

  }

  async verifyScatter() {
     const connectionOptions = {
       initTimeout: 10000
     }
    ScatterJS.plugins(new ScatterEOS());
    await ScatterJS.scatter.connect("moonshine's keypair test", connectionOptions);
    this.scatter = window.scatter = ScatterJS.scatter;
  }

  buildTable(res) {
    var table = document.getElementsByTagName('tbody')[0];
    const promoted = 'eosliquideos';
    this.countTotalVotes(res);
    var ranked = res.rows.slice(0);
    var sorted = res.rows.slice(0);
    var rankings = {};
    ranked.sort((a, b) => Number(a.total_votes) > Number(b.total_votes) ? -1 : 1);
    sorted.sort((a, b) => a.owner === promoted ? -1 : b.owner === promoted ? 1 : Number(a.total_votes) > Number(b.total_votes) ? -1 : 1);
    ranked.forEach(function(item,index) {rankings[item.owner]=index+1;});
    for (var i = 0; i < sorted.length; i++) {
      var row = sorted[i];
      var rowSanitized = sanitizeUrl(row.url);
      var tr = document.createElement('tr');
      table.append(tr);
      tr.append(this.addTd('<input name="bpVote" type="checkbox" value="' + row.owner + '" ' + (row.owner === promoted ? 'checked' : '') + ' >'));
      tr.append(this.addTd(rankings[row.owner]));    
      tr.append(this.addTd("<a href='" + rowSanitized + "'>" + row.owner + "</a>"));
      tr.append(this.addTd(this.cleanNumber(row.total_votes)));
      tr.append(this.addTd(this.createProgressBar(this.cleanPercent(this.voteNumber(row.total_votes) / this.votes))));
    }
    document.getElementsByName("bpVote").forEach(e => {
      e.onclick = this.bpClick;
    });
    return table;
  }

  countTotalVotes(res) {
    this.votes = 0;
    for (var i = res.rows.length - 1; i >= 0; i--) {
      this.votes += this.voteNumber(res.rows[i].total_votes);
    }
  }

  search() {
    var input, filter, table, tr, td, i;
    input = document.getElementById("search");
    filter = input.value.toUpperCase();
    table = document.getElementById("bps");
    tr = table.getElementsByTagName("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 1; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[1];
      if (td) {
        if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
    }
  }

  voteNumber(total_votes) {
    return parseInt(parseInt(total_votes) / 1e10 * 2.8);
  }
  cleanNumber(num) {
    num = this.voteNumber(num);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }
  createProgressBar(pct) {
    return '<span>' + pct + '</span>';
  }
  cleanPercent(num) {
    return Math.round(num * 10000) / 100 + "%";
  }

   async suggestNetwork()  {
	    await (res => console.log(res));
    }

    async load() {
    await this.verifyScatter();
    
    const net = {
        blockchain: network.blockchain,
        protocol: network.protocol,
        host: network.host,
        port: network.port,
        chainId: network.chainId,
        secured: network.secured,
        token: network.token
	    };

    
    return this.scatter.suggestNetwork(ScatterJS.Network.fromJson(net)).then((selectedNetwork) => {
      const requiredFields = { accounts: [{ blockchain: 'eos', chainId: net.chainId }] };
      this.eos = window.eo = this.scatter.eos(net, Eos, {chainId:net.chainId}, net.secured ? 'https' : undefined);
      return scatter.getIdentity(requiredFields).then(identity => {
        if (identity.accounts.length === 0) return
        var accountName = identity.accounts[0].name;

        this.name = accountName;
        document.getElementById("producerform").style.display = "block";
        document.getElementById("vote_button").innerHTML = "Vote with Scatter";
        inited = true;

      });
    });
  }
}
var inited = false;
var voter = new eosVoter();
document.getElementById("vote_button").addEventListener('click', function () {
  initScatterOrVote();
});

// this is actually initScatterOrVote now
function initScatterOrVote(){
  if(!inited){
    voter.load();
    return;
  }
  voter.vote();  
}

document.addEventListener('scatterLoaded', scatterExtension => {
  document.getElementById("vote_button").innerHTML = "Init Scatter"
  document.getElementById("vote_button").disabled = false;  
});
voter.refreshBPs();
voter.load();
document.getElementById("producerform").onsubmit = (e)=>{
  e.preventDefault();
  voter.reg();
  return false;
};
