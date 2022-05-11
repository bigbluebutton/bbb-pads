const _ = require('lodash');
const { diff } = require('@mconf/bbb-diff');
const config = require('../../config');
const mapper = require('./mapper');
const sender = require('./sender');
const { memory } = require('./utils');
const api = require('../etherpad/api');
const {
  ids,
  roles,
} = require('../utils/constants');
const Logger = require('../utils/logger');

const logger = new Logger('database');

const { etherpad: settings } = config;

const MODELS = {
  notes: {
    id: 'notes',
    permission: {
      MODERATOR: true,
      VIEWER: true,
    },
    capacity: 0,
  },
  captions: {
    id: 'captions',
    permission: {
      MODERATOR: true,
      VIEWER: false,
    },
    capacity: 1,
  },
};

const database = {};

const buildExpiration = () => Date.now() + settings.session.ttl;

const findGroup = (meetingId, { externalId, model }) => {
  if (hasMeeting(meetingId)) {
    const groupIds = getGroupIds(meetingId);

    return groupIds.find(groupId => {
      const group = database[meetingId].groups[groupId];

      return group.externalId === externalId && group.model === model;
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

  logger.warn(ids.MEETING, 'missing', { meetingId });

  return false;
};

const hasUser = (meetingId, userId) => {
  if (hasMeeting(meetingId)) {
    if (database[meetingId].users[userId]) return true;

    logger.warn(ids.USER, 'missing', { meetingId, userId });
  }

  return false;
};

const hasGroup = (meetingId, groupId) => {
  if (hasMeeting(meetingId)) {
    if (database[meetingId].groups[groupId]) return true;

    logger.warn(ids.GROUP, 'missing', { meetingId, groupId });
  }

  return false;
};

const hasSession = (meetingId, groupId, userId) => {
  if (hasGroup(meetingId, groupId)) {
    if (database[meetingId].groups[groupId].sessions[userId]) return true;

    logger.warn(ids.SESSION, 'missing', { meetingId, groupId, userId });
  }

  return false;
};

const hasPad = (meetingId, groupId, padId) => {
  if (hasGroup(meetingId, groupId)) {
    if (database[meetingId].groups[groupId].pads[padId]) return true;

    logger.warn(ids.PAD, 'missing', { meetingId, groupId, padId });
  }

  return false;
};

const hasPermission = (meetingId, groupId, userId) => {
  if (hasGroup(meetingId, groupId) && hasUser(meetingId, userId)) {
    const { model } = database[meetingId].groups[groupId];
    const { role } = database[meetingId].users[userId];

    if (MODELS[model].permission[role]) return true;

    logger.warn('permission', 'missing', { meetingId, groupId, userId });
  }

  return false;
};

const hasCapacity = (meetingId, groupId) => {
  if (hasGroup(meetingId, groupId)) {
    const { model } = database[meetingId].groups[groupId];
    const { capacity } = MODELS[model];
    if (capacity === 0) return true;

    const sessions = getSessions(meetingId, groupId);

    if (sessions.length < capacity) return true;

    logger.warn('capacity', 'missing', { meetingId, groupId });
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

const isViewer = (meetingId, userId) => {
  if (hasUser(meetingId, userId)) {
    const { role } = database[meetingId].users[userId];

    return role === roles.VIEWER;
  }

  return false;
};

const areNotes = (meetingId, groupId) => {
  if (hasGroup(meetingId, groupId)) {
    const { model } = database[meetingId].groups[groupId];

    return model === MODELS.notes.id;
  }

  return false;
};

const areCaptions = (meetingId, groupId) => {
  if (hasGroup(meetingId, groupId)) {
    const { model } = database[meetingId].groups[groupId];

    return model === MODELS.captions.id;
  }

  return false;
};

// Remove notes' sessions from locked-viewer-users
const onMeetingLock = (meetingId) => {
  const userIds = getUserIds(meetingId);
  const promises = userIds.reduce((result, userId) => {
    if (isViewer(meetingId, userId) && isUserLocked(meetingId, userId)) {
      const groupIds = getGroupIds(meetingId);
      groupIds.forEach(groupId => {
        if (areNotes(meetingId, groupId)) result.push(deleteSession(meetingId, groupId, userId))
      });
    }

    return result;
  }, []);

  return promises;
};

// Remove notes' sessions from locked-meeting viewer-user
const onUserLock = (meetingId, userId) => {
  if (isMeetingLocked(meetingId) && isViewer(meetingId, userId)) {
    const groupIds = getGroupIds(meetingId);
    const promises = groupIds.reduce((result, groupId) => {
      if (areNotes(meetingId, groupId)) result.push(deleteSession(meetingId, groupId, userId));

      return result;
    }, []);

    return promises;
  }

  return [];
};

// Remove notes' sessions from locked-meeting locked-user
// Remove captions' sessions from user
const onUserDemote = (meetingId, userId) => {
  const meetingLocked = isMeetingLocked(meetingId);
  const userLocked = isUserLocked(meetingId, userId);
  const groupIds = getGroupIds(meetingId);
  const promises = groupIds.reduce((result, groupId) => {
    if (areNotes(meetingId, groupId)) {
      if (meetingLocked && userLocked) {
        result.push(deleteSession(meetingId, groupId, userId));
      }
    } else if (areCaptions(meetingId, groupId)) {
      result.push(deleteSession(meetingId, groupId, userId));
    }

    return result;
  }, []);

  return promises;
};

// Remove the oldests sessions that exceed the group capacity
// Open one empty seat for the next session to be created
const onSessionCreate = (meetingId, groupId) => {
  if (!hasCapacity(meetingId, groupId)) {
    const sessions = getSessions(meetingId, groupId);
    const { model } = database[meetingId].groups[groupId];
    const excess = sessions.length - MODELS[model].capacity + 1;
    sessions.sort((a, b) => {
      const first = database[meetingId].groups[groupId].sessions[a];
      const second = database[meetingId].groups[groupId].sessions[b];

      return first.expiration > second.expiration;
    }).splice(excess);

    const promises = sessions.map(session => deleteSession(meetingId, groupId, session));

    return promises;
  }

  return [];
};

const onPadUpdate = (meetingId, groupId, padId, rev) => {
  if (hasGroup(meetingId, groupId)) {
    api.call('getHTML', { padID: padId, rev }).then(response => {
      const { html } = response;
      const change = diff(database[meetingId].groups[groupId].pads[padId].html, html);
      if (change) {
        database[meetingId].groups[groupId].pads[padId].html = html;
        logger.info(ids.PAD, 'content', { meetingId, groupId, padId, rev, ...change });

        sender.send('padContent', meetingId, { groupId, padId, rev, ...change });
      }
    }).catch(() => logger.error(ids.PAD, 'content', { meetingId, groupId, padId, rev }));
  }
};

const onPadChange = (meetingId, groupId, padId, userId, text) => {
  if (hasGroup(meetingId, groupId) && areCaptions(meetingId, groupId)) {
    const change = diff(database[meetingId].groups[groupId].pads[padId].text, text);
    if (change) {
      database[meetingId].groups[groupId].pads[padId].text = text;
      logger.trace(ids.PAD, 'patch', { meetingId, groupId, padId, userId, ...change });

      sender.send('padPatch', meetingId, { groupId, padId, userId, ...change });
    }
  }
};

const isMeetingLocked = (meetingId) => {
  if (hasMeeting(meetingId)) {
    const { locked } = database[meetingId];

    return locked;
  }

  return true;
};

const isUserLocked = (meetingId, userId) => {
  if (hasUser(meetingId, userId)) {
    const { locked } = database[meetingId].users[userId];

    return locked;
  }

  return true;
};

const createMeeting = ({
  meetingId,
  locked,
}) => {
  return new Promise((resolve, reject) => {
    if (database[meetingId]) {
      logger.warn(ids.MEETING, 'duplicated', { meetingId });

      return reject();
    }

    database[meetingId] = {
      locked,
      users: {},
      groups: {},
    };

    logger.trace(ids.MEETING, 'created', { meetingId });

    resolve(database[meetingId]);
  });
};

const deleteMeeting = (meetingId) => {
  return new Promise((resolve, reject) => {
    if (hasMeeting(meetingId)) {
      const groupIds = getGroupIds(meetingId);
      const promises = groupIds.map(groupId => deleteGroup(meetingId, { groupId }));

      const update = () => {
        const userIds = getUserIds(meetingId);
        userIds.forEach(userId => deleteUser(meetingId, { userId }));
        delete database[meetingId];
        logger.trace(ids.MEETING, 'deleted', { meetingId });

        resolve();
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => {
          logger.error(ids.MEETING, 'deleting', { meetingId });

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
      const promises = onMeetingLock(meetingId);

      const update = () => {
        database[meetingId].locked = true;
        logger.trace(ids.MEETING, 'locked', { meetingId });

        resolve();
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => {
          logger.error(ids.MEETING, 'locking', { meetingId });

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
      database[meetingId].locked = false;
      logger.trace(ids.MEETING, 'unlocked', { meetingId });

      resolve();
    } else {
      reject();
    }
  });
};

const createUser = (meetingId, {
  userId,
  name,
  role,
  locked,
}) => {
  return new Promise((resolve, reject) => {
    if (hasMeeting(meetingId)) {
      if (database[meetingId].users[userId]) {
        logger.warn(ids.USER, 'duplicated', { meetingId, userId });

        return reject();
      }

      api.call('createAuthor', { name }).then(response => {
        const authorId = response.authorID;
        database[meetingId].users[userId] = {
          authorId,
          name,
          role,
          locked,
        };

        logger.trace(ids.USER, 'created', { meetingId, userId, authorId });

        mapper.createUser(meetingId, userId, authorId);

        resolve(database[meetingId].users[userId]);
      }).catch(() => {
        logger.error(ids.USER, 'creating', { meetingId, userId });

        reject();
      });
    } else {
      reject();
    }
  });
};

const deleteUser = (meetingId, { userId }) => {
  return new Promise((resolve, reject) => {
    if (hasUser(meetingId, userId)) {
      const groupIds = getGroupIds(meetingId);
      const promises = groupIds.map(groupId => deleteSession(meetingId, groupId, userId));

      const update = () => {
        const { authorId } = database[meetingId].users[userId];
        mapper.deleteUser(authorId);

        delete database[meetingId].users[userId];
        logger.trace(ids.USER, 'deleted', { meetingId, userId, authorId });

        resolve();
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => {
          logger.error(ids.USER, 'deleting', { meetingId, userId });

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
    if (hasUser(meetingId, userId)) {
      const promises = onUserLock(meetingId, userId);

      const update = () => {
        database[meetingId].users[userId].locked = true;
        logger.trace(ids.USER, 'locked', { meetingId, userId });

        resolve();
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => {
          logger.error(ids.USER, 'locking', { meetingId, userId });

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
      database[meetingId].users[userId].locked = false;
      logger.trace(ids.USER, 'unlocked', { meetingId, userId });

      resolve();
    } else {
      reject();
    }
  });
};

const promoteUser = (meetingId, { userId }) => {
  return new Promise((resolve, reject) => {
    if (hasUser(meetingId, userId)) {
      database[meetingId].users[userId].role = roles.MODERATOR;
      logger.trace(ids.USER, 'promoted', { meetingId, userId });

      resolve();
    } else {
      reject();
    }
  });
};

const demoteUser = (meetingId, { userId }) => {
  return new Promise((resolve, reject) => {
    if (hasUser(meetingId, userId) && isModerator(meetingId, userId)) {
      const promises = onUserDemote(meetingId, userId);

      const update = () => {
        database[meetingId].users[userId].role = roles.VIEWER;
        logger.trace(ids.USER, 'demoted', { meetingId, userId });

        resolve();
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => {
          logger.error(ids.USER, 'demoting', { meetingId, userId });

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

const createGroup = (meetingId, {
  externalId,
  model,
}) => {
  return new Promise((resolve, reject) => {
    if (hasMeeting(meetingId)) {
      if (findGroup(meetingId, { externalId, model })) {
        logger.warn(ids.GROUP, 'duplicated', { meetingId, externalId, model });

        return reject();
      }

      api.call('createGroup').then(response => {
        const groupId = response.groupID;
        database[meetingId].groups[groupId] = {
          externalId,
          model,
          pads: {},
          sessions: {},
        };

        logger.trace(ids.GROUP, 'created', { meetingId, externalId, groupId, model });

        sender.send('groupCreated', meetingId, { externalId, groupId });

        resolve(database[meetingId].groups[groupId]);
      }).catch(() => {
        logger.error(ids.GROUP, 'creating', { meetingId, externalId, model });

        reject();
      });
    } else {
      reject();
    }
  });
};

const deleteGroup = (meetingId, { groupId }) => {
  return new Promise((resolve, reject) => {
    if (hasGroup(meetingId, groupId)) {
      const sessions = getSessions(meetingId, groupId);
      const promises = sessions.map(session => deleteSession(meetingId, groupId, session));

      const update = () => {
        const padIds = getPadIds(meetingId, groupId);
        padIds.forEach(padId => deletePad(meetingId, groupId, padId));
        delete database[meetingId].groups[groupId];
        logger.trace(ids.GROUP, 'deleted', { meetingId, groupId });

        resolve();
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => {
          logger.error(ids.GROUP, 'deleting', { meetingId, groupId });

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

const createPad = (meetingId, groupId, { name }) => {
  return new Promise((resolve, reject) => {
    if (hasGroup(meetingId, groupId)) {
      const padId = `${groupId}$${name}`;
      if (database[meetingId].groups[groupId].pads[padId]) {
        logger.warn(ids.PAD, 'duplicated', { meetingId, padId });

        return reject();
      }

      api.call('createGroupPad', {
        groupID: groupId,
        padName: name,
      }).then(() => {
        database[meetingId].groups[groupId].pads[padId] = {
          text: '',
          html: '',
          change: onPadChange,
          update: _.throttle(onPadUpdate, settings.update.throttle, {
            leading: false,
            trailing: true,
          }),
        };

        logger.trace(ids.PAD, 'created', { meetingId, groupId, padId });

        mapper.createPad(meetingId, groupId, padId);

        sender.send('padCreated', meetingId, { groupId, padId, name });

        resolve(database[meetingId].groups[groupId].pads[padId]);
      }).catch(() => {
        logger.error(ids.PAD, 'creating', { meetingId, padId });

        reject();
      });
    } else {
      reject();
    }
  });
};

const appendText = (meetingId, groupId, { name, text }) => {
  return new Promise((resolve, reject) => {
    if (hasGroup(meetingId, groupId)) {
      const padId = `${groupId}$${name}`;
      if (hasPad(meetingId, groupId, padId)) {
        api.call('appendText', {
          padID: padId,
          text,
        }).then(() => resolve()).catch(() => {
          logger.error(ids.PAD, 'appending', { meetingId, padId });

          reject();
        });
      } else {
        reject();
      }
    }
  });
};

const deletePad = (meetingId, groupId, padId) => {
  if (hasPad(meetingId, groupId, padId)) {
    mapper.deletePad(padId);

    delete database[meetingId].groups[groupId].pads[padId];
    logger.trace(ids.PAD, 'deleted', { meetingId, groupId, padId });
  }
};

const updatePad = (padId, { authorId, rev, changeset, text }) => {
  return new Promise((resolve, reject) => {
    const user = authorId ? mapper.getUser(authorId) : { userId: 'system' };
    const pad = mapper.getPad(padId);
    if (user && pad) {
      const { userId } = user;
      const {
        meetingId,
        groupId,
      } = pad;

      database[meetingId].groups[groupId].pads[padId].change(meetingId, groupId, padId, userId, text);
      database[meetingId].groups[groupId].pads[padId].update(meetingId, groupId, padId, rev);

      sender.send('padUpdated', meetingId, { groupId, padId, userId, rev, changeset });

      resolve(database[meetingId].groups[groupId].pads[padId]);
    } else {
      reject();
    }
  });
};

const createSession = (meetingId, groupId, userId) => {
  return new Promise((resolve, reject) => {
    if (hasPermission(meetingId, groupId, userId)) {
      if (database[meetingId].groups[groupId].sessions[userId]) {
        logger.warn(ids.SESSION, 'duplicated', { meetingId, groupId, userId });

        return reject();
      }

      const promises = onSessionCreate(meetingId, groupId);

      const error = () => {
        logger.error(ids.SESSION, 'creating', { meetingId, groupId, userId });

        reject();
      };

      const update = () => {
        const { authorId } = database[meetingId].users[userId];
        const expiration = buildExpiration();
        api.call('createSession', {
          groupID: groupId,
          authorID: authorId,
          validUntil: expiration,
        }).then(response => {
          const sessionId = response.sessionID;
          database[meetingId].groups[groupId].sessions[userId] = {
            sessionId,
            expiration,
          };

          logger.trace(ids.SESSION, 'created', { meetingId, groupId, userId, sessionId });

          sender.send('sessionCreated', meetingId, { groupId, userId, sessionId });

          resolve(database[meetingId].groups[groupId].sessions[userId]);
        }).catch(() => error());
      };

      if (promises.length !== 0) {
        Promise.all(promises).then(() => update()).catch(() => error());
      } else {
        update();
      }
    } else {
      reject();
    }
  });
};

const deleteSession = (meetingId, groupId, userId) => {
  return new Promise((resolve, reject) => {
    if (hasSession(meetingId, groupId, userId)) {
      const { sessionId } = database[meetingId].groups[groupId].sessions[userId];
      api.call('deleteSession', { sessionID: sessionId }).then(() => {
        delete database[meetingId].groups[groupId].sessions[userId];
        logger.trace(ids.SESSION, 'deleted', { meetingId, groupId, userId, sessionId });

        sender.send('sessionDeleted', meetingId, { groupId, userId, sessionId });

        resolve();
      }).catch(() => {
        logger.error(ids.SESSION, 'deleting', { meetingId, groupId, userId, sessionId });

        reject();
      });
    } else {
      resolve();
    }
  });
};

const getSize = () => memory(database);

module.exports = {
  getSize,
  createMeeting,
  lockMeeting,
  unlockMeeting,
  deleteMeeting,
  createUser,
  deleteUser,
  lockUser,
  unlockUser,
  promoteUser,
  demoteUser,
  createGroup,
  createPad,
  updatePad,
  createSession,
  appendText,
};
