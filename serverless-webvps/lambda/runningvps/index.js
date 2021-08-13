const AWS = require('aws-sdk');

const SERVERDATA = {
  region: 'eu-west-1',
  subnet: 'XXXXX' //YOUR SUBNET ID
}

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

let checkRunningInstances = async (subnet, ec2) => {
  let response = 0;
  let describeInstancesParams = {
    Filters: [
      {
        Name: 'subnet-id',
        Values: [subnet]
      },
      {
        Name: 'instance-state-name',
        Values: ['running', 'pending']
      }
    ]
  };
  await ec2.describeInstances(describeInstancesParams)
    .promise()
    .then((data) => {
      response = data.Reservations.length;
    })
    .catch((err) => {
      console.log(err, err.stack);
    });
  return response;
}

exports.handler = async (event) => {

  let ec2 = new AWS.EC2({
    region: SERVERDATA.region
  });
  let instancesNumber = await checkRunningInstances(SERVERDATA.subnet, ec2);

  return makeResponse(200, JSON.stringify(instancesNumber));

}