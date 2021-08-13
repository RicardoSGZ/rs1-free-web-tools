const AWS = require('aws-sdk');

function makeResponse(statusCode, body) {
    const response = {
        statusCode: statusCode,
        isBase64Encoded: false,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: body
    };
    return response;
}

exports.handler = async (event) => {

    return new Promise((resolve, reject) => {
        let event_body = JSON.parse(event.body);

        let bucket = 'XXXX'; //YOUR S3 BUCKET
        let folder = parseInt(Math.random() * 100000, 10);
        let key = folder.toString() + '/' + event_body.filename;
        let type = event_body.filetype;
        let size = parseInt(event_body.filesize, 10);
        let params_presign = '';

        console.log('File: ', key);


        let s3 = new AWS.S3();

        let maxsize = 1024 * 1024 * 100;  //100MB

        if(size > maxsize) {
            let body = {
                message: 'File is too big'
            };
            let response = makeResponse(501, JSON.stringify(body));
            console.log(response);
            resolve(response);
        }

        if (type == 'text/plain') {
            params_presign = {
                Bucket: bucket,
                Fields: {
                    key: key,
                    'content-type': type + ';charset=utf-8'
                }
            };
        } else if (type != '') {
            params_presign = {
                Bucket: bucket,
                Fields: {
                    key: key,
                    'content-type': type
                }
            };
        } else {
            params_presign = {
                Bucket: bucket,
                Fields: {
                    key: key
                }
            };
        }

        params_presign.Conditions = [
            ["content-length-range", 0, maxsize]
        ]

        s3.createPresignedPost(params_presign, (err_cpp, data_cpp) => {
            if (err_cpp) {
                let response = makeResponse(500, err_cpp);
                console.log(response);
                resolve(response);
            } else {
                let buffer_str = Buffer.from(key);
                let encoded_str = buffer_str.toString('base64');

                let buffer_total = Buffer.from(encoded_str);
                let encoded_total = buffer_total.toString('base64');
                let code = encoded_total.substr(0, 6);
                data_cpp.code = code;

                let response = makeResponse(200, JSON.stringify(data_cpp));
                console.log('Presigned post created');
                resolve(response);

            }
        });

    });
};
