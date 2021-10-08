const axios = require('axios');
const config = require('config');
const logger = require('../utils/logger');

const { settings: etherpad } = config;

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
    if (!methods.valid(method, params)) return reject();

    axios({
      method: 'get',
      url: buildURL(method, params),
      responseType: 'json',
    }).then((response) => {
      const { status } = response;
      if (status !== 200) {
        logger.error('api', 'call', status);

        return reject();
      }

      const {
        code,
        message,
      } = response.data;

      if (code !== 0) {
        logger.error('api', 'call', message);

        return reject();
      }

      const { data } = response.data;

      resolve(data);
    }).catch(() => reject());
  });
};

module.exports {
  call,
};
