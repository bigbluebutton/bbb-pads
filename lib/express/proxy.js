const httpProxy = require('http-proxy');
const config = require('../../config');
const api = require('../etherpad/api');
const { ids } = require('../utils/constants');
const Logger = require('../utils/logger');

const logger = new Logger('proxy');

const { proxy: settings } = config.express;

const parsePadId = (padId) => {
  const [groupId, name] = padId.split('$');

  return {
    groupId,
    name,
  };
};

const proxy = httpProxy.createProxyServer({
  target: {
    protocol: config.etherpad.scheme,
    host: config.etherpad.host,
    port: config.etherpad.port,
  },
});

proxy.on('proxyReq', (proxyReq, req) => {
  const {
    padId,
    type,
    sessionId,
  } = req.params;

  logger.info('request', { padId, type, sessionId });
  proxyReq.setHeader('Cookie', `sessionID=${sessionId}`);
});

const web = (req, res) => {
  const { padId } = req.params;
  const { groupId } = parsePadId(padId);
  api.call('createAuthor', { name: 'proxy' }).then(response => {
    const authorId = response.authorID;
    logger.trace(ids.USER, 'created', { groupId, authorId });
    api.call('createSession', {
      groupID: groupId,
      authorID: authorId,
      validUntil: Date.now() + settings.session.ttl,
    }).then(response => {
      const sessionId = response.sessionID;
      logger.trace(ids.SESSION, 'created', { groupId, authorId, sessionId });
      req.params.sessionId = sessionId;
      proxy.web(req, res);
    }).catch(() => logger.error(ids.SESSION, 'creating', { groupId, authorId }));
  }).catch(() => logger.error(ids.USER, 'creating', { groupId }));
};

module.exports = {
  web,
};
