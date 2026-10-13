import { writeFileSync, appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Diretório de logs
const LOGS_DIR = join(__dirname, 'logs');

// Garantir que o diretório de logs existe
if (!existsSync(LOGS_DIR)) {
  mkdirSync(LOGS_DIR, { recursive: true });
}

// Tipos de log
type LogLevel = 'info' | 'error' | 'alert' | 'email' | 'push';

// Obter nome do arquivo com data
function getLogFile(level: LogLevel): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return join(LOGS_DIR, `${level}-${date}.log`);
}

// Formatar timestamp
function getTimestamp(): string {
  return new Date().toISOString();
}

// Escrever log em arquivo
function writeLog(level: LogLevel, message: string, data?: any) {
  const timestamp = getTimestamp();
  const logFile = getLogFile(level);
  
  let fullMessage = `[${timestamp}] ${message}`;

  if (data) {
    fullMessage += ` | ${JSON.stringify(data)}`;
  }
  
  fullMessage += '\n';
  
  try {
    appendFileSync(logFile, fullMessage, 'utf8');
  } catch (error) {
    console.error('Erro ao escrever log:', error);
  }
  
  // O arquivo recebe tudo; o stdout só ecoa fora de produção, onde os payloads com e-mail
  // de cliente são úteis no console local. Em produção sobra o level error, que nunca
  // carrega payload de cliente neste app.
  if (level === 'error') {
    console.error(fullMessage.trim());
  } else if (process.env.NODE_ENV === 'development') {
    console.log(fullMessage.trim());
  }
}

// Trilha de diagnóstico com e-mail de cliente: console local apenas.
export const devLog = (...args: unknown[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Funções de log
export const logger = {
  info: (message: string, data?: any) => writeLog('info', message, data),
  error: (message: string, data?: any) => writeLog('error', message, data),
  alert: (message: string, data?: any) => writeLog('alert', message, data),
  email: (message: string, data?: any) => writeLog('email', message, data),
  push: (message: string, data?: any) => writeLog('push', message, data),
  
  // Log específico para disparo de alertas
  alertTriggered: (email: string, currencyCode: string, alertType: string, price: number, variation: number) => {
    writeLog('alert', 'ALERTA DISPARADO', {
      email,
      currencyCode,
      alertType,
      price,
      variation,
      timestamp: getTimestamp()
    });
  },
  
  // Log específico para verificação de cotações
  priceCheck: (currencyCode: string, oldPrice: number, newPrice: number, variation: number) => {
    writeLog('info', 'VERIFICAÇÃO DE COTAÇÃO', {
      currencyCode,
      oldPrice,
      newPrice,
      variation,
      timestamp: getTimestamp()
    });
  },
  
  // Log específico para envio de email
  emailSent: (email: string, subject: string, alertCount: number) => {
    writeLog('email', 'EMAIL ENVIADO', {
      to: email,
      subject,
      alertCount,
      timestamp: getTimestamp()
    });
  },
  
  // Log específico para envio de push
  pushSent: (email: string, endpoint: string, success: boolean, error?: string) => {
    writeLog('push', 'PUSH ENVIADO', {
      email,
      endpoint: endpoint.substring(0, 100) + '...',
      success,
      error,
      timestamp: getTimestamp()
    });
  }
};

export interface PushLogEntry {
  email: string;
  endpoint: string;
  success: boolean;
  error?: string;
  timestamp: string;
}

// Os logs vivem no disco efêmero da instância: refletem apenas o processo atual
export function readPushLogEntries(maxLines: number = 1000): PushLogEntry[] {
  const entries: PushLogEntry[] = [];

  for (const offset of [0, 1]) {
    const file = getLogFileForDay(offset);
    if (!existsSync(file)) continue;

    let lines: string[] = [];
    try {
      lines = readFileSync(file, 'utf8').split('\n');
    } catch {
      continue;
    }

    for (const line of lines) {
      if (!line.includes('PUSH ENVIADO')) continue;
      const jsonStart = line.indexOf('| ');
      if (jsonStart === -1) continue;
      try {
        entries.push(JSON.parse(line.slice(jsonStart + 2)));
      } catch {
        // linha parcialmente escrita
      }
    }
  }

  return entries.slice(-maxLines);
}

function getLogFileForDay(daysAgo: number): string {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return join(LOGS_DIR, `push-${date.toISOString().split('T')[0]}.log`);
}
