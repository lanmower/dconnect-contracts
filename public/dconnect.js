var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);

function httpRequest(method, url, done) {
  var xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.setRequestHeader('cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
  xhr.setRequestHeader('cache-control', 'max-age=0');
  xhr.setRequestHeader('expires', '0');
  xhr.setRequestHeader('expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
  xhr.setRequestHeader('pragma', 'no-cache');
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
      if (this.status == 200) {
        elmnt.innerHTML = this.responseText;
        runScripts(elmnt);
      }
      if (this.status == 404) {elmnt.innerHTML = "Page not found.";}
      /* Remove the attribute, and call this function once more: */
      elmnt.removeAttribute("w3-include-html");
    }
  }
  xhttp.open("GET", file, true);
  xhttp.setRequestHeader('cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
  xhttp.setRequestHeader('cache-control', 'max-age=0');
  xhttp.setRequestHeader('expires', '0');
  xhttp.setRequestHeader('expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
  xhttp.setRequestHeader('pragma', 'no-cache');
  xhttp.send();
}

function includeHTMLTags() {
  var z, i, elmnt, file;
  /* Loop through a collection of all HTML elements: */
  z = document.getElementsByTagName("*");
  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    file = null;
    /*search for elements with a certain atrribute:*/
    file = elmnt.getAttribute("w3-include-html");
    if (file) {
      /* Make an HTTP request using the attribute value as the file name: */
      insertHTML(file, elmnt);
      elmnt.removeAttribute("w3-include-html");
      setTimeout(()=>{includeHTMLTags();}, 0);
      /* Exit the function: */
      return;
    }
    file = elmnt.getAttribute("w3-load-html");
    const target = elmnt.getAttribute("target");
    
    console.log(file);
    if (file) {
      /* Make an HTTP request using the attribute value as the file name: */
      elmnt.onclick = ()=>{insertHTML(file, $(target)); return false;}
      elmnt.removeAttribute("w3-load-html");
      setTimeout(()=>{includeHTMLTags();}, 0);
      /* Exit the function: */
      return;
    }
  }
}


window.addEventListener('load', function () {
  includeHTMLTags();
}, false);

function insertScript ($script, callback) {
  var s = document.createElement('script')
  s.type = 'text/javascript'
  if ($script.src) {
    s.onload = callback
    s.onerror = callback
    s.src = $script.src
  } else {
    s.textContent = $script.innerText
  }

  // re-insert the script tag so it executes.
  document.head.appendChild(s)

  // clean-up
  $script.parentNode.removeChild($script)

  // run the callback immediately for inline scripts
  if (!$script.src) {
    callback()
  }
}

// https://html.spec.whatwg.org/multipage/scripting.html
var runScriptTypes = [
  'application/javascript',
  'application/ecmascript',
  'application/x-ecmascript',
  'application/x-javascript',
  'text/ecmascript',
  'text/javascript',
  'text/javascript1.0',
  'text/javascript1.1',
  'text/javascript1.2',
  'text/javascript1.3',
  'text/javascript1.4',
  'text/javascript1.5',
  'text/jscript',
  'text/livescript',
  'text/x-ecmascript',
  'text/x-javascript'
]
// runs an array of async functions in sequential order
function seq (arr, callback=()=>{}, index) {
  // first call, without an index
  if (typeof index === 'undefined') {
    index = 0
  }
  if(!arr[index]) return;
  arr[index](function () {
    index++
    if (index === arr.length) {
      callback()
    } else {
      seq(arr, callback, index)
    }
  })
}

function runScripts ($container) {
  // get scripts tags from a node
  var $scripts = $container.querySelectorAll('script')
  var runList = []
  var typeAttr

  [].forEach.call($scripts, function ($script) {
    typeAttr = $script.getAttribute('type')

    // only run script tags without the type attribute
    // or with a javascript mime attribute value
    if (!typeAttr || runScriptTypes.indexOf(typeAttr) !== -1) {
      runList.push(function (callback) {
        insertScript($script, callback)
      })
    }
  })

  // insert the script tags sequentially
  // to preserve execution order
  seq(runList)
}

