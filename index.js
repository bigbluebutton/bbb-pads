const api = require('./lib/etherpad/api');
const subscriber = require('./lib/redis/subscriber');
const monitor = require('./lib/utils/monitor');
const server = require('./lib/express/server');
const Logger = require('./lib/utils/logger');

const logger = new Logger('bbb-pads');

const RETRY = 10;

let retries = 0;

const fibonacci = (index) => {
  if (index === 1) return 0;

  if (index === 2) return 1;

  return fibonacci(index - 1) + fibonacci(index - 2);
};

const abort = (error) => {
  logger.fatal('abort', error);

  process.exit(1);
};

const start = () => {
  api.check().then(() => {
    api.call('checkToken').then(() => {
      subscriber.start();
      server.start();
      monitor.start();
    }).catch(() => abort('key-mismatch'));
  }).catch((error) => {
    logger.warn('starting', error);

    if (retries < RETRY) {
      retries++;

      setTimeout(() => {
        logger.info('start', `retry ${retries} of ${RETRY}`);

        start();
      }, 1000 * fibonacci(retries));
    } else {
      abort('retry-exhausted');
    }
  });
};

start();
