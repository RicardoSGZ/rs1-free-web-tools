const AWS = require('aws-sdk');

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

const SERVERDATA = {
  region: 'eu-west-1'
}

function descInstance(ec2, id, resolve, reject) {
  let describeInstancesParams = {
    InstanceIds: [id]
  };
  ec2.describeInstances(describeInstancesParams, (descErr, descData) => {
    if (descErr) {
      console.log(descErr, descErr.stack);
      let response = makeResponse(500, JSON.stringify(descErr));
      resolve(response);
    } else {
      if (descData.Reservations[0].Instances[0].PublicIpAddress != '' && descData.Reservations[0].Instances[0].PublicIpAddress != undefined) {
        console.log('IP received...');
        let instanceInfo = descData.Reservations[0].Instances[0];
        let body = {
          publicIP: instanceInfo.PublicIpAddress,
          IPv6: instanceInfo.NetworkInterfaces[0].Ipv6Addresses[0].Ipv6Address
        };

        console.log(body);

        let response = makeResponse(200, JSON.stringify(body));
        resolve(response);
      } else {
        descInstance(ec2, id, resolve, reject);
      }
    }
  });
}

exports.handler = async (event) => {

  return new Promise((resolve, reject) => {
    if (!event.body) {
      let response = makeResponse(500, JSON.stringify({
        message: 'ERROR'
      }));
      console.log(event);
      resolve(response);
    }
    let eventBody = JSON.parse(event.body);
    if (!eventBody.instanceId) {
      let response = makeResponse(500, JSON.stringify({
        message: 'ERROR'
      }));
      console.log(event);
      resolve(response);
    }
    let id = eventBody.instanceId;

    let ec2 = new AWS.EC2({
      region: SERVERDATA.region
    });

    console.log('Starting function...');
    descInstance(ec2, id, resolve, reject);

  });

}
