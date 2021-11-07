const redis = require('redis');
const config = require('../../config');
const { options } = require('./utils');
const handler = require('./handler');
const Logger = require('../utils/logger');

const logger = new Logger('subscriber');

const { subscribe: channels } = config.redis.channels;

const subscriber = redis.createClient(options);

subscriber.on('subscribe', (channel) => {
  logger.info('subscribed', { channel });
});

subscriber.on('message', (channel, message) => {
  const msg = typeof message === 'object' ? message : JSON.parse(message);
  handler.handle(msg);
});

const start = () => {
  channels.forEach(channel => subscriber.subscribe(channel));
};

module.exports = {
  start,
};
