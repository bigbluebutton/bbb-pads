const config = require('../../config');

const { level } = config.log;
const debug = level.toLowerCase() === 'debug';

const date = () => `\t${new Date().toISOString()}`;

module.exports = {
  info: (...messages) => {
    console.log('INFO', date(), ...messages);
  },
  warn: (...messages) => {
    if (debug) {
      console.log('WARN', date(), ...messages);
    }
  },
  debug: (...messages) => {
    if (debug) {
      console.log('DEBUG', date(), ...messages);
    }
  },
  error: (...messages) => {
    console.log('ERROR', date(), ...messages);
  },
};
