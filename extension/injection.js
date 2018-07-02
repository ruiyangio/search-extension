'use strict';

function searchGoogleDrive(query, callback) {
    chrome.storage.local.get(['access_token_key'], result => {
        const token = result['access_token_key'];
        fetch(makeQueryUrl(query), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            method: 'get'
        }).then(response => {
            return response.json();
        }).then(data => {
            callback(data);
        })
        .catch(error => {
            console.log('Search extension has encountered an error');
            console.log(error);
        });
    });
}

function searchDropbox(query, callback) {
    chrome.storage.local.get(['drop_box_access_token_key'], result => {
        const token = result['drop_box_access_token_key'];
        fetch('https://api.dropboxapi.com/2/files/search', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            method: 'post',
            body: makeDropboxQueryPayload(query)
        }).then(response => {
            return response.json();
        }).then(data => {
            if (data.matches && data.matches.length > 0) {
                const files = data.matches.reduce((res, matched) => {
                    res.push({
                        path: matched.metadata.path_lower,
                        name: matched.metadata.name
                    });
                    return res;
                }, []);

                return Promise
                .all(files.map(fetchDropboxThumbnail.bind({token: token})));
            }
        })
        .then(images => {
            callback(images);
        })
        .catch(error => {
            console.log('Search extension has encountered an error while calling Dropbox');
            console.log(error);
        });
    });
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = [].slice.call(new Uint8Array(buffer));

    bytes.forEach((b) => binary += String.fromCharCode(b));
    return window.btoa(binary);
};

function fetchDropboxThumbnail(file) {
    return fetch('https://content.dropboxapi.com/2/files/get_thumbnail', {
        headers: {
            'Authorization': `Bearer ${this.token}`,
            'Dropbox-API-Arg': makeDropboxThumbnailHeader(file.path)
        },
        method: 'post',
    }).then(response => {
        return response.arrayBuffer().then(buffer => {
            return {
                ...file,
                thumbnail: `data:image/png;base64,${arrayBufferToBase64(buffer)}`
            };
        });
    });
}

function makeDropboxQueryPayload(query) {
    return JSON.stringify({
        path: '', // search only root for now
        query: query,
        mode: {
          '.tag': 'filename_and_content'
        }
    });
}

function makeDropboxThumbnailHeader(path) {
    return JSON.stringify({
        path: path,
        format: 'png',
        size: 'w32h32',
        mode: 'strict'
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
    if (file.trashed) {
        return '';
    }
    
    return `
    <div style="float: left; margin-right: 10px; border: 1px solid #CCCCCC; padding: 10px; box-shadow: 0 0 1px #CCCCCC;">
        <div style="margin-left: auto; margin-right: auto; display: table; margin-bottom: 10px;">
            <a href="${file.webViewLink}" target="_Blank">
                <img style="width: 60px; height: 45px" src="${file.thumbnailLink}" alt="Preview">
            </a>
        </div>
        <div>
            <img
                style="display: block; float: left; margin-top: 3px; margin-right: 6px;"
                src="${file.iconLink}"
                alt="Icon"
            />
            <a
                style="display: inline-block; text-overflow: ellipsis; max-width: 40px; overflow: hidden; white-space: nowrap;"
                href="${file.webViewLink}"
                target="_Blank">${file.name}</a>
        </div>
    </div>
    `;
}

function makeDropboxFileBlock(file) {
    const fileLink = `https://www.dropbox.com/preview${file.path}`;
    return `
    <div style="float: left; margin-right: 10px; border: 1px solid #CCCCCC; padding: 10px; box-shadow: 0 0 1px #CCCCCC;">
        <div style="margin-left: auto; margin-right: auto; display: table; margin-bottom: 10px;">
            <a href="${fileLink}" target="_Blank">
                <img style="width: 60px; height: 45px" src="${file.thumbnail}" alt="Thumbnail">
            </a>
        </div>
        <div>
            <a
                style="display: inline-block; text-overflow: ellipsis; max-width: 40px; overflow: hidden; white-space: nowrap;"
                href="${fileLink}"
                target="_Blank">${file.name}</a>
        </div>
    </div>
    `;
}

function searchHandler() {
    const driveDom = document.getElementById('drive_results');
    const dropBoxDom = document.getElementById('drop_box_results');
    if (driveDom) {
        driveDom.remove();
    }

    if (dropBoxDom) {
        dropBoxDom.remove();
    }

    const typeFilterDiv = document.querySelector('.SPSearchUX-module__searchFilters___s1xp2').parentElement;
    const searchBox = document.querySelector('input[placeholder="Search in SharePoint"]');
    const searchQuery = searchBox.value;
    if (!searchQuery) {
        return;
    }

    searchGoogleDrive(searchQuery, results => {
        if (results && results.files && results.files.length > 0) {
            let inner = '';
            results.files.forEach(file => {
                const fileBlock = makeFileBlock(file);
                inner += fileBlock;
            });
            const cardTemplate = `
            <div id="drive_results" style="padding-bottom: 100px;">
                <div style="margin-bottom: 15px;">
                    <span>Results from:</span>
                    <a href="https://drive.google.com/drive" target="_Blank">Google Drive</a>
                </div>
                ${inner}
            </div>`;
            const cardNode = toNode(cardTemplate);
            typeFilterDiv.appendChild(cardNode);
        }
    });

    searchDropbox(searchQuery, results => {
        if (results && results.length > 0) {
            let inner = '';
            results.forEach(file => {
                const fileBlock = makeDropboxFileBlock(file);
                inner += fileBlock;
            });
            const cardTemplate = `
            <div id="drop_box_results" style="padding-bottom: 100px; margin-top: 15px;">
                <div style="margin-bottom: 15px;">
                    <span>Results from:</span>
                    <a href="https://www.dropbox.com/" target="_Blank">Dropbox</a>
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
