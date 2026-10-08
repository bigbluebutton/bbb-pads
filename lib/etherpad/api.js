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

const origin = `${settings.scheme}://${settings.host}:${settings.port}`;

const baseURL = `${origin}/api`;

const url = `${baseURL}/${settings.api.version}`;

const AUTH_METHODS = {
  APIKEY: 'apikey',
  OAUTH2: 'oauth2',
};

const auth = Object.assign({
  method: AUTH_METHODS.OAUTH2,
  clientId: 'bbb-pads',
  tokenPath: '/oidc/token',
  // Resource indicator (RFC 8707). Etherpad only verifies JWT access tokens on
  // its HTTP API, and its OpenID provider issues a JWT only for a token bound to
  // a resource, so one is always requested. Defaults to Etherpad's own origin.
  resource: origin,
  // Refresh the access token this many seconds before Etherpad expires it
  refreshMargin: 60,
}, settings.api.auth || {});

if (!Object.values(AUTH_METHODS).includes(auth.method)) {
  logger.fatal('invalid etherpad.api.auth.method', { method: auth.method });

  process.exit(1);
}

const useOAuth2 = auth.method === AUTH_METHODS.OAUTH2;

const buildURL = (method, params) => {
  const query = [];
  if (!useOAuth2) query.push(`apikey=${settings.api.key}`);
  for (const [key, value] of Object.entries(params)) {
    query.push(`${key}=${encodeURIComponent(value)}`);
  }

  return `${url}/${method}?${query.join('&')}`;
};

// OAuth2 client credentials grant (Etherpad >= 2.0): bbb-pads is registered as
// a client in Etherpad's settings.json (sso.clients) and the API key file is the
// client secret. The access token is cached until shortly before it expires.
const tokenURL = `${origin}${auth.tokenPath}`;

let token = null;
let tokenRequest = null;

const requestToken = () => {
  if (!tokenRequest) {
    logger.debug('token request', { tokenURL, clientId: auth.clientId });

    tokenRequest = axios({
      method: 'post',
      url: tokenURL,
      auth: {
        username: auth.clientId,
        password: settings.api.key,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: `grant_type=client_credentials&resource=${encodeURIComponent(auth.resource)}`,
      responseType: 'json',
    }).then((response) => {
      const {
        access_token: accessToken,
        expires_in: expiresIn,
      } = response.data;

      if (!accessToken) throw new Error('missing access_token');

      token = {
        value: accessToken,
        expiresAt: Date.now() + (Math.max(expiresIn || 0, auth.refreshMargin + 1) - auth.refreshMargin) * 1000,
      };
      logger.info('token acquired', { expiresIn });

      return token.value;
    }).catch((error) => {
      token = null;
      logger.error('token request', { error: error.message });

      throw error;
    }).finally(() => {
      tokenRequest = null;
    });
  }

  return tokenRequest;
};

const getToken = () => {
  if (token && Date.now() < token.expiresAt) return Promise.resolve(token.value);

  return requestToken();
};

const invalidateToken = () => {
  token = null;
};

const buildHeaders = () => {
  if (!useOAuth2) return Promise.resolve({});

  return getToken().then((value) => ({ Authorization: `Bearer ${value}` }));
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

const request = (method, url, retry = true) => {
  return buildHeaders().then((headers) => {
    return axios({
      method: 'get',
      url,
      headers,
      responseType: 'json',
    });
  }).catch((error) => {
    const status = error.response ? error.response.status : null;
    // The access token was revoked or expired early: fetch a fresh one and retry once
    if (useOAuth2 && retry && status === 401) {
      logger.warn('unauthorized, refreshing token', { method });
      invalidateToken();

      return request(method, url, false);
    }

    throw error;
  });
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

    const url = buildURL(method, params);

    logger.debug(`API request: ${url}`);

    request(method, url).then((response) => {
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
    }).catch((error) => {
      logger.error('call', { method, error: error.message });
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
