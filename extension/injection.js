'use strict';

function makeRequest(query, callback) {
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
            callback(data);
        })
        .catch(error => {
            console.log('Search extension has encountered an error');
        });
    });
}

function makeQueryUrl(query) {
    const baseUrl = 'https://www.googleapis.com/drive/v3/files';
    return `${baseUrl}?fields=*&q=fullText contains '${query}'`;
}

function toNode(html) {
    return new DOMParser().parseFromString(html, 'text/html').body.childNodes[0];
}

function makeFileBlock(file) {
    return `
    <div style="float: left; margin-right: 10px; border: 1px solid #CCCCCC; padding: 10px; box-shadow: 0 0 1px #CCCCCC;">
        <div style="margin-left: auto; margin-right: auto; display: table; margin-bottom: 10px;">
            <a href="${file.webViewLink}">
                <img style="width: 60px; height: 45px" src="${file.thumbnailLink}" alt="Preview">
            </a>
        </div>
        <div>
            <img style="display: block; float: left; margin-top: 3px; margin-right: 6px;" src="${file.iconLink}" alt="Icon">
            <a href="${file.webViewLink}">${file.name}</a>
        </div>
    </div>
    `;
}

function searchHandler(e) {
    const driveDom = document.getElementById('drive_results');
    if (driveDom) {
        driveDom.remove();
    }

    const typeFilterDiv = document.querySelector('.SPSearchUX-module__searchFilters___s1xp2').parentElement;
    const searchBox = document.querySelector('input[placeholder="Search in SharePoint"]');
    const searchQuery = searchBox.value;
    if (!searchQuery) {
        return;
    }

    makeRequest(searchQuery, results => {
        if (results && results.files.length > 0) {
            let inner = '';
            results.files.forEach(file => {
                const fileBlock = makeFileBlock(file);
                inner += fileBlock;
            });
            const cardTemplate = `
            <div id="drive_results" style="padding-bottom: 100px;">
                <div style="margin-bottom: 15px;">
                    <span>Search results from:</span>
                    <a href="https://drive.google.com/drive">Google Drive</a>
                </div>
                ${inner}
            </div>`;
            const cardNode = toNode(cardTemplate);
            typeFilterDiv.appendChild(cardNode);
        }
    });
}

function attach() {
    const searchBox = document.querySelector('input[placeholder="Search in SharePoint"]');
    const searchButton = document.querySelector('button[aria-label="Search"]');
    if (!searchBox || !searchButton) {
        return;
    }

    searchButton.addEventListener('click', searchHandler);
}

attach();
