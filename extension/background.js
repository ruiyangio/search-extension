'use strict';

chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'microsoft.sharepoint.com'},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });

  chrome.storage.local.set({'drive_enabled': false, 'dropbox_enabled': false}, () => {
    console.log('Google drive and Dropbox are disabled by default');
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
    if (request.greeting == 'getToken') {
      chrome.storage.local.get(['access_token_key'], result => {
        const cachedToken = result['access_token_key'];
        if (cachedToken) {
          chrome.identity.removeCachedAuthToken({token: cachedToken}, () => {
            getAuthTokenAndSave(sendResponse);
          });
        }
        else {
          getAuthTokenAndSave(sendResponse);
        }
      });
    }
    else if (request.greeting == 'getDropboxToken') {
      const dbx = new Dropbox.Dropbox({ clientId: 'uwejgdzhrwuof2v' });
      const authUrl = dbx.getAuthenticationUrl('https://microsoft.sharepoint.com');
      console.log(authUrl);
      chrome.tabs.create({ url: authUrl, active: false });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
      const url = new URL(changeInfo.url);
      const token = getQueryParam(url.hash.substring(1), 'access_token');
      if (!token || url.host !== 'microsoft.sharepoint.com') {
        return;
      } 
      chrome.storage.local.set({'drop_box_access_token_key': token}, () => {
        console.log(`Dropbox token is saved to local storage ${ token }`);
        chrome.tabs.remove(tabId, () => {
          console.log(`${ tabId } is closed`);
        });
      });
    }
  }
);

function getQueryParam(query, q) {
  const parts = query.split('&');
  for (let i = 0; i < parts.length; i++) {
      const pair = parts[i].split('=');
      if (decodeURIComponent(pair[0]) == q) {
          return decodeURIComponent(pair[1]);
      }
  }
}

function getAuthTokenAndSave(sendResponse, interactive = true) {
  chrome.identity.getAuthToken({ 'interactive': interactive }, token => {
    chrome.storage.local.set({'access_token_key': token}, () => {
      console.log(`Token is saved to local storage`);
      sendResponse({ message: 'Token is saved' });
    });
  });
}
