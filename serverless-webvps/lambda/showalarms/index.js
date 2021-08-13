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

    let describeParamsAlarm = {
        StateValue: 'ALARM'
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
                        //console.log('INSTANCE:', alarm.Dimensions[0].Value)
                        alarm_array.push(alarm.AlarmName);
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

let main = async () => {
  let alarmsArray = [];
  let describeAlarmsResponse = await describeAlarms('eu-west-1', '');
  alarmsArray = alarmsArray.concat(describeAlarmsResponse.alarms);
  while (describeAlarmsResponse.nextToken) {
      describeAlarmsResponse = await describeAlarms('eu-west-1', describeAlarmsResponse.nextToken);
      alarmsArray = alarmsArray.concat(describeAlarmsResponse.alarms);
  }

  console.log(alarmsArray);

  

  return makeResponse(200, JSON.stringify(alarmsArray));


}

exports.handler = async (event) => {
  return await main();
};
