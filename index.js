const api = require('./lib/etherpad/api');
const subscriber = require('./lib/redis/subscriber');
const Logger = require('./lib/utils/logger');

const logger = new Logger('bbb-pads');

api.call('checkToken').then(response => {
  subscriber.start();
}).catch(() => {
  logger.error('apikey', 'mismatch');
});
