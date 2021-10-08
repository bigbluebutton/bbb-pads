const redis = require('redis');
const config = require('config');
const utils = require('./utils');
const logger = require('../utils/logger');

const { channels: redis.channels.subscriber } = config;

const subscriber = redis.createClient(utils.options);

subscriber.on('subscribe', (channel, count) => {
  logger.info('subscriber', 'subscribed', channel);
});

subscriber.on('message', (channel, message) => {
  logger.debug('subscriber', 'received', message);
});

channels.subscribe.forEach(channel => subscriber.subscribe(channel));

const unsubscribe = () => {
  logger.info('subscriber', 'unsubscribe');
  subscriber.unsubscribe();
};

const quit = () => {
  logger.info('subscriber', 'quit');
  subscriber.quit();
};

module.exports {
  quit,
  unsubscribe,
};
