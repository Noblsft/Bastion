class Logger {
  /**
   * Log an info level message with timestamp
   * @param message - The message to log
   */
  info(message: string): void {
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`);
  }

  /**
   * Log a warning level message with timestamp
   * @param message - The message to log
   */
  warn(message: string): void {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`);
  }

  /**
   * Log an error level message with timestamp
   * @param message - The message to log
   */
  error(message: string): void {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`);
  }
}

export const logger = new Logger();
