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
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
    if (request.greeting == 'getToken') {
      chrome.storage.local.get(['access_token_key'], result => {
        const cachedToken = result['access_token_key'];
        if (cachedToken) {
          chrome.identity.removeCachedAuthToken({token: cachedToken}, () => {
            chrome.identity.getAuthToken({'interactive': true}, token => {
              chrome.storage.local.set({'access_token_key': token}, () => {
                console.log('New Token is saved to local storage');
                sendResponse({farewell: 'gotToken'});
              });
            });
          });
        }
        else {
          chrome.identity.getAuthToken({ 'interactive': true }, token => {
            chrome.storage.local.set({'access_token_key': token}, () => {
              console.log('Token is saved to local storage');
              sendResponse({farewell: 'gotToken'});
            });
          });
        }
      });
    }
});
