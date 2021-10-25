const express = require('express');
const proxy = require('./proxy');
const config = require('../../config');
const Logger = require('../utils/logger');

const logger = new Logger('express');

const { express: settings } = config;

const app = express();

app.get('/p/:padId/export/:type', (req, res) => proxy.web(req, res));

const start = () => {
  const {
    host,
    port,
  } = settings;

  app.listen(port, host, () => logger.info('started', { host, port }))
};

module.exports = {
  start,
};
