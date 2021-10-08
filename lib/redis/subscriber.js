const redis = require('redis');
const config = require('../../config');
const { options } = require('./utils');
const handler = require('./handler');
const logger = require('../utils/logger');

const { subscribe: channels } = config.redis.channels;

const subscriber = redis.createClient(options);

subscriber.on('subscribe', (channel, count) => {
  logger.info('subscriber', 'subscribed', channel);
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
