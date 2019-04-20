export interface Setting{
  name: string,
  includeService: string,
  includeRegion: Array<string>,  
  protocol: string,
  toPort: string,
  fromPort: string,
  sgIds:Array<string>,  
  region: string,
};