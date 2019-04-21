#!/usr/bin/env node
'use strict';
const fs = require('fs');
const config = require('config');
const modifyFiles = require('./utils').modifyFiles;

const sqsUrlArn = config.get('aws.sqsQueueArn');

fs.copyFileSync('./sam-template.yaml', './template.yaml');  

modifyFiles(['./template.yaml'], [{
  regexp: /YOUR_SQS_ARN/g,
  replacement: sqsUrlArn
}]);


