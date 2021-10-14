const database = require('./database');
const { roles } = require('../utils/constants');
const logger = require('../utils/logger');

const events = {
  MEETING_CREATED: 'MeetingCreatedEvtMsg',
  MEETING_ENDED: 'MeetingEndingEvtMsg',
  MEETING_LOCKED: 'LockSettingsInMeetingChangedEvtMsg',
  USER_JOINED: 'UserJoinedMeetingEvtMsg',
  USER_LEFT: 'UserLeftMeetingEvtMsg',
  USER_LOCKED: 'UserLockedInMeetingEvtMsg',
  USER_UPDATED: 'UserRoleChangedEvtMsg',
};

const commands = {
  GROUP_CREATE: 'PadCreateGroupCmdMsg',
  PAD_CREATE: 'PadCreateCmdMsg',
  SESSION_CREATE: 'PadCreateSessionCmdMsg',
};

const systems = {
  PAD_SETTINGS_LOADED :'PadLoadSettingsSysMsg',
  PAD_SHUTDOWN: 'PadShutdownSysMsg',
  PAD_CONFIGURED: 'PadConfigureSysMsg',
  PAD_SERVER_CREATED: 'PadCreateServerSysMsg',
  PAD_SERVER_CLOSED: 'PadCloseServerSysMsg',
  PAD_ACCESS_CHECKED: 'PadAccessCheckSysMsg',
  PAD_CREATED: 'PadCreateSysMsg',
  PAD_LOADED: 'PadLoadSysMsg',
  PAD_UPDATED: 'PadUpdateSysMsg',
  PAD_COPIED: 'PadCopySysMsg',
  PAD_REMOVED: 'PadRemoveSysMsg',
  PAD_USER_LEFT: 'PadUserLeaveSysMsg',
};

const handleMeetingCreated = (header, body) => {
  const { intId: meetingId } = body.props.meetingProp;
  database.addMeeting({
    meetingId,
    locked: body.props.lockSettingsProps.disableNote,
  }).then(response => {
    logger.info('meeting', 'created', meetingId, response);
  }).catch(() => logger.error('meeting', 'creating', meetingId, body));
};

const handleMeetingEnded = (header, body) => {
  const { meetingId } = header;
  database.removeMeeting(meetingId).then(response => {
    logger.info('meeting', 'ended', meetingId);
  }).catch(() => logger.error('meeting', 'ending', meetingId, body));
};

const handleMeetingLocked = (header, body) => {
  const { meetingId } = header;
  const { disableNote: lock } = body;
  if (lock) {
    database.lockMeeting(meetingId).then(response => {
      logger.info('meeting', 'locked', meetingId);
    }).catch(() => logger.error('meeting', 'locking', meetingId, body));
  } else {
    database.unlockMeeting(meetingId).then(response => {
      logger.info('meeting', 'unlocked', meetingId);
    }).catch(() => logger.error('meeting', 'unlocking', meetingId, body));
  }
};

const handleUserJoined = (header, body) => {
  const { meetingId } = header;
  database.addUser(meetingId, {
    userId: body.intId,
    name: body.name,
    role: body.role,
    locked: body.locked,
  }).then(response => {
    logger.info('user', 'joined', meetingId, response);
  }).catch(() => logger.error('user', 'joining', meetingId, body));
};

const handleUserLeft = (header, body) => {
  const { meetingId } = header;
  const { intId: userId } = body;
  database.removeUser(meetingId, { userId }).then(response => {
    logger.info('user', 'left', meetingId, userId);
  }).catch(() => logger.error('user', 'leaving', meetingId, body));
};

const handleUserLocked = (header, body) => {
  const { meetingId } = header;
  const {
    locked: lock,
    userId,
  } = body;

  if (lock) {
    database.lockUser(meetingId, { userId }).then(response => {
      logger.info('user', 'locked', meetingId, userId);
    }).catch(() => logger.error('user', 'locking', meetingId, body));
  } else {
    database.unlockUser(meetingId, { userId }).then(response => {
      logger.info('user', 'unlocked', meetingId);
    }).catch(() => logger.error('user', 'unlocking', meetingId, body));
  }
};

const handleUserUpdated = (header, body) => {
  const { meetingId } = header;
  const {
    role,
    userId,
  } = body;

  const promote = role === roles.MODERATOR;
  if (promote) {
    database.promoteUser(meetingId, { userId }).then(response => {
      logger.info('user', 'promoted', meetingId, userId);
    }).catch(() => logger.error('user', 'promoting', meetingId, body));
  } else {
    database.demoteUser(meetingId, { userId }).then(response => {
      logger.info('user', 'demoted', meetingId);
    }).catch(() => logger.error('user', 'demoting', meetingId, body));
  }
};

const handleGroupCreate = (header, body) => {
  const { meetingId } = header;
  const {
    name,
    type,
  } = body;

  database.addGroup(meetingId, { name, type }).then(response => {
    logger.info('group', 'created', meetingId, name, type);
  }).catch(() => logger.error('group', 'creating', meetingId, body));
};

const handlePadCreate = (header, body) => {
  const { meetingId } = header;
  const {
    groupId,
    name,
  } = body;

  database.addPad(meetingId, groupId, { name }).then(response => {
    logger.info('pad', 'created', meetingId, groupId, name);
  }).catch(() => logger.error('pad', 'creating', meetingId, body));
};

const handleSessionCreate = (header, body) => {
  const { meetingId } = header;
  const {
    groupId,
    userId,
  } = body;

  database.addSession(meetingId, groupId, userId).then(response => {
    logger.info('session', 'created', meetingId, groupId, userId);
  }).catch(() => logger.error('session', 'creating', meetingId, body));
};

const handlePadSettingsLoaded = (header, body) => {
  logger.info('pad', 'settings', 'loaded', body);
};

const handlePadShutdown = (header, body) => {
  logger.info('pad', 'shutdown', body);
};

const handlePadConfigured = (header, body) => {
  logger.info('pad', 'configured', body);
};

const handlePadServerCreated = (header, body) => {
  logger.info('pad', 'server', 'created', body);
};

const handlePadServerClosed = (header, body) => {
  logger.info('pad', 'server', 'closed', body);
};

const handlePadAccessChecked = (header, body) => {
  logger.info('pad', 'access', 'checked', body);
};

const handlePadCreated = (header, body) => {
  logger.info('pad', 'created', body);
};

const handlePadLoaded = (header, body) => {
  logger.info('pad', 'loaded', body);
};

const handlePadUpdated = (header, body) => {
  const { id: padId } = body.pad;
  const {
    author: authorId,
    revs: rev,
    changeset,
  } = body;

  database.updatePad(padId, { authorId, rev, changeset }).then(response => {
    logger.info('pad', 'updated', padId, response);
  }).catch(() => logger.error('pad', 'updating', body));
};

const handlePadCopied = (header, body) => {
  logger.info('pad', 'copied', body);
};

const handlePadRemoved = (header, body) => {
  logger.info('pad', 'removed', body);
};

const handlePadUserLeft = (header, body) => {
  logger.info('pad', 'user', 'left', body);
};

const check = (object, property) => {
  if (object && object.hasOwnProperty(property)) return true;

  logger.warn('check', 'invalid', property, object);

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
    case events.MEETING_CREATED:
      handleMeetingCreated(header, body);
      break;
    case events.MEETING_ENDED:
      handleMeetingEnded(header, body);
      break;
    case events.MEETING_LOCKED:
      handleMeetingLocked(header, body);
      break;
    case events.USER_JOINED:
      handleUserJoined(header, body);
      break;
    case events.USER_LEFT:
      handleUserLeft(header, body);
      break;
    case events.USER_UPDATED:
      handleUserUpdated(header, body);
      break;
    case events.USER_LOCKED:
      handleUserLocked(header, body);
      break;
    case commands.GROUP_CREATE:
      handleGroupCreate(header, body);
      break;
    case commands.PAD_CREATE:
      handlePadCreate(header, body);
      break;
    case commands.SESSION_CREATE:
      handleSessionCreate(header, body);
      break;
    case systems.PAD_SETTINGS_LOADED:
      handlePadSettingsLoaded(header, body);
      break;
    case systems.PAD_SHUTDOWN:
      handlePadShutdown(header, body);
      break;
    case systems.PAD_CONFIGURED:
      handlePadConfigured(header, body);
      break;
    case systems.PAD_SERVER_CREATED:
      handlePadServerCreated(header, body);
      break;
    case systems.PAD_SERVER_CLOSED:
      handlePadServerClosed(header, body);
      break;
    case systems.PAD_ACCESS_CHECKED:
      handlePadAccessChecked(header, body);
      break;
    case systems.PAD_CREATED:
      handlePadCreated(header, body);
      break;
    case systems.PAD_LOADED:
      handlePadLoaded(header, body);
      break;
    case systems.PAD_UPDATED:
      handlePadUpdated(header, body);
      break;
    case systems.PAD_COPIED:
      handlePadCopied(header, body);
      break;
    case systems.PAD_REMOVED:
      handlePadRemoved(header, body);
      break;
    case systems.PAD_USER_LEFT:
      handlePadUserLeft(header, body);
      break;
    default:
  }
};

module.exports = {
  handle,
};
