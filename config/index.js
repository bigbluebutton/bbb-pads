const fs = require('node:fs');
const _ = require('lodash');

const DEFAULT_SETTINGS_FILE_PATH = './settings.json';
const LOCAL_SETTINGS_FILE_PATH = '/etc/bigbluebutton/bbb-pads.json';

const localSettingsExists = () => {
	try {
		fs.accessSync(LOCAL_SETTINGS_FILE_PATH);
	} catch (err) {
		return false;
	}
	return true;
};

const SETTINGS = require(DEFAULT_SETTINGS_FILE_PATH);

if (localSettingsExists()) {
    const LOCAL_SETTINGS = require(LOCAL_SETTINGS_FILE_PATH);
    _.mergeWith(SETTINGS, LOCAL_SETTINGS, (a, b) => (_.isArray(b) ? b : undefined));
}

const config = SETTINGS;

module.exports = config;

