const axios = require('axios');
const validate = require('./methods');
const config = require('../../config');
const Logger = require('../utils/logger');

const logger = new Logger('api');

const { etherpad: settings } = config;

const url = `${settings.scheme}://${settings.host}:${settings.port}/api/${settings.version}`;

const buildURL = (method, params) => {
  let query = `apikey=${settings.apikey}`;
  for (const [key, value] of Object.entries(params)) {
    query += `&${key}=${encodeURIComponent(value)}`;
  }

  return `${url}/${method}?${query}`;
};

const call = (method, params = {}) => {
  return new Promise((resolve, reject) => {
    if (!validate(method, params)) return reject();

    axios({
      method: 'get',
      url: buildURL(method, params),
      responseType: 'json',
    }).then((response) => {
      const { status } = response;
      if (status !== 200) {
        logger.error('call', { status });

        return reject();
      }

      const {
        code,
        message,
        data,
      } = response.data;

      if (code !== 0) {
        logger.error('call', { message });

        return reject();
      }

      logger.debug('call', { method, data });

      resolve(data);
    }).catch(() => reject());
  });
};

module.exports = {
  call,
};
