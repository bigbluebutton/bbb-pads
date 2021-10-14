const config = require('../../config');

const { level } = config.log;
const debug = level.toLowerCase() === 'debug';

const date = () => new Date().toISOString();

const parse = (messages) => {
  return messages.map(message => {
    if (typeof message === 'object') return JSON.stringify(message);

    return message;
  });
};

module.exports = {
  info: (...messages) => {
    console.log(date(), 'INFO\t', ...parse(messages));
  },
  warn: (...messages) => {
    if (debug) {
      console.log(date(), 'WARN\t', ...parse(messages));
    }
  },
  debug: (...messages) => {
    if (debug) {
      console.log(date(), 'DEBUG\t', ...parse(messages));
    }
  },
  error: (...messages) => {
    console.log(date(), 'ERROR\t', ...parse(messages));
  },
};
