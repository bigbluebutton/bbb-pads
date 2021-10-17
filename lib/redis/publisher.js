const redis = require('redis');
const config = require('../../config');
const { options } = require('./utils');
const Logger = require('../utils/logger');

const logger = new Logger('publisher');

const { publish: channel } = config.redis.channels;

const publisher = redis.createClient(options);

const publish = (message) => {
  logger.debug('publish', { message });
  publisher.publish(channel, message);
};

module.exports = {
  publish,
};
