const AWS = require('aws-sdk');

const SERVERDATA = {
  region: 'eu-west-1',
  vpc: 'XXXXX' //YOUR VPC ID
}

exports.handler = async (event) => {

  return new Promise((resolve, reject) => {
    let instanceId = event.detail['instance-id'];
    let ec2 = new AWS.EC2({
      region: SERVERDATA.region
    });
    let cw = new AWS.CloudWatch({
      region: SERVERDATA.region
    });

    let describeInstancesParams = {
      InstanceIds: [instanceId]
    };
    ec2.describeInstances(describeInstancesParams, (descErr, descData) => {
      if (descErr) {
        const response = {
          statusCode: 500,
          body: JSON.stringify(descErr),
        };
        console.log(response);
        resolve(response);
      } else {
        //console.log(JSON.stringify(descData));
        let vpc = descData.Reservations[0].Instances[0].VpcId;
        let arch = descData.Reservations[0].Instances[0].Architecture;
        if (vpc == SERVERDATA.vpc) {
          let setMinAlarmParams = {
            AlarmName: 'end_cpumin_' + instanceId,
            AlarmDescription: 'End instance for idle CPU',
            AlarmActions: ['arn:aws:automate:eu-west-1:ec2:terminate'],
            MetricName: 'CPUUtilization',
            Namespace: 'AWS/EC2',
            Statistic: 'Average',
            Dimensions: [
              {
                Name: 'InstanceId',
                Value: instanceId
              }
            ],
            Period: 300,
            EvaluationPeriods: 6,
            Threshold: (arch == 'x86_64') ? 0.16 : 0.13,
            ComparisonOperator: 'LessThanThreshold',
            TreatMissingData: 'ignore'
          };

          cw.putMetricAlarm(setMinAlarmParams, (errMinAlarm, dataMinAlarm) => {
            if (errMinAlarm) {
              const response = {
                statusCode: 500,
                body: JSON.stringify(errMinAlarm),
              };
              console.log(response);
              resolve(response);
            } else {
              let setMaxAlarmParams = {
                AlarmName: 'end_cpumax_' + instanceId,
                AlarmDescription: 'End instance for using above max. CPU',
                AlarmActions: ['arn:aws:automate:eu-west-1:ec2:terminate'],
                MetricName: 'CPUCreditBalance',
                Namespace: 'AWS/EC2',
                Statistic: 'Average',
                Dimensions: [
                  {
                    Name: 'InstanceId',
                    Value: instanceId
                  }
                ],
                Period: 300,
                EvaluationPeriods: 5,
                Threshold: 1,
                ComparisonOperator: 'LessThanThreshold',
                TreatMissingData: 'ignore'
              };
              cw.putMetricAlarm(setMaxAlarmParams, (errMaxAlarm, dataMaxAlarm) => {
                if (errMaxAlarm) {
                  const response = {
                    statusCode: 500,
                    body: JSON.stringify(errMaxAlarm),
                  };
                  console.log(response);
                  resolve(response);
                } else {
                  let setNetAlarmParams = {
                    AlarmName: 'end_netmax_' + instanceId,
                    AlarmDescription: 'End instance for max. outgress network',
                    AlarmActions: ['arn:aws:automate:eu-west-1:ec2:terminate'],
                    MetricName: 'NetworkOut',
                    Namespace: 'AWS/EC2',
                    Statistic: 'Sum',
                    Dimensions: [
                      {
                        Name: 'InstanceId',
                        Value: instanceId
                      }
                    ],
                    Period: 300,
                    EvaluationPeriods: 1,
                    Threshold: 400000000,
                    ComparisonOperator: 'GreaterThanThreshold',
                    TreatMissingData: 'ignore'
                  };
                  cw.putMetricAlarm(setNetAlarmParams, (errNetAlarm, dataNetAlarm) => {
                    if (errNetAlarm) {
                      const response = {
                        statusCode: 500,
                        body: JSON.stringify(errNetAlarm),
                      };
                      console.log(response);
                      resolve(response);
                    } else {
                      let setNetAvgAlarmParams = {
                        AlarmName: 'end_netavg_' + instanceId,
                        AlarmDescription: 'End instance for max. average outgress network',
                        AlarmActions: ['arn:aws:automate:eu-west-1:ec2:terminate'],
                        MetricName: 'NetworkOut',
                        Namespace: 'AWS/EC2',
                        Statistic: 'Sum',
                        Dimensions: [
                          {
                            Name: 'InstanceId',
                            Value: instanceId
                          }
                        ],
                        Period: 300,
                        EvaluationPeriods: 4,
                        Threshold: 30000000,
                        ComparisonOperator: 'GreaterThanThreshold',
                        TreatMissingData: 'ignore'
                      };
                      cw.putMetricAlarm(setNetAvgAlarmParams, (errNetAvgAlarm, dataNetAvgAlarm) => {
                        if (errNetAvgAlarm) {
                          const response = {
                            statusCode: 500,
                            body: JSON.stringify(errNetAvgAlarm),
                          };
                          console.log(response);
                          resolve(response);
                        } else {
                          const response = {
                            statusCode: 200,
                            body: JSON.stringify({
                              message: 'OK - ' + instanceId
                            }),
                          };
                          console.log(response);
                          resolve(response);
                        }
                      })

                    }
                  })

                }
              })

            }
          })

        }

      }
    });

  })


};
