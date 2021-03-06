let webVPSAPI = 'https://[[YOUR-VPS-SERVICE-API-URL]]/';

let storageAPI = 'https://[[YOUR-STORAGE-TOOL-API-URL]]/';

let compressAPI = 'https://[[YOUR-COMPRESS-TOOL-API-URL]]/';

let eventAdded = false;
let eventAddedCompress = false;

let content = document.querySelector('.content');

let responseBg = document.createElement('div');
responseBg.classList.add('response-bg');

let responseWindow = document.createElement('div');
responseWindow.classList.add('response-window');

let responseWindowTextBox = document.createElement('div');

responseWindow.appendChild(responseWindowTextBox);

responseBg.appendChild(responseWindow);
content.appendChild(responseBg);

//RESPONSE-WINDOWS 
let RWLoad = (obj) => {
    responseWindowTextBox.innerHTML = '';

    let header = document.createElement('div');
    header.classList.add('rw-header', 'one');

    let headerText = document.createElement('div');
    headerText.classList.add('rw-header-text');

    let headerTextMain = document.createElement('p');
    headerTextMain.classList.add('rw-header-text-main');
    headerTextMain.innerText = obj.headerMain;

    let headerTextSub = document.createElement('p');
    headerTextSub.classList.add('rw-header-text-sub');
    headerTextSub.innerText = obj.headerSub;

    let loadBar = document.createElement('div');
    loadBar.classList.add('rw-loadbar');

    headerText.appendChild(headerTextMain);
    headerText.appendChild(headerTextSub);
    header.appendChild(headerText);

    responseWindowTextBox.appendChild(header);

    responseWindowTextBox.appendChild(loadBar);

    responseBg.style.display = 'grid';
}

let RWComplete = (obj) => {
    responseWindowTextBox.innerHTML = '';

    let header = document.createElement('div');
    header.classList.add('rw-header', 'two');

    let headerText = document.createElement('div');
    headerText.classList.add('rw-header-text');

    let headerTextMain = document.createElement('p');
    headerTextMain.classList.add('rw-header-text-main');
    headerTextMain.innerText = obj.headerMain;

    let headerTextSub = document.createElement('p');
    headerTextSub.classList.add('rw-header-text-sub');
    headerTextSub.innerText = obj.headerSub;

    let headerCloseBtnDiv = document.createElement('div');
    headerCloseBtnDiv.classList.add('rw-header-close');

    headerCloseBtnDiv.innerHTML = '&times;';
    headerCloseBtnDiv.addEventListener('click', () => {
        responseWindowTextBox.innerHTML = '';
        responseBg.style.display = 'none';
    });

    headerText.appendChild(headerTextMain);
    headerText.appendChild(headerTextSub);
    header.appendChild(headerText);
    header.appendChild(headerCloseBtnDiv);

    let main = document.createElement('div');
    main.classList.add('rw-main');

    for (let item of obj.mainContent) {
        if (item.list) {
            let mainList = document.createElement('div');
            mainList.classList.add('rw-main-list');

            let mainListUl = document.createElement('ul');

            for (let prop in item.list) {
                let mainListLi = document.createElement('li');
                mainListLi.innerHTML = prop + ': ' +
                    '<b>' + item.list[prop] + '</b>';
                mainListUl.appendChild(mainListLi);
            }

            mainList.appendChild(mainListUl);
            main.appendChild(mainList);
        } else if (item.link) {
            let mainText = document.createElement('div');
            mainText.classList.add('rw-main-text');

            let mainTextA = document.createElement('a');
            mainTextA.setAttribute('target', '_blank');
            mainTextA.setAttribute('href', item.link.url);
            mainTextA.innerText = item.link.text;

            mainText.appendChild(mainTextA);
            main.appendChild(mainText);
        } else if (item.textHtml) {
            let mainText = document.createElement('div');
            mainText.classList.add('rw-main-text');

            let mainTextP = document.createElement('p');
            mainTextP.innerHTML = item.textHtml.content;

            mainText.appendChild(mainTextP);
            main.appendChild(mainText);
        } else if (item.html) {
            let mainHtml = document.createElement('div');
            mainHtml.classList.add('rw-main-html');
            mainHtml.appendChild(item.html.content);

            main.appendChild(mainHtml);
        }
    }

    if (obj.buttonContent) {
        let mainBtns = document.createElement('div');
        mainBtns.classList.add('rw-main-btns');

        let mainBtnsPKBtn = document.createElement('a');
        mainBtnsPKBtn.setAttribute('target', '_blank');
        mainBtnsPKBtn.setAttribute('href', obj.buttonContent.url);
        mainBtnsPKBtn.innerText = obj.buttonContent.text;

        mainBtns.appendChild(mainBtnsPKBtn);

        main.appendChild(mainBtns);
    }

    responseWindowTextBox.appendChild(header);

    responseWindowTextBox.appendChild(main);

    responseBg.style.display = 'grid';
}


//WAIT
let wait = async (seconds) => {
    //console.log('Waiting ' + seconds + ' seconds...');
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000);
    })
}

//VPS

let webVPSOptions = document.querySelector('.webvps-options');
let webVPSOptionsBtn = document.getElementById('webvps-options-btn');
let webVPSOptionsMenu = document.querySelector('.webvps-options-menu');
let webVPSOptionsBtnArrow = document.getElementById('webvps-options-btn-arrow');
let archItem = document.querySelectorAll('.arch-item');


webVPSOptionsBtn.addEventListener('click', () => {
    if (webVPSOptionsMenu.classList.contains('disabled')) {
        webVPSOptionsMenu.classList.remove('disabled');
        webVPSOptionsMenu.classList.add('enabled');
        webVPSOptionsBtnArrow.innerHTML = '&#9650;';
    } else {
        webVPSOptionsMenu.classList.remove('enabled');
        webVPSOptionsMenu.classList.add('disabled');
        webVPSOptionsBtnArrow.innerHTML = '&#9660;'

    }
})

archItem.forEach((item) => {
    item.addEventListener('click', () => {
        item.classList.add('selected')
        if (item.id == 'amd64') {
            document.getElementById('arm64').classList.remove('selected');
        } else {
            document.getElementById('amd64').classList.remove('selected');
        }
    })
})

let showCaptcha = () => {

    let captchaDiv = document.createElement('div');
    captchaDiv.setAttribute('id', 'captchaBox');

    RWComplete({
        headerMain: 'Complete Captcha',
        headerSub: '',
        mainContent: [
            {
                html: {
                    content: captchaDiv
                }
            }
        ]
    })

    grecaptcha.render('captchaBox', {
        'sitekey': 'XXXX', //YOUR GOOGLE RECAPTCHA SITE KEY
        'callback': 'setUpWebVPS'
    });
}



function setUpWebVPS (captchaResponse) {
    let webVPSScriptContent = document.getElementById('script').value;
    let webVPSBlankDisk = document.getElementById('blankdisk').checked;
    let webVPSArch = 'amd64';
    document.querySelectorAll('.arch-item').forEach((item) => {
        if (item.classList.contains('selected')) {
            webVPSArch = item.id;
        }
    })
    let options = {
        method: 'POST',
        body: JSON.stringify({
            captchaResponse: captchaResponse,
            startupScript: webVPSScriptContent,
            blankDisk: webVPSBlankDisk ,
            arch: webVPSArch
        })
    };
    grecaptcha.reset();
    RWLoad({
        headerMain: 'Setting up server, please wait... (1/3)',
        headerSub: 'This process may take up to 50 secs.' //50s amd64 - 30s arm
    });


    fetch(webVPSAPI + 'setup-webvps', options)
        .then((response) => {
            if (response.ok) {
                response.json().then(async (data) => {
                    RWLoad({
                        headerMain: 'Getting server info, please wait... (2/3)',
                        headerSub: 'This process may take up to 50 secs.' 
                    });
                    getIpWebVPS({
                        instanceId: data.instanceId,
                        username: data.username,
                        password: data.password,
                        arch: webVPSArch
                    });
                })
            } else {
                response.json().then((err) => {
                    RWComplete({
                        headerMain: 'ERROR',
                        headerSub: 'There is an error with the request',
                        mainContent: [
                            {
                                list: err
                            }
                        ]
                    });
                })

            }
        }).catch((err) => {
            RWComplete({
                headerMain: 'ERROR',
                headerSub: 'There is an error with the request',
                mainContent: [
                    {
                        list: err
                    }
                ]
            });
        });
}

let getIpWebVPS = (obj) => {

    let options = {
        method: 'POST',
        body: JSON.stringify({
            instanceId: obj.instanceId
        })
    };
    fetch(webVPSAPI + 'getip-webvps', options)
        .then((response) => {
            if (response.ok) {
                response.json().then(async (data) => {
                    console.log(data);
                    let publicIP = data.publicIP;
                    RWLoad({
                        headerMain: 'Finishing setup, please wait... (3/3)',
                        headerSub: 'This process may take up to 50 secs.'
                    });
                    if (obj.arch == 'amd64') {
                        await wait(40);
                    } else {
                        await wait(25);
                    }
                    
                    RWComplete({
                        headerMain: 'VPS created',
                        headerSub: 'Server info:',
                        mainContent: [
                            {
                                list: {
                                    IP: publicIP,
                                    username: obj.username,
                                    password: obj.password,
                                    IPv6: data.IPv6,
                                    Note: 'You can also access via SSH'
                                }
                            },
                            {
                                html: {
                                    content: adGoogle
                                }
                            }
                        ],
                        buttonContent: {
                            url: 'http://' + publicIP + ':3000/',
                            text: 'Access to the server'
                        }
                    });
                })
            } else {
                response.json().then((err) => {
                    RWComplete({
                        headerMain: 'ERROR',
                        headerSub: 'There is an error with the request',
                        mainContent: [
                            {
                                list: err
                            }
                        ]
                    });
                })
            }
        }).catch((err) => {
            RWComplete({
                headerMain: 'ERROR',
                headerSub: 'There is an error with the request',
                mainContent: [
                    {
                        list: err
                    }
                ]
            });
        });
}

let webVPS = document.getElementById('start-webvps');

webVPS.addEventListener('click', () => {
    showCaptcha();

})

//STORAGE

let uploadFile = async (params) => {
    await fetch(storageAPI + 'uploadfile', {
        method: 'POST',
        body: JSON.stringify({
            filename: params.inputData.files[0].name,
            filetype: params.inputData.files[0].type,
            filesize: params.inputData.files[0].size
        })
    }).then(async (res) => {
        if (res.ok) {
            await res.json().then(async (data) => {
                let form = new FormData();
                Object.keys(data.fields).forEach(key => {
                    form.append(key, data.fields[key]);
                });
                //console.log(data.fields);
                let code = data.code;
                let path = data.fields.key;
                form.append('file', params.inputData.files[0]);
                await fetch(data.url, {
                    method: 'POST',
                    body: form
                }).then((resUpload) => {
                    if (resUpload.ok) {
                        RWComplete({
                            headerMain: 'File successfully uploaded',
                            headerSub: 'You can copy the link and paste it anywhere:',
                            mainContent: [
                                {
                                    link: {
                                        url: 'https://[[YOUR-URL-FOR-STORAGE-TOOL]]/' + encodeURI(path),
                                        text: 'https://[[YOUR-URL-FOR-STORAGE-TOOL]]/' + path
                                    }
                                },
                                {
                                    textHtml: {
                                        content: '<p>Use the link and this code if you want to delete the file later:</p><p><b id="code-text">' + code + '</b>'
                                    }
                                }

                            ]
                        });
                    } else {
                        resUpload.text().then((err) => {
                            RWComplete({
                                headerMain: 'ERROR',
                                headerSub: 'There is an error with the request',
                                mainContent: [
                                    {
                                        textHtml: {
                                            content: '<p>The filesize is over 100MB</p>'
                                        }
                                    }
                                ]
                            });
                        })
                    }
                })
            })
        } else {
            res.json().then((err) => {
                RWComplete({
                    headerMain: 'ERROR',
                    headerSub: 'There is an error with the request',
                    mainContent: [
                        {
                            list: err
                        }
                    ]
                });
            });
        }
    });
}

let select_file_btn = document.getElementById('select-file-btn');

let fileInput = document.createElement('input');
fileInput.setAttribute('type', 'file');
fileInput.setAttribute('name', 'file');

select_file_btn.addEventListener('click', () => {
    fileInput.click();
    if (!eventAdded) {
        eventAdded = true;
        fileInput.addEventListener('change', async () => {
            RWLoad({
                headerMain: 'Uploading file, please wait...',
                headerSub: ''
            });

            await uploadFile({
                inputData: fileInput
            });

        });

    }
});

let dropFileBox = document.getElementById('dropFileHere');

dropFileBox.addEventListener('drop', async (e) => {
    e.preventDefault();
    console.log('File dropped');
    //console.log(e.dataTransfer);
    RWLoad({
        headerMain: 'Uploading file, please wait...',
        headerSub: ''
    });
    await uploadFile({
        inputData: e.dataTransfer
    });
});

dropFileBox.addEventListener('dragover', (e) => {
    e.preventDefault();
});

let deleteFileBtn = document.getElementById('delete-file-btn');
deleteFileBtn.addEventListener('click', () => {
    let formDiv = document.createElement('div');
    let deleteFileForm = document.createElement('form');
    deleteFileForm.setAttribute('id', 'delete-file-form');
    let deleteFileInputPathLabel = document.createElement('label');
    deleteFileInputPathLabel.setAttribute('for', 'input_path');
    deleteFileInputPathLabel.innerHTML = 'Uploaded file link (e.g.: https://[[YOUR-URL-FOR-STORAGE-TOOL]]/1234/test.mp4):';
    let deleteFileInputPath = document.createElement('input');
    deleteFileInputPath.setAttribute('id', 'input_path');
    deleteFileInputPath.setAttribute('type', 'text');
    let deleteFileInputCodeLabel = document.createElement('label');
    deleteFileInputCodeLabel.setAttribute('for', 'input_code');
    deleteFileInputCodeLabel.innerHTML = 'Code:';
    let deleteFileInputCode = document.createElement('input');
    deleteFileInputCode.setAttribute('id', 'input_code');
    deleteFileInputCode.setAttribute('type', 'text');

    let deleteBtnBox = document.createElement('div');
    deleteBtnBox.classList.add('rw-main-btns');

    let deleteFileConfirmBtn = document.createElement('button');
    deleteFileConfirmBtn.setAttribute('id', 'confirm-delete-btn');
    deleteFileConfirmBtn.setAttribute('type', 'submit');
    deleteFileConfirmBtn.innerHTML = 'Delete file';

    deleteFileForm.appendChild(deleteFileInputPathLabel);
    deleteFileForm.appendChild(deleteFileInputPath);
    deleteFileForm.appendChild(deleteFileInputCodeLabel);
    deleteFileForm.appendChild(deleteFileInputCode);
    deleteBtnBox.appendChild(deleteFileConfirmBtn);
    deleteFileForm.appendChild(deleteBtnBox);
    formDiv.appendChild(deleteFileForm);
    RWComplete({
        headerMain: 'Enter link and code to delete the file',
        headerSub: '',
        mainContent: [
            {
                html: {
                    content: formDiv
                }
            }
        ]
    });
    responseBg.style.display = 'grid';


    document.getElementById('delete-file-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if (document.getElementById('input_path').value != '' && document.getElementById('input_code') != '') {
            let confirm_delete = confirm('Are you sure you want to delete the file?');
            if (confirm_delete) {
                let path = document.getElementById('input_path').value;
                let code = document.getElementById('input_code').value;
                RWLoad({
                    headerMain: 'Deleting file, please wait...',
                    headerSub: ''
                });
                fetch(storageAPI + 'deletefile', {
                    method: 'POST',
                    body: JSON.stringify({
                        path: path,
                        code: code
                    })
                }).then((response) => {
                    if (response.ok) {
                        RWComplete({
                            headerMain: 'File successfully deleted',
                            headerSub: '',
                            mainContent: [
                                {}
                            ]
                        });
                    } else {
                        response.json()
                            .then((err) => {
                                RWComplete({
                                    headerMain: 'ERROR',
                                    headerSub: 'There is an error with the request',
                                    mainContent: [
                                        {
                                            list: err
                                        }
                                    ]
                                });
                            })

                    }
                }).catch((err) => {
                    RWComplete({
                        headerMain: 'ERROR',
                        headerSub: 'There is an error with the request',
                        mainContent: [
                            {
                                list: err
                            }
                        ]
                    });
                });
            } else {
                e.preventDefault();
            }
        } else {
            e.preventDefault();
        }

    });
});


/*COMPRESS TOOL*/

let uploadFilesCompress = async (params) => {
    let paths = [];
    let folder = parseInt(Math.random() * 100000, 10);
    for (let file of params.inputData.files) {
        await fetch(compressAPI + 'uploadfilecompress', {
            method: 'POST',
            body: JSON.stringify({
                filename: file.name,
                filetype: file.type,
                filesize: file.size,
                folder: folder
            })
        }).then(async (res) => {
            if (res.ok) {
                await res.json().then(async (data) => {

                    let form = new FormData();
                    Object.keys(data.fields).forEach(key => {
                        form.append(key, data.fields[key]);
                    });
                    form.append('file', file);
                    await fetch(data.url, {
                        method: 'POST',
                        body: form
                    }).then((resUpload) => {
                        if (resUpload.ok) {
                            paths.push(data.fields.key);
                        } else {
                            resUpload.json().then((error) => {
                                RWComplete({
                                    headerMain: 'ERROR',
                                    headerSub: 'There is an error with the request',
                                    mainContent: [
                                        {
                                            list: error
                                        }
                                    ]
                                });
                                selectFileBtn.innerText = 'Select Files';
                            })
                        }
                    }).catch((error) => {
                        RWComplete({
                            headerMain: 'ERROR',
                            headerSub: 'There is an error with the request',
                            mainContent: [
                                {
                                    list: error
                                }
                            ]
                        });
                        selectFileBtn.innerText = 'Select Files';
                    })
                })
            } else {
                res.json().then((err) => {
                    RWComplete({
                        headerMain: 'ERROR',
                        headerSub: 'There is an error with the request',
                        mainContent: [
                            {
                                list: err
                            }
                        ]
                    });
                    selectFileBtn.innerText = 'Select Files';
                })
            }
        });
    }

    return paths;
}

let compressFiles = async (params) => {
    let response = '';
    await fetch(compressAPI + 'compressfiles', {
        method: 'POST',
        body: JSON.stringify(params)
    }).then(async (res) => {
        if (res.ok) {
            await res.json().then((data) => {
                response = data.newkey;
            })
        }
    });
    return response;
}
let pathArray;

let select_file_compress_btn = document.getElementById('select-file-compress-btn');

let fileInputCompress = document.createElement('input');
fileInputCompress.setAttribute('type', 'file');
fileInputCompress.setAttribute('name', 'file');
fileInputCompress.setAttribute('multiple', 'true');

select_file_compress_btn.addEventListener('click', () => {
    fileInputCompress.click();
    if (!eventAddedCompress) {
        eventAddedCompress = true;
        fileInputCompress.addEventListener('change', async () => {
            RWLoad({
                headerMain: 'Processing files, please wait...',
                headerSub: 'UPLOADING...'
            });

            pathArray = await uploadFilesCompress({
                inputData: fileInputCompress
            });

            RWLoad({
                headerMain: 'Processing files, please wait...',
                headerSub: 'COMPRESSING...'
            });

            if (pathArray.length > 0) {
                let newKey = await compressFiles({
                    keys: pathArray
                });
                RWComplete({
                    headerMain: 'Files successfully compressed',
                    headerSub: 'You can download or share from this link:',
                    mainContent: [
                        {
                            link: {
                                url: 'https://[[YOUR-URL-FOR-COMPRESS-TOOL]]/' + encodeURI(newKey),
                                text: 'https://[[YOUR-URL-FOR-COMPRESS-TOOL]]/' + newKey
                            }
                        }
                    ]
                });
            } else {
                RWComplete({
                    headerMain: 'ERROR',
                    headerSub: 'There is an error with the request',
                    mainContent: []
                });
            }

        });

    }
});

let dropFileCompressBox = document.getElementById('dropFileHereCompress');

dropFileCompressBox.addEventListener('drop', async (e) => {
    e.preventDefault();
    console.log('File dropped');
    //console.log(e.dataTransfer);
    RWLoad({
        headerMain: 'Processing files, please wait...',
        headerSub: 'UPLOADING...'
    });

    pathArray = await uploadFilesCompress({
        inputData: e.dataTransfer
    });
    RWLoad({
        headerMain: 'Processing files, please wait...',
        headerSub: 'COMPRESSING...'
    });

    if (pathArray.length > 0) {
        let newKey = await compressFiles({
            keys: pathArray
        });
        RWComplete({
            headerMain: 'Files successfully compressed',
            headerSub: 'You can download or share from this link:',
            mainContent: [
                {
                    link: {
                        url: 'https://[[YOUR-URL-FOR-COMPRESS-TOOL]]/' + encodeURI(newKey),
                        text: 'https://[[YOUR-URL-FOR-COMPRESS-TOOL]]/' + newKey
                    }
                }
            ]
        });
    } else {
        RWComplete({
            headerMain: 'ERROR',
            headerSub: 'There is an error with the request',
            mainContent: []
        });
    }
});

dropFileCompressBox.addEventListener('dragover', (e) => {
    e.preventDefault();
});

