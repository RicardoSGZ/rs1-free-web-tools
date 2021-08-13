const AWS = require('aws-sdk');
let request = require('request');

const SERVERDATA = {
  region: 'eu-west-1',
  subnet: 'XXXX' //YOUR SUBNET ID
}

const TELEGRAM_TOKEN = 'XXXX'; //YOUR TELEGRAM TOKEN


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

let sendToTelegram = async (chatId, text) => {
  return new Promise((resolve, reject) => {
    request.get({
      url: 'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage',
      formData: {
        chat_id: chatId,
        text: text
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
        //let bodyObject = JSON.parse(body);
        console.log(body);
        resolve();
      }
    })
  })
}

let sendToInlineTelegram = async (queryId, text) => {
  return new Promise((resolve, reject) => {
    request.get({
      url: 'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/answerInlineQuery',
      formData: {
        inline_query_id: queryId,
        cache_time: 5,
        results: JSON.stringify([
          {
            type: 'article',
            id: new Date().getTime().toString(),
            title: 'VPS currently in use',
            description: text,
            thumb_url: 'https://rs1.es/apple-touch-icon.png',
            thumb_width: 256,
            thumb_height: 256,
            input_message_content: {
              message_text: text,
              parse_mode: 'Markdown'
            }
          }
        ])
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
        //let bodyObject = JSON.parse(body);
        console.log(body);
        resolve();
      }
    })
  })
}

exports.handler = async (event) => {

  let ec2 = new AWS.EC2({
    region: SERVERDATA.region
  });

  let max = 30;

  let eventBody = JSON.parse(event.body);
  console.log(event.body);
  if (eventBody.message) {
    let bodyMessage = eventBody.message;
    let chatId = bodyMessage.chat.id;
    let text = bodyMessage.text;
    if (text == 'vps' || text == '/vps' || text == '/vps@rs1_fwt_bot') {
      let instancesNumber = await checkRunningInstances(SERVERDATA.subnet, ec2);
      let percentage = ((instancesNumber / max) * 100).toFixed(2);
      let text = `${instancesNumber.toString()} / ${max.toString()} (${percentage.toString()}%)`;
      await sendToTelegram(chatId, text);
      return true;
    } else if (text == '/start') {
      return true;
    } else {
      console.log(text);
      //await sendToTelegram(chatId, 'Error');
      return false;
    }
  } else if (eventBody.inline_query) {
    let inlineMessage = eventBody.inline_query;
    let queryId = inlineMessage.id;
    let query = inlineMessage.query;
    if (query == 'vps') {
      let instancesNumber = await checkRunningInstances(SERVERDATA.subnet, ec2);
      let percentage = ((instancesNumber / max) * 100).toFixed(2);
      let text = `${instancesNumber.toString()} / ${max.toString()} (${percentage.toString()}%)`;
      await sendToInlineTelegram(queryId, text);
      return true;
    } else {
      return true;
    }
  }
  

 



}