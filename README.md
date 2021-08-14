# RS1 Free Web Tools project code
### Note: I currently have no time to improve this repo (more and better info in README, more comments in code, etc.) but anyone can ask me about this project and I will add the answers to the repository.
## Tools needed:
### AWS (EC2, S3, Lambda, Cloudfront, EventBridge)
- A VPC and subnet
- A key pair
- An AMI for each architecture (x86_64 and arm). Follow the steps in wetty/how-to-install-wetty.txt with an EC2 instance and then create an image of it (Actions > Image and templates > Create an image)
- EventBridge rules:
    - Delete alarms: every 10 min invoke delalarms function
    - Delete servers: every 5 min invoke delservers function
    - Set alarms: when "EC2 Instance State-change Notification" has "running" state, invoke setalarm function
- S3 buckets for website, storage tool and compress tool
- A Cloudfront distribution for each bucket
- "Request" (Node.js) and "Zip" (Linux) packages uploaded as Lambda layers

### Serverless Framework

### WeTTY (Web Terminal)
- Take a look at "wetty" folder


## FAQ
### How to upload Request and Zip packages as Lambda layers
- Download them from lambda-layers folder
- For each of the packages, do this:
- Go to your AWS account (console.aws.amazon.com) > Lambda > Layers > Create layer.
- Type a name and description
- Check "Upload from a .zip file" and upload the file
- Select Node.js 12.x as Compatible runtime
- Click create and copy the arn (it's like: arn:aws:lambda:REGION:ACCOUNT-ID:layer:LAYER-NAME:LAYER-VERSION).
- Paste arn in serverless.yml files

### How to setup Telegram Bot
- Create a private chat with @BotFather and create a bot
- Save the token
- Ensure you had created the telegram-bot function (paste the token in the right place) and you had the API URL for that function
- Type this "curl" command (or use any program that can do HTTP requests)


```
curl --request POST --url https://api.telegram.org/bot[[YOUR-TELEGRAM-BOT-TOKEN]]/setWebhook --header 'content-type: application/json' --data '{"url": "https://[[YOUR-API-URL]]/telegram-bot"}'
```

