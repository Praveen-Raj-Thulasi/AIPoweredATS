import winston from 'winston';
import { config } from '../config';
import { sanitizeLogPayload, sanitizeString } from './privacy-redactor';

// Custom Winston format to scrub all sensitive parameters & PII
const privacyFormat = winston.format((info) => {
  const sanitized = sanitizeLogPayload(info);
  return sanitized;
});

const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const cleanMsg = typeof message === 'string' ? sanitizeString(message) : message;
  let msg = `${timestamp} [${level.toUpperCase()}]: ${cleanMsg}`;
  const cleanMeta = sanitizeLogPayload(metadata);
  if (Object.keys(cleanMeta).length > 0) {
    msg += ` ${JSON.stringify(cleanMeta)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    privacyFormat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'verity-ats-service', environment: config.nodeEnv },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        privacyFormat(),
        logFormat
      ),
    }),
  ],
});

