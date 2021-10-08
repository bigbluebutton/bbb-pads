const logger = require('../utils/logger');

const messages = {
  USER_JOINED: 'UserJoinedMeetingEvtMsg',
  USER_LEFT: 'UserLeftMeetingEvtMsg',
  USER_UPDATED: 'UserRoleChangedEvtMsg',
  USER_LOCKED: 'UserLockedInMeetingEvtMsg',
  MEETING_CREATED: 'MeetingCreatedEvtMsg',
  MEETING_ENDED: 'MeetingEndingEvtMsg',
  MEETING_UPDATED: 'LockSettingsInMeetingChangedEvtMsg',
  PAD_CREATED: 'PadCreateSysMsg',
  PAD_UPDATED: 'PadUpdateSysMsg',
};

const handleUserJoined = (data) => {
  logger.info('user', 'joined', JSON.stringify(data));
};

const handleUserLeft = (data) => {
  logger.info('user', 'left', JSON.stringify(data));
};

const handleUserUpdated = (data) => {
  logger.info('user', 'updated', JSON.stringify(data));
};

const handleUserLocked = (data) => {
  logger.info('user', 'locked', JSON.stringify(data));
};

const handleMeetingCreated = (data) => {
  logger.info('meeting', 'created', JSON.stringify(data));
};

const handleMeetingEnded = (data) => {
  logger.info('meeting', 'ended', JSON.stringify(data));
};

const handleMeetingUpdated = (data) => {
  logger.info('meeting', 'updated', JSON.stringify(data));
};

const handlePadCreated = (data) => {
  logger.info('pad', 'created', JSON.stringify(data));
};

const handlePadUpdated = (data) => {
  logger.info('pad', 'updated', JSON.stringify(data));
};

const check = (object, property) => {
  if (object && object.hasOwnProperty(property)) return true;

  logger.warn('check', 'invalid', property, JSON.stringify(object));

  return false;
};

const validate = (message) => {
  if (!check(message, 'core')) {

    return { valid: false };
  }

  const { core } = message;

  if (!check(core, 'header')) {

    return { valid: false };
  }

  if (!check(core, 'body')) {

    return { valid: false };
  }

  const {
    header,
    body,
  } = core;

  if (!check(header, 'name')) {

    return { valid: false };
  }

  const { name } = header;

  return {
    valid: true,
    name,
    body,
  };
};

const handle = (message) => {
  const data = validate(message);
  if (!data.valid) return null;

  const {
    name,
    body,
  } = data;

  switch (name) {
    case messages.USER_JOINED:
      handleUserJoined(body);
      break;
    case messages.USER_LEFT:
      handleUserLeft(body);
      break;
    case messages.USER_UPDATED:
      handleUserUpdated(body);
      break;
    case messages.USER_LOCKED:
      handleUserLocked(body);
      break;
    case messages.MEETING_CREATED:
      handleMeetingCreated(body);
      break;
    case messages.MEETING_ENDED:
      handleMeetingEnded(body);
      break;
    case messages.MEETING_UPDATED:
      handleMeetingUpdated(body);
      break;
    case messages.PAD_CREATED:
      handlePadCreated(body);
      break;
    case messages.PAD_UPDATED:
      handlePadUpdated(body);
      break;
    default:
  }
};

module.exports = {
  handle,
};
