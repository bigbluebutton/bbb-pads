const redis = require('redis');
const config = require('config');
const utils = require('./utils');
const logger = require('../utils/logger');

const { channel: redis.channels.publisher } = config;

const publisher = redis.createClient(utils.options);

const publish = (message) => {
  logger.debug('publisher', 'publish', message);
  publisher.publish(channel, message);
};

const quit = () => {
  logger.info('publisher', 'quit');
  publisher.quit();
};

module.exports {
  publish,
  quit,
};
