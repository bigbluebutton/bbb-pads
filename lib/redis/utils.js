const config = require('../../config');
const logger = require('../utils/logger');

const { settings: redis } = config;

const retry = (options) => {
  if (options.error && options.error.code === 'ECONNREFUSED') {
    logger.error('redis', 'connection refused');

    return new Error('refused');
  }

  if (options.total_retry_time > 1000 * 60 * 60) {
    logger.error('redis', 'retry exhausted');

    return new Error('exhausted');
  }

  if (options.attempt > 10) {
    logger.error('redis', 'attempt limit');

    return undefined;
  }

  return Math.min(options.attempt * 100, 3000);
};

const options = {
  host: settings.host,
  port: settings.port,
  retry_strategy: retry,
};

if (settings.password) {
  options.password = settings.password;
}

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

module.exports {
  messages,
  options,
};
