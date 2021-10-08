const api = require('./lib/etherpad/api');
const subscriber = require('./lib/redis/subscriber');
const logger = require('./lib/utils/logger');

api.call('checkToken').then(response => {
  subscriber.start();
}).catch(() => {
  logger.error('etherpad', 'apikey', 'mismatch');
});
