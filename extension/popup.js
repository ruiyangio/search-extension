'use strict';

const getToken = document.getElementById('getToken');
const attachScript = document.getElementById('attachScript');
const getDropboxToken = document.getElementById('getDropboxToken');

getToken.onclick = function() {
  chrome.runtime.sendMessage({greeting: 'getToken'}, () => {
    console.log('Auth Process is called');
  });
};

getDropboxToken.onclick = function() {
  chrome.runtime.sendMessage({greeting: 'getDropboxToken'}, () => {
    console.log('Drop box auth Process is called');
  });
};

attachScript.onclick = function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(tabs[0].id, {file: 'injection.js'});
  });
};
