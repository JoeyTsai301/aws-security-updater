import axios from 'axios';
import config from 'config';

import AWS from 'aws-sdk';

import { debug as Debug} from './modules/logger';
const debug = Debug('handler');

import { clearSecurityGroupContent, authorizeSecurityGroupIngress, } from './modules/securityGroup';
import { showS3List } from './modules/helper';
import { getConfig, getSetting } from './modules/setting';

const ipRangesJsonUrl = config.get('aws.ipRangesJsonUrl');
const awsRegion = config.get('aws.region');

const maxGroupRecordsCount = 50;

const getAWSIPList = (): Promise<any> => {
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

export const main = async () => {
  try{
    const ipJson = await getAWSIPList();
    const s3List : any = await showS3List(new AWS.S3());
    console.log(`aws owner: ${s3List.Owner.DisplayName}`);
 
    AWS.config.update({region:awsRegion});
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

    // const groupIds = ['sg-061424fe101b1f1cd','sg-0e12710e8246bbbbf','sg-062fccfdf0882e13d', 'sg-0fbd4a79e38513cac'];
    // const includeRegion = ['GLOBAL','ap-northeast-2','ap-southeast-2','ap-northeast-1'];
    // const includeService = ['AMAZON'];
    // const port = 3306;
    
      
  }catch(err){    
    debug(err.message ? err.message : err)
  }  
}
