const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure the logs directory exists
const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Define log file path
const logFilePath = path.join(logDirectory, 'app.log');

// Create Winston logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({ filename: logFilePath }),
  ],
});

module.exports = logger;
