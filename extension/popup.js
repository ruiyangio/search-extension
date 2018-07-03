'use strict';

const getToken = document.getElementById('getToken');
const getDropboxToken = document.getElementById('getDropboxToken');
const enableGoogleDrive = document.getElementById('enableGoogleDrive');
const enableDropbox = document.getElementById('enableDropbox');

chrome.storage.local.get(['drive_enabled', 'dropbox_enabled'], result => {
  setButtonTextAndStyle(enableGoogleDrive, result['drive_enabled']);
  setButtonTextAndStyle(enableDropbox, result['dropbox_enabled']);
});

getToken.onclick = () => {
  chrome.runtime.sendMessage({greeting: 'getToken'}, () => {
    console.log('Auth Process is called');
  });
};

getDropboxToken.onclick = () => {
  chrome.runtime.sendMessage({greeting: 'getDropboxToken'}, () => {
    console.log('Drop box auth Process is called');
  });
};

enableGoogleDrive.onclick = () => {
  chrome.storage.local.get(['drive_enabled'], result => {
    const enabled = !result['drive_enabled'];
    chrome.storage.local.set({'drive_enabled': enabled}, () =>{
      setButtonTextAndStyle(enableGoogleDrive, enabled);
    });
  });
};

enableDropbox.onclick = () => {
  chrome.storage.local.get(['dropbox_enabled'], result => {
    const enabled = !result['dropbox_enabled'];
    chrome.storage.local.set({'dropbox_enabled': enabled}, () =>{
      setButtonTextAndStyle(enableDropbox, enabled);
    });
  });
};

function setButtonTextAndStyle(buttonNode, enabled) {
  buttonNode.innerText = enabled ? 'Disable' : 'Enable';
  if (enabled) {
    buttonNode.classList.add('ext-btn-negative');
  }
  else {
    buttonNode.classList.remove('ext-btn-negative');
  }
}
