const api = require('./lib/etherpad/api');
const subscriber = require('./lib/redis/subscriber');
const monitor = require('./lib/utils/monitor');
const server = require('./lib/express/server');
const Logger = require('./lib/utils/logger');

const logger = new Logger('bbb-pads');

api.call('checkToken').then(() => {
  subscriber.start();
  server.start();
  monitor.start();
}).catch(() => {
  logger.fatal('api key', 'mismatch');
});
