var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);

var dconnect = window.dconnect;

const article = dconnect.getParameterByName('article', window.location);
if(article) {
  loadArticle(article);
} else {
  loadIndex();
}        

dconnect.servers = ['https://dconnect.live'];
