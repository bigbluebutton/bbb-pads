const logger = require('../utils/logger');

const mapper = {
  users: {},
  pads: {},
};

const getUser = (authorId) => mapper.users[authorId];

const getPad = (padId) => mapper.pads[padId];

const addUser = (meetingId, userId, authorId) => {
  logger.debug('mapper', 'added', 'user', meetingId, userId, authorId);
  mapper.users[authorId] = {
    meetingId,
    userId,
  };
};

const removeUser = (authorId) => {
  const user = getUser(authorId);
  if (user) {
    const {
      meetingId,
      userId,
    } = user;

    logger.debug('mapper', 'removed', 'user', meetingId, userId, authorId);
    delete mapper.users[authorId];
  }
};

const addPad = (meetingId, groupId, padId) => {
  logger.debug('mapper', 'added', 'pad', meetingId, groupId, padId);
  mapper.pads[padId] = {
    meetingId,
    groupId,
  };
};

const removePad = (padId) => {
  const pad = getPad(padId);
  if (pad) {
    const {
      meetingId,
      groupId,
    } = pad;

    logger.debug('mapper', 'removed', 'pad', meetingId, groupId, padId);
    delete mapper.pads[padId];
  }
};

module.exports = {
  addUser,
  getUser,
  removeUser,
  addPad,
  getPad,
  removePad,
};
