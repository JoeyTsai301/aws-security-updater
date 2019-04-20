const Debug = require('debug');
const config = require('config');
const appName = config.get('appName');

export const debug = moduleName => Debug(`${appName}:${moduleName}`);

