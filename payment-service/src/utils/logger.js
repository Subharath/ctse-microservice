/**
 * Logger Utility - Structured Logging
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const getTimestamp = () => new Date().toISOString();

const formatMessage = (level, message, data = null) => {
  let levelColor = colors.reset;
  if (level === 'ERROR') levelColor = colors.red;
  if (level === 'WARN') levelColor = colors.yellow;
  if (level === 'INFO') levelColor = colors.green;
  if (level === 'DEBUG') levelColor = colors.cyan;

  const base = `${getTimestamp()} ${levelColor}[${level}]${colors.reset} ${message}`;
  return data ? `${base} | ${JSON.stringify(data)}` : base;
};

const logger = {
  error: (message, data = null) => console.error(formatMessage('ERROR', message, data)),
  warn: (message, data = null) => console.warn(formatMessage('WARN', message, data)),
  info: (message, data = null) => console.log(formatMessage('INFO', message, data)),
  debug: (message, data = null) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatMessage('DEBUG', message, data));
    }
  }
};

module.exports = logger;
