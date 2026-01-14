/**
 * Simple logger utility following the logging strategy from KEY_DETAILS
 * Log levels: DEBUG, INFO, WARN, ERROR
 */

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const logLevelMap = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLogLevel =
  logLevelMap[
    (process.env.LOG_LEVEL?.toUpperCase() as LogLevel) || "INFO"
  ] || logLevelMap.INFO;

const shouldLog = (level: LogLevel): boolean => {
  return logLevelMap[level] >= currentLogLevel;
};

const formatLog = (level: LogLevel, message: string, data?: unknown): string => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  return `[${timestamp}] [${level}] ${message}${dataStr}`;
};

export const logger = {
  debug: (message: string, data?: unknown) => {
    if (shouldLog("DEBUG")) {
      console.debug(formatLog("DEBUG", message, data));
    }
  },

  info: (message: string, data?: unknown) => {
    if (shouldLog("INFO")) {
      console.info(formatLog("INFO", message, data));
    }
  },

  warn: (message: string, data?: unknown) => {
    if (shouldLog("WARN")) {
      console.warn(formatLog("WARN", message, data));
    }
  },

  error: (message: string, data?: unknown) => {
    if (shouldLog("ERROR")) {
      console.error(formatLog("ERROR", message, data));
    }
  },
};
