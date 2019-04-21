import axios from 'axios';
import config from 'config';

import AWS from 'aws-sdk';

import { debug as Debug} from './modules/logger';
const debug = Debug('handler');

import { clearSecurityGroupContent, authorizeSecurityGroupIngress, } from './modules/securityGroup';
import { showS3List } from './modules/helper';
import { getConfig, getSetting } from './modules/setting';

const defaultIpRangesJsonUrl = config.get('aws.ipRangesJsonUrl');
const awsRegion = config.get('aws.region');
const sqsQueueUrl = config.get('aws.sqsQueueUrl');
const maxGroupRecordsCount = 50;

const getAWSIPList = (ipRangesJsonUrl): Promise<any> => {
  return new Promise(async (resolve, reject)=>{
    try{
      const response = await axios.get(ipRangesJsonUrl);
      resolve(response.data)
    }catch(err){
      reject(err);
    }    
  })  
}  

const getIpList = (awsIPList, includeService, includeRegion) => {
  return new Promise((resolve,reject)=>{
    let IPArray = awsIPList.prefixes.filter((curr)=>{
      if(includeService){                
        return includeRegion.indexOf(curr.region) > -1 && includeService.indexOf(curr.service) > -1
      }      
      return includeRegion.indexOf(curr.region) > -1
    });
    const IPArrayJson = IPArray.reduce((prev, curr, currentIndex) => {     
      let checkCidrIp = curr.ip_prefix;
      let checkedPrev = prev.filter((value)=>{
        return value.CidrIp === checkCidrIp;
      });
      if (checkedPrev.length>0){
        return [...prev];
      }
      return [...prev, {
        CidrIp: curr.ip_prefix,
        Description: curr.region+'-'+curr.service
      }];
    },[]);
  
    resolve(IPArrayJson);
  });  
};


const deleteMessage = (awsSqs, queueUrl,receipt) => {
  return new Promise((resolve, reject) => {
    var params = {
        QueueUrl: queueUrl,
        ReceiptHandle: receipt
    };    
    awsSqs.deleteMessage(params, function(err, data) {
        if(err) {
            debug(err);
            reject(err);
        }
        resolve();
    });
  });    
};
export const main = async (event, context, callback) => {
  // receive from SQS
  AWS.config.update({region:awsRegion});
  const sqs = new AWS.SQS();

  const records = event.Records
  for (let index = 0; index < records.length; index++) {
    const element = records[index];
    const receipt = element.receiptHandle;
    try{      
      const ipRangesJsonUrl =element.body.url;      
      await updateIp(ipRangesJsonUrl);
    }catch(err){
      debug(err);
    }finally{
      debug('created');
      await deleteMessage(sqs, sqsQueueUrl, receipt);
    }
  }
  context.done();
  callback(null, 'done');
};
export const localMain = async () => {  
  AWS.config.update({region:awsRegion});  
  await updateIp();  
};
const updateIp = (ipRangesJsonUrl = defaultIpRangesJsonUrl) => {
  return new Promise(async (resolve,reject)=>{
    try{

      // for loacl debug
      if(process.env.NODE_ENV==='local'){
        const s3List : any = await showS3List(new AWS.S3());
        console.log(`aws owner: ${s3List.Owner.DisplayName}`);   
      }
      
      const ipJson = await getAWSIPList(ipRangesJsonUrl);
      const awsDynamo = new AWS.DynamoDB();  
      const settings = await getConfig(awsDynamo);
  
      for (let index = 0; index < settings.length; index++) {
        const settingName = settings[index];      
        const setting = await getSetting(awsDynamo, settingName);      
        debug(setting);
  
        const { sgIds: groupIds, includeRegion, includeService, fromPort,
          toPort, protocol } = setting;
        
        const ipList: any = await getIpList(ipJson, includeService, includeRegion);
        const chunk = maxGroupRecordsCount;
        const needSecurityGroupCount = Math.ceil(ipList.length / chunk)
          
        if(needSecurityGroupCount > groupIds.length){
          debug(`Security group not enough!`);
          debug(`${includeRegion} ${includeService}: need ${needSecurityGroupCount} security groups. `);
        }
        else{
          const ec2 = new AWS.EC2();  
          await clearSecurityGroupContent(ec2, groupIds, fromPort, toPort, protocol);
  
          // add 
          let index = 0;    
          for (let i = 0; i < ipList.length; i+= chunk) {    
            const temparray = ipList.slice(i,i+chunk);        
            await authorizeSecurityGroupIngress(ec2, groupIds[index++], temparray, fromPort, toPort, protocol);        
          }
        }  
      }        
    }catch(err){    
      debug(err.message ? err.message : err)
    }  
  });
  
}
