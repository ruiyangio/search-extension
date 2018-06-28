'use strict';

const getToken = document.getElementById('getToken');
const attachScript = document.getElementById('attachScript');

getToken.onclick = function(element) {
  chrome.runtime.sendMessage({greeting: 'getToken'}, response => {
    console.log('Auth Process is called');
  });
};

attachScript.onclick = function(element) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(tabs[0].id, {file: 'injection.js'});
  });
};
