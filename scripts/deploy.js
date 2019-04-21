#!/usr/bin/env node
'use strict';
const exec = require('child_process').execSync;
const config = require('config');
const region = config.get('aws.region');
const stackName = config.get('aws.deployStackName');
const S3Bucket = config.get('aws.deployS3Bucket');
exec(`aws configure set region ${region}`);

console.log('package...');
exec(`sam package \
--template-file template.yaml \
--output-template-file packaged.yaml \
--s3-bucket ${S3Bucket}`);

console.log('deploy...');
exec(`sam deploy \
--template-file packaged.yaml \
--stack-name ${stackName} \
--capabilities CAPABILITY_IAM`);

console.log('done!');