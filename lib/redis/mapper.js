const {
  ids,
  roles,
} = require('../utils/constants');
const Logger = require('../utils/logger');

const logger = new Logger('mapper');

const mapper = {
  users: {},
  pads: {},
};

const getUser = (authorId) => mapper.users[authorId];

const getPad = (padId) => mapper.pads[padId];

const createUser = (meetingId, userId, authorId) => {
  logger.debug(ids.USER, 'created', { meetingId, userId, authorId });
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

    logger.debug(ids.USER, 'deleted', { meetingId, userId, authorId });
    delete mapper.users[authorId];
  }
};

const createPad = (meetingId, groupId, padId) => {
  logger.debug(ids.PAD, 'created', { meetingId, groupId, padId });
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

    logger.debug(ids.PAD, 'deleted', { meetingId, groupId, padId });
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
