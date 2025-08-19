interface LogContext {
  [key: string]: any;
}

class Logger {
  info(message: string, context?: LogContext) {
    console.log(`[INFO] ${message}`, context ? JSON.stringify(context, null, 2) : '');
  }

  error(message: string, context?: LogContext) {
    console.error(`[ERROR] ${message}`, context ? JSON.stringify(context, null, 2) : '');
  }

  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context, null, 2) : '');
  }

  debug(message: string, context?: LogContext) {
    console.debug(`[DEBUG] ${message}`, context ? JSON.stringify(context, null, 2) : '');
  }
}

export const logger = new Logger();