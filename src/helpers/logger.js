
const winston = require('winston');
const { format } = require('logform');

const alignedWithColorsAndTime = format.combine(
  format.colorize(),
  format.timestamp(),
  format.align(),
  format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'verbose',
      format: alignedWithColorsAndTime
    }),
    new winston.transports.File({ level: 'debug', filename: 'combined.log' })
  ]
});

module.exports = logger;
