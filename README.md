# AWS Secuirty updater
Get aws ip list to update security group.

*NOTE: Please test this project in your aws test env. This project will rewrite your security groups.*

## How to use

Prepare: Please make surce you have aws cli and securtiy key in command line env. 

1. Install packages
```bash
$ npm i
```   
2. Install dynamo table and sample data
```bash
$ npm run init-dynamo
$ npm run copy-sample-dynamo-data
```

3. Modify setting in dynamo table: security_group_updater_setting

4. Create SQS to receive aws ip change event. [read more](https://docs.aws.amazon.com/en_us/general/latest/gr/aws-ip-ranges.html#subscribe-notifications)

5. Create your config and modify it
```bash
$ cp config/sample.json config/default.json
$ vi config/default.json
```

6. Test, if you use vscode, you can modify .vscode/launch.json to your aws profile.
```bash
$ npm run debug
```

6. Deploy
```bash
$ npm run deploy
```

7. Test it on aws. You can send a SQS message to your queue.