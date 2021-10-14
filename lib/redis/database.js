const mapper = require('./mapper');
const sender = require('./sender');
const api = require('../etherpad/api');
const { roles } = require('../utils/constants');
const logger = require('../utils/logger');

const types = {
  notes: {
    permissions: {
      MODERATOR: true,
      VIEWER: true,
    },
    sessions: 0,
  },
  captions: {
    permissions: {
      MODERATOR: true,
      VIEWER: false,
    },
    sessions: 1,
  },
};

const database = {};

const findGroup = (meetingId, { name, type }) => {
  if (hasMeeting(meetingId)) {
    const groupIds = getGroupIds(meetingId);

    return groupIds.find(groupId => {
      const group = database[meetingId].groups[groupId];

      return group.name === name && group.type === type;
    });
  }

  return null;
};

const getUserIds = (meetingId) => {
  if (hasMeeting(meetingId)) return Object.keys(database[meetingId].users);

  return [];
};

const getGroupIds = (meetingId) => {
  if (hasMeeting(meetingId)) return Object.keys(database[meetingId].groups);

  return [];
};

const getSessions = (meetingId, groupId) => {
  if (hasGroup(meetingId, groupId)) return Object.keys(database[meetingId].groups[groupId].sessions);

  return [];
};

const getPadIds = (meetingId, groupId) => {
  if (hasGroup(meetingId, groupId)) return Object.keys(database[meetingId].groups[groupId].pads);

  return [];
};

const hasMeeting = (meetingId) => {
  if (database[meetingId]) return true;

  logger.warn('database', 'missing', 'meeting', { meetingId });

  return false;
};

const hasUser = (meetingId, userId) => {
  if (hasMeeting(meetingId)) {
    if (database[meetingId].users[userId]) return true;

    logger.warn('database', 'missing', 'user', { meetingId, userId });
  }

  return false;
};

const hasGroup = (meetingId, groupId) => {
  if (hasMeeting(meetingId)) {
    if (database[meetingId].groups[groupId]) return true;

    logger.warn('database', 'missing', 'group', { meetingId, groupId });
  }

  return false;
};

const hasSession = (meetingId, groupId, userId) => {
  if (hasGroup(meetingId, groupId)) {
    if (database[meetingId].groups[groupId].sessions[userId]) return true;

    logger.warn('database', 'missing', 'session', { meetingId, groupId, userId });
  }

  return false;
};

const hasPad = (meetingId, groupId, padId) => {
  if (hasGroup(meetingId, groupId)) {
    if (database[meetingId].groups[groupId].pads[padId]) return true;

    logger.warn('database', 'missing', 'pad', { meetingId, groupId, padId });
  }

  return false;
};

const hasPermission = (meetingId, groupId, userId) => {
  if (hasGroup(meetingId, groupId) && hasUser(meetingId, userId)) {
    const { type } = database[meetingId].groups[groupId];
    const { role } = database[meetingId].users[userId];

    if (types[type].permissions[role]) return true;

    logger.warn('database', 'missing', 'permission', { meetingId, groupId, userId });
  }

  return false;
};

const isModerator = (meetingId, userId) => {
  if (hasUser(meetingId, userId)) {
    const { role } = database[meetingId].users[userId];

    return role === roles.MODERATOR;
  }

  return false;
};

const addMeeting = ({
  meetingId,
  locked,
}) => {
  return new Promise((resolve, reject) => {
    if (database[meetingId]) {
      logger.warn('database', 'duplicated', 'meeting', { meetingId });

      return reject();
    }
    logger.debug('database', 'added', 'meeting', { meetingId });

    database[meetingId] = {
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
      const groupIds = getGroupIds(meetingId);
      const promises = groupIds.map(groupId => removeGroup(meetingId, { groupId }));

      const update = () => {
        const userIds = getUserIds(meetingId);
        userIds.forEach(userId => removeUser(meetingId, { userId }));
        logger.debug('database', 'removed', 'meeting', { meetingId });
        delete database[meetingId];

        resolve();
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => {
          logger.error('database', 'removing', 'meeting', { meetingId });

          reject();
        });
      } else {
        update();
      }
    } else {
      resolve();
    }
  });
};

const lockMeeting = (meetingId) => {
  return new Promise((resolve, reject) => {
    if (hasMeeting(meetingId)) {
      const userIds = getUserIds(meetingId);
      const promises = userIds.map(userId => lockUser(meetingId, { userId }));

      const update = () => {
        logger.debug('database', 'locked', 'meeting', { meetingId });
        database[meetingId].locked = true;

        resolve();
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => {
          logger.error('database', 'locking', 'meeting', { meetingId });

          reject();
        });
      } else {
        update();
      }
    } else {
      resolve();
    }
  });
};

const unlockMeeting = (meetingId) => {
  return new Promise((resolve, reject) => {
    if (hasMeeting(meetingId)) {
      logger.debug('database', 'unlocked', 'meeting', { meetingId });
      database[meetingId].locked = false;

      resolve();
    } else {
      resolve();
    }
  });
};

const addUser = (meetingId, {
  userId,
  name,
  role,
  locked,
}) => {
  return new Promise((resolve, reject) => {
    if (hasMeeting(meetingId)) {
      if (database[meetingId].users[userId]) {
        logger.warn('database', 'duplicated', 'user', { meetingId, userId });

        return reject();
      }

      api.call('createAuthor', { name }).then(response => {
        const authorId = response.authorID;
        logger.debug('database', 'added', 'user', { meetingId, userId, authorId });
        database[meetingId].users[userId] = {
          authorId,
          name,
          role,
          locked,
        };

        mapper.addUser(meetingId, userId, authorId);

        resolve(database[meetingId].users[userId]);
      }).catch(() => {
        logger.error('database', 'adding', 'user', { meetingId, userId });

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
      const groupIds = getGroupIds(meetingId);
      const promises = groupIds.map(groupId => removeSession(meetingId, groupId, userId));

      const update = () => {
        const { authorId } = database[meetingId].users[userId];
        mapper.removeUser(authorId);

        logger.debug('database', 'removed', 'user', { meetingId, userId, authorId });
        delete database[meetingId].users[userId];

        resolve();
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => {
          logger.error('database', 'removing', 'user', { meetingId, userId });

          reject();
        });
      } else {
        update();
      }
    } else {
      resolve();
    }
  });
};

const lockUser = (meetingId, { userId }) => {
  return new Promise((resolve, reject) => {
    if (hasUser(meetingId, userId) && !isModerator(meetingId, userId)) {
      const groupIds = getGroupIds(meetingId);
      const promises = groupIds.map(groupId => removeSession(meetingId, groupId, userId));

      const update = () => {
        logger.debug('database', 'locked', 'user', { meetingId, userId });
        database[meetingId].users[userId].locked = true;

        resolve();
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => {
          logger.error('database', 'locking', 'user', { meetingId, userId });

          reject();
        });
      } else {
        update();
      }
    } else {
      resolve();
    }
  });
};

const unlockUser = (meetingId, { userId }) => {
  return new Promise((resolve, reject) => {
    if (hasUser(meetingId, userId)) {
      logger.debug('database', 'unlocked', 'user', { meetingId, userId });
      database[meetingId].users[userId].locked = false;

      resolve();
    } else {
      resolve();
    }
  });
};

const promoteUser = (meetingId, { userId }) => {
  return new Promise((resolve, reject) => {
    if (hasUser(meetingId, userId)) {
      logger.debug('database', 'promoted', 'user', { meetingId, userId });
      database[meetingId].users[userId].role = roles.MODERATOR;

      resolve();
    } else {
      resolve();
    }
  });
};

const demoteUser = (meetingId, { userId }) => {
  return new Promise((resolve, reject) => {
    if (hasUser(meetingId, userId) && isModerator(meetingId, userId)) {
      const groupIds = getGroupIds(meetingId);
      const promises = groupIds.map(groupId => removeSession(meetingId, groupId, userId));

      const update = () => {
        logger.debug('database', 'demoted', 'user', { meetingId, userId });
        database[meetingId].users[userId].role = roles.VIEWER;

        resolve();
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => {
          logger.error('database', 'demoting', 'user', { meetingId, userId });

          reject();
        });
      } else {
        update();
      }
    } else {
      resolve();
    }
  });
};

const addGroup = (meetingId, {
  name,
  type,
}) => {
  return new Promise((resolve, reject) => {
    if (hasMeeting(meetingId)) {
      if (findGroup(meetingId, { name, type })) {
        logger.warn('database', 'duplicated', 'group', { meetingId, name, type });

        return reject();
      }

      api.call('createGroup').then(response => {
        const groupId = response.groupID;
        logger.debug('database', 'added', 'group', { meetingId, groupId, name, type });
        database[meetingId].groups[groupId] = {
          name,
          type,
          pads: {},
          sessions: {},
        };

        sender.send('groupAdded', meetingId, { groupId, name, type });

        resolve(database[meetingId].groups[groupId]);
      }).catch(() => {
        logger.error('database', 'adding', 'group', { meetingId, name, type });

        reject();
      });
    } else {
      reject();
    }
  });
};

const removeGroup = (meetingId, { groupId }) => {
  return new Promise((resolve, reject) => {
    if (hasGroup(meetingId, groupId)) {
      const sessions = getSessions(meetingId, groupId);
      const promises = sessions.map(session => removeSession(meetingId, groupId, session));

      const update = () => {
        const padIds = getPadIds(meetingId, groupId);
        padIds.forEach(padId => removePad(meetingId, groupId, padId));
        logger.debug('database', 'removed', 'group', { meetingId, groupId });
        delete database[meetingId].groups[groupId];

        resolve();
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => {
          logger.error('database', 'removing', 'group', { meetingId, groupId });

          reject();
        });
      } else {
        update();
      }
    } else {
      resolve();
    }
  });
};

const addPad = (meetingId, groupId, { name }) => {
  return new Promise((resolve, reject) => {
    if (hasGroup(meetingId, groupId)) {
      const padId = `${groupId}$${name}`;
      if (database[meetingId].groups[groupId].pads[padId]) {
        logger.warn('database', 'duplicated', 'pad', { meetingId, padId });

        return reject();
      }

      api.call('createGroupPad', groupId, name).then(response => {
        logger.debug('database', 'added', 'pad', { meetingId, groupId, padId });
        database[meetingId].groups[groupId].pads[padId] = { name };

        mapper.addPad(meetingId, groupId, padId);

        sender.send('padAdded', meetingId, { groupId, padId });

        resolve(database[meetingId].groups[groupId].pads[padId]);
      }).catch(() => {
        logger.error('database', 'adding', 'pad', { meetingId, padId });

        reject();
      });
    } else {
      reject();
    }
  });
};

const removePad = (meetingId, groupId, padId) => {
  if (hasPad(meetingId, groupId, padId)) {
    mapper.removePad(padId);

    logger.debug('database', 'removed', 'pad', { meetingId, groupId, padId });
    delete database[meetingId].users[userId];
  }
};

const updatePad = (padId, { authorId, rev, changeset }) => {
  return new Promise((resolve, reject) => {
    const pad = mapper.getPad(padId);
    const user = mapper.getUser(authorId);
    if (pad && user) {
      const {
        meetingId,
        groupId,
      } = pad;

      const { userId } = user;
      database[meetingId].groups[groupId].pads[padId].last = {
        userId,
        rev,
        changeset,
      };

      sender.send('padUpdated', meetingId, { padId, userId, rev, changeset });

      resolve(database[meetingId].groups[groupId].pads[padId]);
    } else {
      reject();
    }
  });
};

const addSession = (meetingId, groupId, userId) => {
  return new Promise((resolve, reject) => {
    if (hasPermission(meetingId, groupId, userId)) {
      if (database[meetingId].groups[groupId].sessions[userId]) {
        logger.warn('database', 'duplicated', 'session', { meetingId, groupId, userId });

        return reject();
      }

      const { authorId } = database[meetingId].users[userId];
      api.call('createSession', groupId, authorId, 0).then(response => {
        const sessionId = response.sessionID;
        logger.debug('database', 'added', 'session', { meetingId, groupId, userId, sessionId });
        database[meetingId].groups[groupId].sessions[userId] = { sessionId };

        sender.send('sessionAdded', meetingId, { groupId, userId, sessionId });

        resolve(database[meetingId].groups[groupId].sessions[userId]);
      }).catch(() => {
        logger.error('database', 'adding', 'session', { meetingId, groupId, userId });

        reject();
      });
    } else {
      reject();
    }
  });
};

const removeSession = (meetingId, groupId, userId) => {
  return new Promise((resolve, reject) => {
    if (hasSession(meetingId, groupId, userId)) {
      const sessionId = database[meetingId].groups[groupId].sessions[userId];
      api.call('removeSession', { sessionID: sessionId }).then(response => {
        logger.debug('database', 'removed', 'session', { meetingId, groupId, userId });
        delete database[meetingId].groups[groupId].session[userId];

        sender.send('sessionRemoved', meetingId, { groupId, userId });

        resolve();
      }).catch(() => {
        logger.error('database', 'removing', 'session', { meetingId, groupId, userId });

        reject();
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  addMeeting,
  lockMeeting,
  unlockMeeting,
  removeMeeting,
  addUser,
  lockUser,
  unlockUser,
  promoteUser,
  demoteUser,
  removeUser,
  updatePad,
};
