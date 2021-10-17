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
    logger.error('retry-exhausted');

    return new Error('exhausted');
  }

  if (options.attempt > 10) {
    logger.error('attempt-limit');

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

module.exports = {
  options,
};
