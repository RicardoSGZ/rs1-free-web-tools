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
    region: 'eu-west-1',
    vpc: 'XXXXX', //YOUR VPC ID
}

let deleteServers = async () => {
    let ec2 = new AWS.EC2({
        region: SERVERDATA.region
    });
    let response = '';
    let describeInstancesParams = {
        Filters: [
            {
                Name: 'vpc-id',
                Values: [SERVERDATA.vpc]
            },
            {
                Name: 'instance-state-name',
                Values: ['running']
            }

        ]
    };


    let date = new Date();
    date.setTime(date.getTime() - (3 * 60 * 60 * 1000)); //3 hours
    await ec2.describeInstances(describeInstancesParams)
        .promise()
        .then(async (data) => {
            let instances_array = [];
            //console.log(data);
            if (data.Reservations.length > 0) {
                for (let instance of data.Reservations) {
                    if (new Date(instance.Instances[0].LaunchTime) < date) {
                        console.log('Instance ' + instance.Instances[0].InstanceId + ' has been running for 3 hours.');
                        instances_array.push(instance.Instances[0].InstanceId);
                    }
                }
                if (instances_array.length > 0) {
                    let terminateParams = {
                        InstanceIds: []
                    };
                    for (let instanceId of instances_array) {
                        terminateParams.InstanceIds.push(instanceId);
                    }
                    await ec2.terminateInstances(terminateParams)
                        .promise()
                        .then((data) => {
                            response = makeResponse(200, JSON.stringify(data));
                        }).catch((err) => {
                            response = makeResponse(500, JSON.stringify(err));

                        });
                } else {
                    let body = {
                        message: 'There are no instances to terminate',
                        region: SERVERDATA.region
                    };

                    response = makeResponse(200, JSON.stringify(body));
                    console.log(response);
                }

            } else {
                let body = {
                    message: 'There are no instances to terminate',
                    region: SERVERDATA.region
                };

                response = makeResponse(200, JSON.stringify(body));
                console.log(response);
            }
        })
        .catch((err) => {
            response = makeResponse(500, JSON.stringify(err));
        });
    return response;
};

let main = async () => {
    let responseArray = [];

    responseArray.push(await deleteServers());

    return responseArray;
};

exports.handler = async (event) => {
    return await main();
};