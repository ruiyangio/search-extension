'use strict';

function makeRequest(query) {
    chrome.storage.local.get(['access_token_key'], result => {
        const token = result['access_token_key'];
        fetch(makeQueryUrl(query), {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            method: 'get'
        }).then(response => {
            return response.json();
        }).then(data => {
            console.log(data);
        });
    });
}

function makeQueryUrl(query) {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    const params = {
        q: `fulltext contains '${query}'`
    };
    url.search = new URLSearchParams(params);
    return url.toString();
}

function attach() {
    const searchBox = document.querySelector('input[placeholder="Search in SharePoint"]');
    const searchButton = document.querySelector('button[aria-label="Search"]');
}

function searchHandler() {
    const typeFilterDiv = document.querySelector('.SPSearchUX-module__searchFilters___s1xp2').parentElement;
    const searchBox = document.querySelector('input[placeholder="Search in SharePoint"]');
    const searchQuery = searchBox.value;   
}

function toNode(html) {
    return new DOMParser().parseFromString(html, 'text/html').body.childNodes;
}

attach();
