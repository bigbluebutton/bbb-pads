const httpProxy = require('http-proxy');
const config = require('../../config');
const api = require('../etherpad/api');
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
  const { sessionId } = req.params;
  proxyReq.setHeader('Cookie', `sessionID=${sessionId}`);
});

const web = (req, res) => {
  const { padId } = req.params;
  const { groupId } = parsePadId(padId);
  api.call('createAuthor', { name: 'proxy' }).then(response => {
    const authorId = response.authorID;
    api.call('createSession', {
      groupID: groupId,
      authorID: authorId,
      validUntil: Date.now() + settings.session.ttl,
    }).then(response => {
      const sessionId = response.sessionID;
      req.params.sessionId = sessionId;
      proxy.web(req, res);
    }).catch(() => {});
  }).catch(() => {});
};

module.exports = {
  web,
};
