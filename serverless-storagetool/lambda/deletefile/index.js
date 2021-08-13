const AWS = require('aws-sdk');
/*global URL*/
let makeResponse = (statusCode, body) => {
  return {
      statusCode: statusCode,
      isBase64Encoded: false,
      headers: {
          'Access-Control-Allow-Origin': '*'
      },
      body: body
  };
}

let deleteFile = async (bucket, path_fix) => {
  return new Promise((resolve, reject) => {

    let deleteParams = {
      Bucket: bucket,
      Key: path_fix
    };
    let s3 = new AWS.S3();
    s3.deleteObject(deleteParams, (err, data) => {
      if (err) {
        let response = makeResponse(500, JSON.stringify(err));
        console.log(response);
        reject(response);
      } else {
        let response = makeResponse(200, JSON.stringify(data));
        console.log('File deleted successfully');
        resolve(response);
      }
    });

  });
}

let updateDistribution = async (path) => {
  let response = '';
  let distributionId = 'XXXXX'; //YOUR DISTRIBUTION ID
  let cloudfront = new AWS.CloudFront();
  let params = {
    DistributionId: distributionId, 
    InvalidationBatch: { 
      CallerReference: new Date().getTime().toString(), 
      Paths: { 
        Quantity: 1, 
        Items: [
          '/' + path
        ]
      }
    }
  };
  await cloudfront.createInvalidation(params)
    .promise()
    .then((data) => {
      response = makeResponse(200, JSON.stringify({
        message: 'File deleted and distribution updated'
      }))
      console.log(response);
    }).catch((err) => {
      response = makeResponse(500, JSON.stringify(err))
      console.log(err);
    });

  return response;
}

let main = async (eventBody) => {
  let response = '';
  let bucket = 'XXXXX'; //YOUR S3 BUCKET
  let path = eventBody.path;
  let code = eventBody.code;
  let url = new URL(path);
  let path_fix = url.pathname.substr(1);

  let buffer_str = Buffer.from(path_fix);
  let encoded_str = buffer_str.toString('base64');
  let buffer_total = Buffer.from(encoded_str);
  let encoded_total = buffer_total.toString('base64');
  let filecode = encoded_total.substr(0, 6);
  if (code == filecode) {
    response = await deleteFile(bucket, path_fix);
    response = await updateDistribution(path_fix);
  } else {
    response = makeResponse(500, JSON.stringify({
      message: 'Wrong code'
    }));
  }
  return response;

}

exports.handler = async (event) => {
  let eventBody = JSON.parse(event.body);
  return await main(eventBody);
};
