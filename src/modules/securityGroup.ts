import { debug as Debug} from './logger';
const debug = Debug('securityGroup');

const getSecurityGroupContent = (awsEC2, securityGroupIds) : any => {
  return new Promise((resolve,reject)=>{
    try{
      const params = {
        GroupIds: securityGroupIds,
      };  
      awsEC2.describeSecurityGroups(params, function(err, data) {
        resolve(data);
      }); 
    }catch(err){
      reject(err);
    }    
  });
}

export const authorizeSecurityGroupIngress = (awsEC2, groupId, ipRanges, fromPort, toPort, protocol= 'TCP') => {
  return new Promise((resolve,reject)=>{
    debug(`add ${groupId}`);
    var params = {           
      GroupId: groupId,    
      IpPermissions: [
        {
          FromPort: fromPort,
          IpProtocol: protocol,
          IpRanges: ipRanges,       
          ToPort: toPort
        },          
      ]
    };
    // console.log(temparray.length)
    awsEC2.authorizeSecurityGroupIngress(params, function(err, data) {
      if (err) reject(err);
      else{
        resolve();
      }
    });   
  })
}

export const clearSecurityGroupContent = (awsEC2, groupIds, fromPort, toPort, protocol = 'TCP') => {  
  return new Promise(async (resolve,reject)=>{
    try{
      const groupContent = await getSecurityGroupContent(awsEC2, groupIds); 
      if(!groupContent){
        return reject(`Security group:${groupIds} not found`);
      }
      Object.values(groupContent.SecurityGroups).forEach(async (securityGroupContent:any)=>{
        debug(`clear ${securityGroupContent.GroupId}`);
        var securityContent:any = [];
        if(securityGroupContent.IpPermissions[0]){
          for (var i = securityGroupContent.IpPermissions[0].IpRanges.length - 1; i >= 0; i--) {
            securityContent.push(securityGroupContent.IpPermissions[0].IpRanges[i].CidrIp);          
          }
          
          if(securityContent.length>0){
            await removeSecurityGroupContent(awsEC2, securityGroupContent.GroupId, securityContent, fromPort, toPort, protocol);
          }
          else{
            debug('security content is empty skip remove');
          }        
        }
      });
      resolve();
    }catch(err){
      reject(err);
    }
  });    
}
const revokeSecurityGroupIngress = (awsEC2, groupIds, IPArrayJson, fromPort, toPort, protocol) => {
  return new Promise((resolve,reject)=>{
    try{
      const params = {    
        GroupId: groupIds,    
        IpPermissions: [
          {
            FromPort: fromPort,
            IpProtocol: protocol,
            IpRanges: IPArrayJson,
            ToPort: toPort        
          },        
        ],    
      };
      awsEC2.revokeSecurityGroupIngress(params, function(err, data) {
        if(err) reject(err);
        resolve();
      });
    }catch(err){
      reject(err);
    }
    
  })
  
};

const removeSecurityGroupContent = (awsEC2, groupIds, IPArray, fromPort, toPort, protocol) => {
  return new Promise(async (resolve,reject)=>{ 
    try{
      const IPArrayJson = IPArray.reduce((prev, curr) => {
        return [...prev, {
          CidrIp: curr
        }];
      },[])
  
      await revokeSecurityGroupIngress(awsEC2, groupIds, IPArrayJson, fromPort, toPort, protocol);
      resolve();
    }catch(err){
      reject(err);
    }  
  });
}
