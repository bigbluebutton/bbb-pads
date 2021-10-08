const redis = require('redis');
const config = require('../../config');
const utils = require('./utils');
const logger = require('../utils/logger');

const { subscribe: channels } = config.redis.channels;

const subscriber = redis.createClient(utils.options);

subscriber.on('subscribe', (channel, count) => {
  logger.info('subscriber', 'subscribed', channel);
});

subscriber.on('message', (channel, message) => {
  logger.debug('subscriber', 'received', message);
});


const unsubscribe = () => {
  logger.info('subscriber', 'unsubscribe');
  subscriber.unsubscribe();
};

const quit = () => {
  logger.info('subscriber', 'quit');
  subscriber.quit();
};

const start = () => {
  channels.forEach(channel => subscriber.subscribe(channel));
};

const stop = () => {
  unsubscribe();
  quit();
};

module.exports = {
  start,
  stop,
};
