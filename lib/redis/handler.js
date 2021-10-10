const database = require('./database');
const logger = require('../utils/logger');

const messages = {
  MEETING_CREATED: 'MeetingCreatedEvtMsg',
  MEETING_ENDED: 'MeetingEndingEvtMsg',
  MEETING_LOCKED: 'LockSettingsInMeetingChangedEvtMsg',
  USER_JOINED: 'UserJoinedMeetingEvtMsg',
  USER_LEFT: 'UserLeftMeetingEvtMsg',
  USER_LOCKED: 'UserLockedInMeetingEvtMsg',
  USER_UPDATED: 'UserRoleChangedEvtMsg',
  PAD_CREATED: 'PadCreateSysMsg',
  PAD_UPDATED: 'PadUpdateSysMsg',
};

const handleMeetingCreated = (header, body) => {
  const { intId: meetingId } = body.props.meetingProp;
  database.addMeeting({
    meetingId,
    externalId: body.props.meetingProp.extId,
    name: body.props.meetingProp.name,
    locked: body.props.lockSettingsProps.disableNote,
  }).then(response => {
    logger.info('meeting', 'created', meetingId, JSON.stringify(response));
  }).catch(() => logger.error('meeting', 'creating', meetingId, JSON.stringify(body)));
};

const handleMeetingEnded = (header, body) => {
  const { meetingId } = header;
  logger.info('meeting', 'ended', meetingId, JSON.stringify(body));
  // deleteGroup
  // meetingId: String
};

const handleMeetingLocked = (header, body) => {
  const { meetingId } = header;
  logger.info('meeting', 'locked', meetingId, JSON.stringify(body));
  // disableNote: Boolean
};

const handleUserJoined = (header, body) => {
  const { meetingId } = header;
  database.addUser(meetingId, {
    userId: body.intId,
    externalId: body.extId,
    name: body.name,
    role: body.role,
    locked: body.locked,
  }).then(response => {
    logger.info('user', 'joined', meetingId, JSON.stringify(response));
  }).catch(() => logger.error('user', 'joining', meetingId, JSON.stringify(body)));
};

const handleUserLeft = (header, body) => {
  const { meetingId } = header;
  logger.info('user', 'left', meetingId, JSON.stringify(body));
  // deleteSession
  // intId: String
};

const handleUserLocked = (header, body) => {
  const { meetingId } = header;
  logger.info('user', 'locked', meetingId, JSON.stringify(body));
  // createSession | deleteSession
  // userId: String
  // locked: Boolean
};

const handleUserUpdated = (header, body) => {
  const { meetingId } = header;
  logger.info('user', 'updated', meetingId, JSON.stringify(body));
  // createSession | deleteSession
  // userId: String
  // role: String
};

const handlePadCreated = (header, body) => {
  logger.info('pad', 'created', JSON.stringify(body));
};

const handlePadUpdated = (header, body) => {
  logger.info('pad', 'updated', JSON.stringify(body));
};

const check = (object, property) => {
  if (object && object.hasOwnProperty(property)) return true;

  logger.warn('check', 'invalid', property, JSON.stringify(object));

  return false;
};

const validate = (message) => {
  if (!check(message, 'core')) return { valid: false };

  const { core } = message;

  if (!check(core, 'header')) return { valid: false };
  if (!check(core, 'body')) return { valid: false };

  const {
    header,
    body,
  } = core;

  return {
    valid: true,
    header,
    body,
  };
};

const handle = (message) => {
  const data = validate(message);
  if (!data.valid) return null;

  const {
    header,
    body,
  } = data;

  switch (header.name) {
    case messages.MEETING_CREATED:
      handleMeetingCreated(header, body);
      break;
    case messages.MEETING_ENDED:
      handleMeetingEnded(header, body);
      break;
    case messages.MEETING_LOCKED:
      handleMeetingLocked(header, body);
      break;
    case messages.USER_JOINED:
      handleUserJoined(header, body);
      break;
    case messages.USER_LEFT:
      handleUserLeft(header, body);
      break;
    case messages.USER_UPDATED:
      handleUserUpdated(header, body);
      break;
    case messages.USER_LOCKED:
      handleUserLocked(header, body);
      break;
    case messages.PAD_CREATED:
      handlePadCreated(header, body);
      break;
    case messages.PAD_UPDATED:
      handlePadUpdated(header, body);
      break;
    default:
  }
};

module.exports = {
  handle,
};
