const database = require('./database');
const {
  ids,
  roles,
} = require('../utils/constants');
const Logger = require('../utils/logger');

const logger = new Logger('handler');

const events = {
  MEETING_CREATED: 'MeetingCreatedEvtMsg',
  MEETING_DELETED: 'MeetingEndingEvtMsg',
  MEETING_LOCKED: 'LockSettingsInMeetingChangedEvtMsg',
  USER_CREATED: 'UserJoinedMeetingEvtMsg',
  USER_DELETED: 'UserLeftMeetingEvtMsg',
  USER_LOCKED: 'UserLockedInMeetingEvtMsg',
  USER_UPDATED: 'UserRoleChangedEvtMsg',
};

const commands = {
  GROUP_CREATE: 'PadCreateGroupCmdMsg',
  PAD_CREATE: 'PadCreateCmdMsg',
  PAD_UPDATE: 'PadUpdateCmdMsg',
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
  database.createMeeting({
    meetingId,
    locked: body.props.lockSettingsProps.disableNotes,
  }).then(() => {
    logger.info(ids.MEETING, 'created',{ meetingId });
  }).catch(() => logger.error(ids.MEETING, 'creating', { meetingId, body }));
};

const handleMeetingDeleted = (header, body) => {
  const { meetingId } = header;
  database.deleteMeeting(meetingId).then(() => {
    logger.info(ids.MEETING, 'ended', { meetingId });
  }).catch(() => logger.error(ids.MEETING, 'ending', { meetingId, body }));
};

const handleMeetingLocked = (header, body) => {
  const { meetingId } = header;
  const { disableNotes: lock } = body;
  if (lock) {
    database.lockMeeting(meetingId).then(() => {
      logger.info(ids.MEETING, 'locked', { meetingId });
    }).catch(() => logger.error(ids.MEETING, 'locking', { meetingId, body }));
  } else {
    database.unlockMeeting(meetingId).then(() => {
      logger.info(ids.MEETING, 'unlocked', { meetingId });
    }).catch(() => logger.error(ids.MEETING, 'unlocking', { meetingId, body }));
  }
};

const handleUserCreated = (header, body) => {
  const { meetingId } = header;
  database.createUser(meetingId, {
    userId: body.intId,
    name: body.name,
    role: body.role,
    locked: body.locked,
  }).then(() => {
    logger.info(ids.USER, 'created', { meetingId, userId: body.intId });
  }).catch(() => logger.error(ids.USER, 'creating', { meetingId, body }));
};

const handleUserDeleted = (header, body) => {
  const { meetingId } = header;
  const { intId: userId } = body;
  database.deleteUser(meetingId, { userId }).then(() => {
    logger.info(ids.USER, 'deleted', { meetingId, userId });
  }).catch(() => logger.error(ids.USER, 'deleting', { meetingId, body }));
};

const handleUserLocked = (header, body) => {
  const { meetingId } = header;
  const {
    locked: lock,
    userId,
  } = body;

  if (lock) {
    database.lockUser(meetingId, { userId }).then(() => {
      logger.info(ids.USER, 'locked', { meetingId, userId });
    }).catch(() => logger.error(ids.USER, 'locking', { meetingId, body }));
  } else {
    database.unlockUser(meetingId, { userId }).then(() => {
      logger.info(ids.USER, 'unlocked', { meetingId, userId });
    }).catch(() => logger.error(ids.USER, 'unlocking', { meetingId, body }));
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
    database.promoteUser(meetingId, { userId }).then(() => {
      logger.info(ids.USER, 'promoted', { meetingId, userId });
    }).catch(() => logger.error(ids.USER, 'promoting', { meetingId, body }));
  } else {
    database.demoteUser(meetingId, { userId }).then(() => {
      logger.info(ids.USER, 'demoted', { meetingId, userId });
    }).catch(() => logger.error(ids.USER, 'demoting', { meetingId, body }));
  }
};

const handleGroupCreate = (header, body) => {
  const { meetingId } = header;
  const {
    externalId,
    model,
  } = body;

  database.createGroup(meetingId, { externalId, model }).then(() => {
    logger.info(ids.GROUP, 'created', { meetingId, externalId, model });
  }).catch(() => logger.error(ids.GROUP, 'creating', { meetingId, body }));
};

const handlePadCreate = (header, body) => {
  const { meetingId } = header;
  const {
    groupId,
    name,
  } = body;

  database.createPad(meetingId, groupId, { name }).then(() => {
    logger.info(ids.PAD, 'created', { meetingId, groupId, name });
  }).catch(() => logger.error(ids.PAD, 'creating', { meetingId, body }));
};

const handlePadUpdate = (header, body) => {
  const { meetingId } = header;
  const {
    groupId,
    name,
    text,
  } = body;

  database.appendText(meetingId, groupId, { name, text }).then(() => {
    logger.info(ids.PAD, 'appended', { meetingId, groupId, name, text });
  }).catch(() => logger.error(ids.PAD, 'appending', { meetingId, body }));
};

const handleSessionCreate = (header, body) => {
  const { meetingId } = header;
  const {
    groupId,
    userId,
  } = body;

  database.createSession(meetingId, groupId, userId).then(() => {
    logger.info(ids.SESSION, 'created', { meetingId, groupId, userId });
  }).catch(() => logger.error(ids.SESSION, 'creating', { meetingId, body }));
};

const handlePadSettingsLoaded = (header, body) => {
  logger.debug(ids.PAD, 'settings loaded', { body });
};

const handlePadShutdown = (header, body) => {
  logger.debug(ids.PAD, 'shutdown', { body });
};

const handlePadConfigured = (header, body) => {
  logger.debug(ids.PAD, 'configured', { body });
};

const handlePadServerCreated = (header, body) => {
  logger.debug(ids.PAD, 'server created', { body });
};

const handlePadServerClosed = (header, body) => {
  logger.debug(ids.PAD, 'server closed', { body });
};

const handlePadAccessChecked = (header, body) => {
  logger.debug(ids.PAD, 'access checked', { body });
};

const handlePadCreated = (header, body) => {
  logger.debug(ids.PAD, 'created', { body });
};

const handlePadLoaded = (header, body) => {
  logger.debug(ids.PAD, 'loaded', { body });
};

const handlePadUpdated = (header, body) => {
  const {
    author: authorId,
    revs: rev,
    changeset,
    pad,
  } = body;

  const {
    atext,
    id: padId,
  } = pad;

  // Clear Etherpad's "\n" insertion
  const text = atext.text.endsWith('\n') ? atext.text.slice(0, -1) : atext.text;

  database.updatePad(padId, { authorId, rev, changeset, text }).then(() => {
    logger.debug(ids.PAD, 'updated', { padId, authorId, rev, changeset, text });
  }).catch(() => logger.error(ids.PAD, 'updating', { body }));
};

const handlePadCopied = (header, body) => {
  logger.debug(ids.PAD, 'copied', { body });
};

const handlePadRemoved = (header, body) => {
  logger.debug(ids.PAD, 'removed', { body });
};

const handlePadUserLeft = (header, body) => {
  logger.debug(ids.PAD, 'user left', { body });
};

const check = (object, property) => {
  if (Object.prototype.hasOwnProperty.call(object, property)) return true;

  logger.warn('check invalid', { property, object });

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
    case events.MEETING_DELETED:
      handleMeetingDeleted(header, body);
      break;
    case events.MEETING_LOCKED:
      handleMeetingLocked(header, body);
      break;
    case events.USER_CREATED:
      handleUserCreated(header, body);
      break;
    case events.USER_DELETED:
      handleUserDeleted(header, body);
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
    case commands.PAD_UPDATE:
      handlePadUpdate(header, body);
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
