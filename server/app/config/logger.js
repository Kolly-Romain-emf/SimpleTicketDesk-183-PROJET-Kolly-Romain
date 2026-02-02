import fs from 'fs';
import path from 'path';
import winston from 'winston';

const resolveLogDir = () => {
  if (process.env.LOG_DIR) {
    return process.env.LOG_DIR;
  }

  const parentLogs = path.resolve(process.cwd(), '..', 'logs');
  if (fs.existsSync(parentLogs)) {
    return parentLogs;
  }

  return path.resolve(process.cwd(), 'logs');
};

const logDir = resolveLogDir();
fs.mkdirSync(logDir, { recursive: true });

const logFile = path.join(logDir, 'access.log');

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => (
      `${timestamp} [${level}] ${message}`
    ))
  ),
  transports: [
    new winston.transports.File({ filename: logFile }),
  ],
});
