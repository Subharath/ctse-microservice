/**
 * Logger Utility - Structured Logging
 * Simple console-based logger for development/production
 * Can be extended to integrate winston/bunyan for enterprise use
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
  /**
   * Log error level message
   * Use for: exceptions, service failures, critical issues
   */
  error: (message, data = null) => {
    console.error(formatMessage('ERROR', message, data));
  },

  /**
   * Log warning level message
   * Use for: deprecated features, non-critical issues, recoverable errors
   */
  warn: (message, data = null) => {
    console.warn(formatMessage('WARN', message, data));
  },

  /**
   * Log info level message
   * Use for: significant operations, service startup, important state changes
   */
  info: (message, data = null) => {
    console.log(formatMessage('INFO', message, data));
  },

  /**
   * Log debug level message
   * Use for: detailed diagnostics, variable values, flow tracing
   * Only shown when NODE_ENV !== 'production'
   */
  debug: (message, data = null) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatMessage('DEBUG', message, data));
    }
  }
};

module.exports = logger;
