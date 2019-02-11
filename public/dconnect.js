function httpRequest(method, url, done) {
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

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}


function insertHTML(file, elmnt) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {elmnt.innerHTML = this.responseText;}
      if (this.status == 404) {elmnt.innerHTML = "Page not found.";}
      /* Remove the attribute, and call this function once more: */
      elmnt.removeAttribute("w3-include-html");
    }
  }
  xhttp.open("GET", file, true);
  xhttp.send();
}

function includeHTMLTags() {
  var z, i, elmnt, file;
  /* Loop through a collection of all HTML elements: */
  z = document.getElementsByTagName("*");
  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    /*search for elements with a certain atrribute:*/
    file = elmnt.getAttribute("w3-include-html");
    if (file) {
      /* Make an HTTP request using the attribute value as the file name: */
      insertHTML(file, elmnt);
      includeHTMLTags();
      /* Exit the function: */
      return;
    }
    file = elmnt.getAttribute("w3-load-html");
    if (file) {
      /* Make an HTTP request using the attribute value as the file name: */
      elmnt.onclick = ()=>{insertHTML(file, elmnt); return false;}
      includeHTMLTags();
      /* Exit the function: */
      return;
    }
  }
}