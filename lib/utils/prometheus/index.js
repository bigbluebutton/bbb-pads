const config = require('../../../config');
const PrometheusAgent = require('./prometheus-agent.js');
const { Counter } = require('prom-client');
const Logger = require('../logger.js');

const logger = new Logger('prometheus');
const { prometheus = {} } = config;
const PREFIX = 'bbb_pads_';
const PROM_NAMES = {
  ETH_REQS_TOTAL: `${PREFIX}etherpad_requests_total`,
  ETH_REQS_ERRORS: `${PREFIX}etherpad_requests_errors_total`,
}
const {
  enabled: PROM_ENABLED = false,
  host: PROM_HOST = 'localhost',
  port: PROM_PORT = '9003',
  path: PROM_PATH = '/metrics',
  collectDefaultMetrics: COLLECT_DEFAULT_METRICS = false,
  collectCustomMetrics: COLLECT_CUSTOM_METRICS = false,
} = prometheus;
const PADSPrometheusAgent = new PrometheusAgent(PROM_HOST, PROM_PORT, {
  path: PROM_PATH,
  prefix: PREFIX,
  collectDefaultMetrics: COLLECT_DEFAULT_METRICS,
});

let PADS_METRICS;
const _buildDefaultMetrics = () => {
  if (PADS_METRICS == null) {
    PADS_METRICS = {
      [PROM_NAMES.ETH_REQS_TOTAL]: new Counter({
        name: PROM_NAMES.ETH_REQS_TOTAL,
        help: 'Total Etherpad API requests',
        labelNames: ['method'],
      }),
      [PROM_NAMES.ETH_REQS_ERRORS]: new Counter({
        name: PROM_NAMES.ETH_REQS_ERRORS,
        help: 'Total Etherpad API request failures',
        labelNames: ['method'],
      }),
    }
  }

  return PADS_METRICS;
};

const start = () => {
  if (PROM_ENABLED) {
    try {
      if (COLLECT_CUSTOM_METRICS) {
        PADSPrometheusAgent.injectMetrics(_buildDefaultMetrics());
      }

      PADSPrometheusAgent.start();
    } catch (error) {
      logger.error('prometheus-startup', {
        errorCode: error.code, errorMessage: error.message
      });
    }
  }
}

const registerAPIError = (method) => {
  if (method == null) return;
  PADSPrometheusAgent.increment(PROM_NAMES.ETH_REQS_ERRORS, { method });
};

const registerAPICall = (method) => {
  if (method == null) return;
  PADSPrometheusAgent.increment(PROM_NAMES.ETH_REQS_TOTAL, { method });
}

module.exports = {
  start,
  registerAPIError,
  registerAPICall,
};
