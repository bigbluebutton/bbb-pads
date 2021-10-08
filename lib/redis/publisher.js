const redis = require('redis');
const config = require('../../config');
const utils = require('./utils');
const logger = require('../utils/logger');

const { publisher: channel } = config.redis.channels;

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
