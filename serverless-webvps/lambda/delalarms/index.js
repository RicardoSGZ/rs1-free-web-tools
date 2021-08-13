const AWS = require('aws-sdk');

function makeResponse(statusCode, body) {
    const response = {
        statusCode: statusCode,
        isBase64Encoded: false,
        headers: {
            'Access-Control-Allow-Origin':'*'
        },
        body: body
    };
    return response;
}


let describeAlarms = async (region, nextToken) => {
    let response = {};

    let cw = new AWS.CloudWatch({
        region: region
    });

    let ec2 = new AWS.EC2({
        region: region
    });

    let describeParamsAlarm = {
        
    };

    if (nextToken != '') {
        describeParamsAlarm.NextToken = nextToken
    }
    
    let dateAlarm = new Date();
    dateAlarm.setTime(dateAlarm.getTime() - (2 * 60 * 60 * 1000));
    await cw.describeAlarms(describeParamsAlarm)
        .promise()
        .then(async (dataDesc) => {
            if (dataDesc.NextToken && dataDesc.NextToken != '') {
                response.nextToken = dataDesc.NextToken;
            }
            let alarm_array = [];
            //console.log(dataDesc);
            if(dataDesc.MetricAlarms.length > 0) {
                for (let alarm of dataDesc.MetricAlarms) {
                    if(alarm.AlarmDescription == 'End instance for idle CPU' ||
                    alarm.AlarmDescription == 'End instance for using above max. CPU' ||
                    alarm.AlarmDescription == 'End instance for max. outgress network' ||
                    alarm.AlarmDescription == 'End instance for max. average outgress network') {
                        console.log('INSTANCE:', alarm.Dimensions[0].Value)
                        let instanceId = alarm.Dimensions[0].Value;
                        await ec2.describeInstances({
                            InstanceIds: [instanceId]
                        }).promise()
                        .then((data) => {
                            if (data.Reservations.length == 0 || data.Reservations[0].Instances[0].State.Name == 'terminated') {
                                alarm_array.push(alarm.AlarmName);
                            }
                        }).catch((error) => {
                            console.log(error);
                        });
                    }
                }
            }
            response.alarms = alarm_array;
            //console.log(response);
            
        })
        .catch((err) => {
            response = makeResponse(500, JSON.stringify(err));
        });
    return response;
}

let deleteAlarms = async (region, alarm_array) => {
    let response;
    let cw = new AWS.CloudWatch({
        region: region
    });
    let deleteParams = {
        AlarmNames: alarm_array
    };
    await cw.deleteAlarms(deleteParams)
        .promise()
        .then((data) => {
            response = makeResponse(200, JSON.stringify({
                message: 'OK'
            }))
        })
        .catch((err) => {
            response = makeResponse(500, JSON.stringify(err));
        });
    return response;

}

let main = async () => {
    let responseArray = [];
    let alarmsArray = [];
    let describeAlarmsResponse = await describeAlarms('eu-west-1', '');
    alarmsArray = alarmsArray.concat(describeAlarmsResponse.alarms);
    while (describeAlarmsResponse.nextToken) {
        describeAlarmsResponse = await describeAlarms('eu-west-1', describeAlarmsResponse.nextToken);
        alarmsArray = alarmsArray.concat(describeAlarmsResponse.alarms);
    }

    console.log(alarmsArray);

    responseArray.push(await deleteAlarms('eu-west-1', alarmsArray));

    console.log(responseArray);

    

    return responseArray;


}

exports.handler = async (event) => {
    return await main();
};
