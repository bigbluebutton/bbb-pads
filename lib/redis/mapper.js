const logger = require('../utils/logger');

const mapper = {
  users: {},
  pads: {},
};

const getUser = (authorId) => mapper.users[authorId];

const getPad = (padId) => mapper.pads[padId];

const createUser = (meetingId, userId, authorId) => {
  logger.debug('mapper', 'created', 'user', { meetingId, userId, authorId });
  mapper.users[authorId] = {
    meetingId,
    userId,
  };
};

const deleteUser = (authorId) => {
  const user = getUser(authorId);
  if (user) {
    const {
      meetingId,
      userId,
    } = user;

    logger.debug('mapper', 'deleted', 'user', { meetingId, userId, authorId });
    delete mapper.users[authorId];
  }
};

const createPad = (meetingId, groupId, padId) => {
  logger.debug('mapper', 'created', 'pad', { meetingId, groupId, padId });
  mapper.pads[padId] = {
    meetingId,
    groupId,
  };
};

const deletePad = (padId) => {
  const pad = getPad(padId);
  if (pad) {
    const {
      meetingId,
      groupId,
    } = pad;

    logger.debug('mapper', 'deleted', 'pad', { meetingId, groupId, padId });
    delete mapper.pads[padId];
  }
};

module.exports = {
  createUser,
  getUser,
  deleteUser,
  createPad,
  getPad,
  deletePad,
};
