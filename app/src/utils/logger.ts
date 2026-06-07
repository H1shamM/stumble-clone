// app/src/utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Transport is handled differently in recent pino versions, 
  // but for simplicity, we keep it standard.
  formatters: {
    bindings: (bindings) => {
      return { pid: bindings.pid };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;