const publisher = require('./publisher');
const logger = require('../utils/logger');

const buildEnvelope = (name) => {

  return {
    name,
    routing: { sender: 'bbb-pads' },
    timestamp: (new Date()).getTime(),
  };
};

const buildCore = (meetingId, name, body) => {

  return {
    header: {
      meetingId,
      name,
    },
    body,
  };
};

const build = (name, meetingId, body) => {

  return JSON.stringify({
    envelope: buildEnvelope(name),
    core: buildCore(meetingId, name, body),
  });
};

const buildMessage = (type, meetingId, body) => {
  let message;
  switch (type) {
    case 'groupAdded':
      message = build('PadGroupCreatedEvtMsg', meetingId, body);
      break;
    case 'padAdded':
      message = build('PadCreatedEvtMsg', meetingId, body);
      break;
    case 'sessionAdded':
      message = build('PadSessionCreatedEvtMsg', meetingId, body);
      break;
    case 'sessionRemoved':
      message = build('PadSessionRemovedSysMsg', meetingId, body);
      break;
    default:
  }

  return message;
};

const send = (type, meetingId, body) => {
  const message = buildMessage(type, meetingId, body);

  if (!message) {
    logger.warn('sender', 'invalid', 'message', type, meetingId, JSON.stringify(body));

    return;
  }

  publisher.publish(message);
};

module.exports = {
  send,
};
