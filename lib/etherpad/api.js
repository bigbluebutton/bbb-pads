const axios = require('axios');
const {
  buildId,
  validate,
} = require('./methods');
const config = require('../../config');
const Logger = require('../utils/logger');
const {
  registerAPIError,
  registerAPICall,
} = require('../utils/prometheus');

const logger = new Logger('api');

const { etherpad: settings } = config;

const baseURL = `${settings.scheme}://${settings.host}:${settings.port}/api`;

const url = `${baseURL}/${settings.api.version}`;

const buildURL = (method, params) => {
  let query = `apikey=${settings.api.key}`;
  for (const [key, value] of Object.entries(params)) {
    query += `&${key}=${encodeURIComponent(value)}`;
  }

  return `${url}/${method}?${query}`;
};

const TOKEN = {};

const lock = (id) => TOKEN[id] = true;

const release = (id) => delete TOKEN[id];

const locked = (id) => {
  if (TOKEN[id]) {
    logger.error('locked', { id });

    return true;
  }

  return false;
};

const call = (method, params = {}) => {
  return new Promise((resolve, reject) => {
    registerAPICall(method);

    if (!validate(method, params)) {
      registerAPIError(method);

      return reject();
    }

    const id = buildId(method, params);
    if (locked(id)) return reject();
    lock(id);

    axios({
      method: 'get',
      url: buildURL(method, params),
      responseType: 'json',
    }).then((response) => {
      const { status } = response;
      if (status !== 200) {
        logger.error('call', { status });
        registerAPIError(method);

        return reject();
      }

      const {
        code,
        message,
        data,
      } = response.data;

      if (code !== 0) {
        logger.error('call', { message });
        registerAPIError(method);

        return reject();
      }

      logger.debug('call', { method, data });

      resolve(data);
    }).catch(() => {
      registerAPIError(method);
      reject();
    }).finally(() => release(id));
  });
};

const check = () => {
  return axios({
    method: 'get',
    url: baseURL,
    responseType: 'json'
  });
};

module.exports = {
  call,
  check,
};
