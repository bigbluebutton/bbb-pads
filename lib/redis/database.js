const api = require('../etherpad/api');
const logger = require('../utils/logger');

const database = {};

const hasMeeting = (meetingId) => {
  if (database[meetingId]) return true;

  logger.error('database', 'missing', 'meeting', meetingId);

  return false;
};

const hasGroup = (meetingId, groupName) => {
  if (hasMeeting(meetingId)) {
    if (database[meetingId].groups[groupName]) return true;

    logger.error('database', 'missing', 'group', meetingId, groupName);
  }

  return false;
};

const hasUser = (meetingId, userId) => {
  if (hasMeeting(meetingId)) {
    if (database[meetingId].users[userId]) return true;

    logger.error('database', 'missing', 'user', meetingId, userId);
  }

  return false;
};

const addMeeting = ({
  meetingId,
  externalId,
  name,
  locked,
}) => {
  return new Promise((resolve, reject) => {
    if (database[meetingId]) {
      logger.warn('database', 'duplicated', 'meeting', meetingId);

      return reject();
    }

    database[meetingId] = {
      externalId,
      name,
      locked,
      users: {},
      groups: {},
    };

    resolve(database[meetingId]);
  });
};

const addUser = (meetingId, {
  userId,
  externalId,
  name,
  role,
  locked,
}) => {
  return new Promise((resolve, reject) => {
    if (hasMeeting(meetingId)) {
      if (database[meetingId].users[userId]) {
        logger.warn('database', 'duplicated', 'user', meetingId, userId);

        return reject();
      }

      api.call('createAuthor', { name }).then(response => {
        const authorId = response.authorID;
        logger.info('database', 'added', 'user', meetingId, userId, authorId);
        database[meetingId].users[userId] = {
          authorId,
          externalId,
          name,
          role,
          locked,
        };

        resolve(database[meetingId].users[userId]);
      }).catch(() => {
        logger.error('database', 'adding', 'user', meetingId, userId);

        reject();
      });
    } else {
      reject();
    }
  });
};

const addGroup = (meetingId, { name }) => {
  return new Promise((resolve, reject) => {
    if (hasMeeting(meetingId)) {
      if (database[meetingId].groups[name]) {
        logger.warn('database', 'duplicated', 'group', meetingId, name);

        return reject();
      }

      api.call('createGroup').then(response => {
        const groupId = response.groupID;
        logger.info('database', 'added', 'group', meetingId, name, groupId);
        database[meetingId].groups[name] = {
          groupId,
          pads: {},
          sessions: {},
        };

        resolve(database[meetingId].groups[name]);
      }).catch(() => {
        logger.error('database', 'adding', 'group', meetingId, name);

        reject();
      });
    } else {
      reject();
    }
  });
};

const addGroupPad = (meetingId, groupName, { name }) => {
  return new Promise((resolve, reject) => {
    if (hasGroup(meetingId, groupName)) {
      if (database[meetingId].groups[groupName].pads[name]) {
        logger.warn('database', 'duplicated', 'pad', meetingId, name);

        return reject();
      }

      const { groupId } = database[meetingId].groups[groupName];
      api.call('createGroupPad', groupId, name).then(response => {
        const padId = `${groupId}$${name}`;
        logger.info('database', 'added', 'pad', meetingId, name, padId);
        database[meetingId].groups[groupName].pads[name] = {
          padId,
        };

        resolve(database[meetingId].groups[groupName].pads[name]);
      }).catch(() => {
        logger.error('database', 'adding', 'pad', meetingId, name);

        reject();
      });
    } else {
      reject();
    }
  });
};

const addSession = (meetingId, groupName, userId) => {
  return new Promise((resolve, reject) => {
    if (hasGroup(meetingId, groupName) && hasUser(meetingId, userId)) {
      if (database[meetingId].groups[groupName].sessions[userId]) {
        logger.warn('database', 'duplicated', 'session', meetingId, groupName, userId);

        return reject();
      }

      const { groupId } = database[meetingId].groups[groupName];
      const { authorId } = database[meetingId].users[userId];
      api.call('createSession', groupId, authorId, 0).then(response => {
        const sessionId = response.sessionID;
        logger.info('database', 'added', 'session', meetingId, groupName, userId, sessionId);
        database[meetingId].groups[groupName].sessions[userId] = {
          sessionId,
        };

        resolve(database[meetingId].groups[groupName].sessions[userId]);
      }).catch(() => {
        logger.error('database', 'adding', 'session', meetingId, groupName, userId);

        reject();
      });
    } else {
      reject();
    }
  });
};

module.exports = {
  addMeeting,
  addUser,
};
