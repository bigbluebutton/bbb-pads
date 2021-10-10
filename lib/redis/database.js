const api = require('../etherpad/api');
const logger = require('../utils/logger');

const database = {};

const getGroupNames = (meetingId) => {
  if (hasMeeting(meetingId)) return Object.keys(database[meetingId].groups);

  return [];
};

const getGroupSessions = (meetingId, groupName) => {
  if (hasGroup(meetingId, groupName)) return Object.keys(database[meetingId].groups[groupName].sessions);

  return [];
};

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

const hasSession = (meetingId, groupName, userId) => {
  if (hasMeeting(meetingId) && hasGroup(meetingId, groupName)) {
    if (database[meetingId].groups[groupName].sessions[userId]) return true;

    logger.error('database', 'missing', 'session', meetingId, groupName, userId);
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

const removeMeeting = (meetingId) => {
  return new Promise((resolve, reject) => {
    if (hasMeeting(meetingId)) {
      const groupNames = getGroupNames(meetingId);
      const promises = groupNames.map(groupName => removeGroup(meetingId, { name: groupName }));

      Promise.all(promises).then(responses => {
        logger.debug('database', 'removed', 'meeting', meetingId);
        delete database[meetingId];

        resolve();
      }).catch(() => {
        logger.error('database', 'removing', 'meeting', meetingId);

        reject();
      });
    } else {
      resolve();
    }
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
        logger.debug('database', 'added', 'user', meetingId, userId, authorId);
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

const removeUser = (meetingId, { userId }) => {
  return new Promise((resolve, reject) => {
    if (hasUser(meetingId, userId)) {
      const groupNames = getGroupNames(meetingId);
      const promises = groupNames.map(groupName => removeSession(meetingId, groupName, userId));

      Promise.all(promises).then(responses => {
        logger.debug('database', 'removed', 'user', meetingId, userId);
        delete database[meetingId].users[userId];

        resolve();
      }).catch(() => {
        logger.error('database', 'removing', 'user', meetingId, userId);

        reject();
      });
    } else {
      resolve();
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
        logger.debug('database', 'added', 'group', meetingId, name, groupId);
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

const removeGroup = (meetingId, { name }) => {
  return new Promise((resolve, reject) => {
    if (hasGroup(meetingId, name)) {
      const groupSessions = getGroupSessions(meetingId, name);
      const promises = groupSessions.map(groupSession => removeSession(meetingId, name, groupSession));

      Promise.all(promises).then(responses => {
        logger.debug('database', 'removed', 'group', meetingId, name);
        delete database[meetingId].groups[name];

        resolve();
      }).catch(() => {
        logger.error('database', 'removing', 'group', meetingId, name);

        reject();
      });
    } else {
      resolve();
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
        logger.debug('database', 'added', 'pad', meetingId, name, padId);
        database[meetingId].groups[groupName].pads[name] = { padId };

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
        logger.debug('database', 'added', 'session', meetingId, groupName, userId, sessionId);
        database[meetingId].groups[groupName].sessions[userId] = { sessionId };

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

const removeSession = (meetingId, groupName, userId) => {
  return new Promise((resolve, reject) => {
    if (hasSession(meetingId, groupName, userId)) {
      const sessionId = database[meetingId].groups[groupName].sessions[userId];
      api.call('removeSession', { sessionID: sessionId }).then(response => {
        logger.debug('database', 'removed', 'session', meetingId, groupName, userId);
        delete database[meetingId].groups[groupName].session[userId];

        resolve();
      }).catch(() => {
        logger.error('database', 'removing', 'session', meetingId, groupName, userId);

        reject();
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  addMeeting,
  addUser,
  removeUser,
};
