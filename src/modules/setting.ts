import { debug as Debug} from './logger';
const debug = Debug('setting');
import config from 'config';
import { Setting } from '../models/Setting';

import { SETTINGNOTFOUND, SETTINGFIELDERROR } from "../constants";
import { SettingError } from '../models/Errors';

const tableName = config.get('aws.dynamoSettingTable');

export const getConfig = (dynamodb): Promise<Array<string>> => {
  return new Promise((resolve,reject)=>{
    const params = {
      Key: {
        "name": {
         S: "config"
        },        
      }, 
      TableName: tableName
    };
    dynamodb.getItem(params, function(err, data) {
      if (err){
        reject(err);
      }
      else{
        if(!data.Item) return reject('Config not found in dynamoDB table: security_group_updater_setting');
        if(!data.Item.updaterName) return reject('Config setting error. Please read doc to get information');
        if(!data.Item.updaterName.SS) return reject('Config setting error. Please read doc to get information');
        resolve(data.Item.updaterName.SS);
      }      
    });
  })
}

export const getSetting = (dynamodb, name: string): Promise<Setting> => {
  return new Promise((resolve,reject)=>{
    try{
      const params = {
        Key: {
          "name": {
           S: name
          },        
        }, 
        TableName: tableName
      };
      dynamodb.getItem(params, function(err, data) {
        try{
          if (err){
            reject(err);
          }
          else{
            if(!data.Item) throw new SettingError(name,SETTINGNOTFOUND);
            
            if(!data.Item.includeService) throw new SettingError('includeService',SETTINGNOTFOUND);
            if(!data.Item.includeService.SS) throw new SettingError('includeService',SETTINGFIELDERROR);
            if(!data.Item.includeRegion) throw new SettingError('includeRegion',SETTINGNOTFOUND);
            if(!data.Item.includeRegion.SS) throw new SettingError('includeRegion',SETTINGFIELDERROR);
            if(!data.Item.protocol) throw new SettingError('protocol',SETTINGNOTFOUND);
            if(!data.Item.protocol.S) throw new SettingError('protocol',SETTINGFIELDERROR);
            if(!data.Item.toPort) throw new SettingError('toPort',SETTINGNOTFOUND);
            if(!data.Item.toPort.N) throw new SettingError('toPort',SETTINGFIELDERROR);
            if(!data.Item.fromPort) throw new SettingError('fromPort',SETTINGNOTFOUND);
            if(!data.Item.fromPort.N) throw new SettingError('fromPort',SETTINGFIELDERROR);
            if(!data.Item.sgIds) throw new SettingError('sgIds',SETTINGNOTFOUND);
            if(!data.Item.sgIds.SS) throw new SettingError('sgIds',SETTINGFIELDERROR);
            if(!data.Item.region) throw new SettingError('region',SETTINGNOTFOUND);
            if(!data.Item.region.S) throw new SettingError('region',SETTINGFIELDERROR);
    
            
            resolve({
              name,
              includeService: data.Item.includeService.SS,
              includeRegion: data.Item.includeRegion.SS,
              protocol:data.Item.protocol.S,
              toPort: data.Item.toPort.N,
              fromPort: data.Item.fromPort.N,
              sgIds: data.Item.sgIds.SS,
              region: data.Item.region.S,
            });
          }      
        }catch(err){
          reject(err);
        }        
      });
    }catch(err){
      reject(err);
    }
    
  })
}
