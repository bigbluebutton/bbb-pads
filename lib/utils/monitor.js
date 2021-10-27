const database = require('../redis/database');
const mapper = require('../redis/mapper');
const Logger = require('../utils/logger');
const config = require('../../config');

const logger = new Logger('monitor');

const { monitor: settings } = config;

let interval = null;

const publish = () => {
  logger.info('size', 'database', database.getSize());
  logger.info('size', 'mapper', mapper.getSize());
};

const start = () => {
  if (!settings.enabled) return;

  stop();
  interval = setInterval(publish, settings.interval);
  logger.info('started', { interval: `${settings.interval / 60000} minutes` });
};

const stop = () => {
  if (interval) {
    clearInterval(interval);
    interval = null;
    logger.info('stopped');
  }
};

module.exports = {
  start,
  stop,
};
