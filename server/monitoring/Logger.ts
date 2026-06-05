/**
 * Sistema de logging estruturado
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  module?: string;
  metadata?: Record<string, any>;
  error?: Error;
  duration?: number;
  userId?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {
    // Define nível baseado em ambiente
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLog(entry: LogEntry): string {
    const levelStr = LogLevel[entry.level];
    const moduleStr = entry.module ? `[${entry.module}]` : '';
    const userStr = entry.userId ? `[user:${entry.userId}]` : '';
    const durationStr = entry.duration ? ` (${entry.duration}ms)` : '';
    
    let message = `${entry.timestamp} ${levelStr}${moduleStr}${userStr} ${entry.message}${durationStr}`;
    
    if (entry.metadata) {
      message += ` ${JSON.stringify(entry.metadata)}`;
    }
    
    if (entry.error) {
      message += `\nError: ${entry.error.stack}`;
    }
    
    return message;
  }

  private addLog(entry: LogEntry): void {
    // Adiciona ao array
    this.logs.push(entry);
    
    // Limita tamanho do array
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Output para console
    const formatted = this.formatLog(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.log(formatted);
        break;
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
    }
  }

  error(message: string, module?: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      module,
      metadata,
      error
    });
  }

  warn(message: string, module?: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      module,
      metadata
    });
  }

  info(message: string, module?: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      module,
      metadata
    });
  }

  debug(message: string, module?: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      module,
      metadata
    });
  }

  // Timer para medir performance
  startTimer(message: string, module?: string): () => void {
    const start = Date.now();
    
    return () => {
      const duration = Date.now() - start;
      this.addLog({
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message: `${message} completed`,
        module,
        duration
      });
    };
  }

  // Log com usuário
  userLog(message: string, level: LogLevel, userId: string, module?: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;
    
    this.addLog({
      timestamp: new Date().toISOString(),
      level,
      message,
      module,
      metadata,
      userId
    });
  }

  // Obter logs recentes
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Obter logs por nível
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Obter logs por módulo
  getLogsByModule(module: string): LogEntry[] {
    return this.logs.filter(log => log.module === module);
  }

  // Limpar logs
  clearLogs(): void {
    this.logs = [];
  }

  // Obter estatísticas
  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    byModule: Record<string, number>;
    recent: LogEntry[];
  } {
    const byLevel: Record<string, number> = {};
    const byModule: Record<string, number> = {};
    
    this.logs.forEach(log => {
      const levelName = LogLevel[log.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;
      
      if (log.module) {
        byModule[log.module] = (byModule[log.module] || 0) + 1;
      }
    });
    
    return {
      total: this.logs.length,
      byLevel,
      byModule,
      recent: this.getRecentLogs(50)
    };
  }
}

// Export instância única
export const logger = Logger.getInstance();
