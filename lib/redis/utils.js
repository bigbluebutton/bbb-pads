const config = require('../../config');
const Logger = require('../utils/logger');

const logger = new Logger('redis');

const { redis: settings } = config;

const retry = (options) => {
  if (options.error && options.error.code === 'ECONNREFUSED') {
    logger.error('connection-refused');

    return new Error('refused');
  }

  if (options.total_retry_time > 1000 * 60 * 60) {
    logger.fatal('retry-exhausted');

    return new Error('exhausted');
  }

  if (options.attempt > 10) {
    logger.fatal('attempt-limit');

    return undefined;
  }

  return Math.min(options.attempt * 100, 3000);
};

const options = {
  host: settings.host,
  port: settings.port,
  retry_strategy: retry,
};

if (settings.password) {
  options.password = settings.password;
}

// Adapted from https://gist.github.com/zensh/4975495
const memory = (obj) => {
  let bytes = 0;
  let objClass;

  const calculate = (obj) => {
    if (obj !== null && obj !== undefined) {
      switch(typeof obj) {
        case 'number':
          bytes += 8;
          break;
        case 'string':
          bytes += obj.length * 2;
          break;
        case 'boolean':
          bytes += 4;
          break;
        case 'object':
          objClass = Object.prototype.toString.call(obj).slice(8, -1);
          if (objClass === 'Object' || objClass === 'Array') {
            for (const key in obj) {
              if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
              calculate(obj[key]);
            }
          } else bytes += obj.toString().length * 2;
          break;
        default:
      }
    }

    return bytes;
  };

  const format = (bytes) => {
    if (bytes < 1024) return `${bytes} bytes`;
    else if (bytes < 1048576) return `${(bytes / 1024).toFixed(3)} KiB`;
    else if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(3)} MiB`;
    else return `${(bytes / 1073741824).toFixed(3)} GiB`;
  };

  return format(calculate(obj));
};

module.exports = {
  options,
  memory,
};
