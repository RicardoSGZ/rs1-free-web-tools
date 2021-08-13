const AWS = require('aws-sdk');
let request = require('request');

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
  region: 'eu-west-1',
  key: 'XXXX', //YOUR SSH KEYNAME
  vpc: 'XXXX', //YOUR VPC ID
  subnet: 'XXXX', //YOUR SUBNET ID
  securitygroup: 'XXXX', //YOUR SECURITY GROUP ID
  amix86: 'XXXX', //AMI FOR X86_64
  amiarm: 'XXXX', //AMI FOR ARM
  instancetypex86: 't3.micro',
  instancetypearm: 't4g.micro',
  partitionname: '/dev/sda1',
  volumesize: '16',
  extravolume: '8',
  project: 'web-vps',
  username: 'webvps',
  password: 'webpwd'
}

let verifyCaptcha = async (captchaResponse) => {
  return new Promise((resolve, reject) => {
    request.post({
      url: 'https://www.google.com/recaptcha/api/siteverify',
      formData: {
        secret: 'XXXXX', //GOOGLE RECAPTCHA SECRET KEY
        response: captchaResponse
      }
    }, (error, res, body) => {
      if (error) {
        console.error('Request failed:', error);
        reject();
      } else {
        if (res.statusCode != 200) {
          console.error('Error:', res.statusCode, body.toString('utf8'));
          reject();
        }

        let bodyObject = JSON.parse(body);
        if (bodyObject.success === true) {
          resolve();
        } else {
          console.log(body);
          reject();
        }

      }
    });
  })
}

let checkRunningInstances = async (subnet, ec2) => {
  //COMPRUEBA NUMERO INSTANCIAS EN FUNCIONAMIENTO
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

let startServer = async (ec2, startupScript, blankDisk, arch) => {
  let response;
  let runInstancesParams = {
    MinCount: 1,
    MaxCount: 1,
    InstanceType: (arch == 'amd64') ? SERVERDATA.instancetypex86 : SERVERDATA.instancetypearm,
    BlockDeviceMappings: [
      {
        DeviceName: SERVERDATA.partitionname,
        Ebs: {
          VolumeSize: SERVERDATA.volumesize,
          VolumeType: 'gp3'
        }
      }
    ],
    CreditSpecification: {
      CpuCredits: 'standard'
    },
    KeyName: SERVERDATA.key,
    SubnetId: SERVERDATA.subnet,
    ImageId: (arch == 'amd64') ? SERVERDATA.amix86 : SERVERDATA.amiarm,
    SecurityGroupIds: [SERVERDATA.securitygroup],
    InstanceMarketOptions: {
      MarketType: 'spot',
      SpotOptions: {
        SpotInstanceType: 'one-time',
        InstanceInterruptionBehavior: 'terminate'
      }
    },
    TagSpecifications: [
      {
        ResourceType: 'instance',
        Tags: [
          {
            Key: 'project',
            Value: SERVERDATA.project
          }
        ]
      },
      {
        ResourceType: 'volume',
        Tags: [
          {
            Key: 'project',
            Value: SERVERDATA.project
          }
        ]
      }
    ]
  };
  if (startupScript != '') {
    let buffer = Buffer.from(startupScript);
    let b64Script = buffer.toString('base64');
    runInstancesParams.UserData = b64Script;
  }
  if (blankDisk === true) {
    runInstancesParams.BlockDeviceMappings.push({
      DeviceName: '/dev/sdb',
      Ebs: {
        DeleteOnTermination: true,
        VolumeSize: SERVERDATA.extravolume,
        VolumeType: 'gp3'
      }
    })
  }
  console.log(JSON.stringify(runInstancesParams));
  console.log('Set up server...');
  await ec2.runInstances(runInstancesParams)
    .promise()
    .then((data) => {
      console.log('Server created');
      let instanceId = data.Instances[0].InstanceId;
      console.log('Instance Id: ', instanceId);
      response = makeResponse(200, JSON.stringify({
        message: 'VPS Created',
        instanceId: instanceId,
        username: SERVERDATA.username,
        password: SERVERDATA.password
      }));
    })
    .catch((err) => {
      response = makeResponse(500, JSON.stringify(err))
    })
  return response;
}

exports.handler = async (event) => {

  return new Promise((resolve, reject) => {

    let response;

    if (!event.body) {
      response = makeResponse(500, JSON.stringify({
        message: 'No Captcha response sent'
      }))
      resolve(response);
    }

    let eventBody = JSON.parse(event.body);


    if (!eventBody.captchaResponse) {
      response = makeResponse(500, JSON.stringify({
        message: 'No Captcha response sent'
      }))
      resolve(response);
    }

    let captchaResponse = eventBody.captchaResponse;

    let startupScript = '';

    if (eventBody.startupScript) {
      startupScript = eventBody.startupScript;
    }

    let blankDisk = false;

    if (eventBody.blankDisk) {
      if (eventBody.blankDisk === true || eventBody.blankDisk == 'true') {
        blankDisk = true;
      }
    }

    let arch = 'amd64';

    if (eventBody.arch) {
      arch = eventBody.arch;
    }


    let ec2 = new AWS.EC2({
      region: SERVERDATA.region
    });

    verifyCaptcha(captchaResponse).then(async (data) => {
      let instancesNumber = await checkRunningInstances(SERVERDATA.subnet, ec2);

      if (instancesNumber >= 30) {
        response = makeResponse(500, JSON.stringify({
          message: 'Sorry, the VPS pool is full, please try again later.'
        }))
        console.log(response);
      } else {
        response = await startServer(ec2, startupScript, blankDisk, arch);
        resolve(response);
      }
      resolve(response);
    }).catch((err) => {
      response = makeResponse(500, JSON.stringify({
        message: 'Error with CAPTCHA.'
      }))
      resolve(response);
    })
  })



}
