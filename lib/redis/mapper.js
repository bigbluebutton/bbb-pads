const { memory } = require('./utils');
const { ids } = require('../utils/constants');
const Logger = require('../utils/logger');

const logger = new Logger('mapper');

const mapper = {
  users: {},
  pads: {},
};

const getUser = (authorId) => mapper.users[authorId];

const getPad = (padId) => mapper.pads[padId];

const createUser = (meetingId, userId, authorId) => {
  mapper.users[authorId] = {
    meetingId,
    userId,
  };

  logger.trace(ids.USER, 'created', { meetingId, userId, authorId });
};

const deleteUser = (authorId) => {
  const user = getUser(authorId);
  if (user) {
    const {
      meetingId,
      userId,
    } = user;

    delete mapper.users[authorId];
    logger.trace(ids.USER, 'deleted', { meetingId, userId, authorId });
  }
};

const createPad = (meetingId, groupId, padId) => {
  mapper.pads[padId] = {
    meetingId,
    groupId,
  };

  logger.trace(ids.PAD, 'created', { meetingId, groupId, padId });
};

const deletePad = (padId) => {
  const pad = getPad(padId);
  if (pad) {
    const {
      meetingId,
      groupId,
    } = pad;

    delete mapper.pads[padId];
    logger.trace(ids.PAD, 'deleted', { meetingId, groupId, padId });
  }
};

const getSize = () => memory(mapper);

module.exports = {
  getSize,
  createUser,
  getUser,
  deleteUser,
  createPad,
  getPad,
  deletePad,
};
