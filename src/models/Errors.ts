import config from 'config';
const tableName = config.get('aws.dynamoSettingTable');
import { SETTINGNOTFOUND, SETTINGFIELDERROR } from "../constants";
export class SettingError extends Error {

  message:string = '';
  constructor(message?: string, errorType?:string) {
    // 'Error' breaks prototype chain here
    super();
    let parseMessage = message;
    switch (errorType) {
      case SETTINGNOTFOUND:
        parseMessage = getSettingErrorMessage(message);
        break;
      case  SETTINGFIELDERROR:
        parseMessage = getSettingFieldErrorMessage(message);
        break;
      default:
        break;
    }
    
    if(parseMessage){
      this.message= parseMessage;
    }  
  } 
}


const getSettingErrorMessage = (settingName) => {
  return `Setting: ${settingName} not found in dynamoDB table: ${tableName}`
}
const getSettingFieldErrorMessage = (fieldName) => {
  return `Setting field: ${fieldName} error in dynamoDB table: ${tableName}`
}