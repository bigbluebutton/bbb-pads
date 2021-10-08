const redis = require('redis');
const config = require('../../config');
const { options } = require('./utils');
const logger = require('../utils/logger');

const { publisher: channel } = config.redis.channels;

const publisher = redis.createClient(options);

const publish = (message) => {
  logger.debug('publisher', 'publish', JSON.stringify(message));
  publisher.publish(channel, message);
};

module.exports = {
  publish,
};
