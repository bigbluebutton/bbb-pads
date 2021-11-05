const publisher = require('./publisher');
const Logger = require('../utils/logger');

const logger = new Logger('sender');

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
    case 'groupCreated':
      message = build('PadGroupCreatedEvtMsg', meetingId, body);
      break;
    case 'padCreated':
      message = build('PadCreatedEvtMsg', meetingId, body);
      break;
    case 'padUpdated':
      message = build('PadUpdatedSysMsg', meetingId, body);
      break;
    case 'padContent':
      message = build('PadContentSysMsg', meetingId, body);
      break;
    case 'padPatch':
      message = build('PadPatchSysMsg', meetingId, body);
      break;
    case 'sessionCreated':
      message = build('PadSessionCreatedEvtMsg', meetingId, body);
      break;
    case 'sessionDeleted':
      message = build('PadSessionDeletedSysMsg', meetingId, body);
      break;
    default:
  }

  return message;
};

const send = (type, meetingId, body) => {
  const message = buildMessage(type, meetingId, body);

  if (!message) {
    logger.warn('invalid message', { type, meetingId, body });

    return;
  }

  publisher.publish(message);
};

module.exports = {
  send,
};
