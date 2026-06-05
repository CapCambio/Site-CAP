type LogLevel = 'log' | 'info' | 'warn' | 'error';

export function log(message: string, level: LogLevel = 'info', ...args: any[]) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  switch (level) {
    case 'error':
      console.error(logMessage, ...args);
      break;
    case 'warn':
      console.warn(logMessage, ...args);
      break;
    case 'info':
      console.info(logMessage, ...args);
      break;
    default:
      console.log(logMessage, ...args);
  }
}

export function error(message: string, ...args: any[]) {
  log(message, 'error', ...args);
}

export function warn(message: string, ...args: any[]) {
  log(message, 'warn', ...args);
}

export function info(message: string, ...args: any[]) {
  log(message, 'info', ...args);
}
