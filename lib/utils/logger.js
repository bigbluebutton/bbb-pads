const config = require('../../config');

const { level } = config.log;
const debug = level.toLowerCase() === 'debug';

const date = () => new Date().toISOString();

module.exports = {
  info: (...messages) => {
    console.log(date(), 'INFO\t', ...messages);
  },
  warn: (...messages) => {
    if (debug) {
      console.log(date(), 'WARN\t', ...messages);
    }
  },
  debug: (...messages) => {
    if (debug) {
      console.log(date(), 'DEBUG\t', ...messages);
    }
  },
  error: (...messages) => {
    console.log(date(), 'ERROR\t', ...messages);
  },
};
