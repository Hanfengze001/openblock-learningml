const path = require('path');

/**
 * The name of reousce directory.
 * @readonly
 */
const DIRECTORY_NAME = 'learningml';



/**
 * The locale of default.
 * @readonly
 */
const DEFAULT_LOCALE = 'en';

/**
 * Configuration the default host.
 * @readonly
 */
const DEFAULT_HOST = '0.0.0.0';

/**
 * Configuration the default port.
 * @readonly
 */
const DEFAULT_PORT = 20113;

/**
 * Server name, ues in root path.
 * @readonly
 */
const SERVER_NAME = 'openblock-learningml-server';

/**
 * The time interval for retrying to open the port after the port is occupied by another openblock-learningml server.
 * @readonly
 */
const REOPEN_INTERVAL = 1000 * 1;

/**
 * Translate file name.
 * @readonly
 */
const OFFICIAL_TRANSLATIONS_FILE = 'official-locales.json';
const THIRD_PARTY_TRANSLATIONS_FILE = 'third-party-locales.json';

module.exports = {
    DIRECTORY_NAME,
    DEFAULT_ML_PATH,
    DEFAULT_LOCALE,
    DEFAULT_HOST,
    DEFAULT_PORT,
    SERVER_NAME,
    REOPEN_INTERVAL,
    OFFICIAL_TRANSLATIONS_FILE,
    THIRD_PARTY_TRANSLATIONS_FILE,
};
