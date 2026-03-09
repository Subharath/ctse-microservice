/**
 * Logger Utility - Structured Logging
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level, message, data = null) => {
  const timestamp = getTimestamp();
  let levelColor = colors.reset;
  
  switch(level) {
    case 'ERROR':
      levelColor = colors.red;
      break;
    case 'WARN':
      levelColor = colors.yellow;
      break;
    case 'INFO':
      levelColor = colors.green;
      break;
    case 'DEBUG':
      levelColor = colors.cyan;
      break;
  }

  const levelStr = `${levelColor}[${level}]${colors.reset}`;
  const logMessage = `${timestamp} ${levelStr} ${message}`;

  if (data) {
    return `${logMessage} | ${JSON.stringify(data)}`;
  }
  
  return logMessage;
};

const logger = {
  error: (message, data = null) => {
    console.error(formatMessage('ERROR', message, data));
  },

  warn: (message, data = null) => {
    console.warn(formatMessage('WARN', message, data));
  },

  info: (message, data = null) => {
    console.log(formatMessage('INFO', message, data));
  },

  debug: (message, data = null) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatMessage('DEBUG', message, data));
    }
  }
};

module.exports = logger;
