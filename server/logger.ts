import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
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
  
  let logMessage = `[${timestamp}] ${message}`;
  
  if (data) {
    logMessage += ` | ${JSON.stringify(data)}`;
  }
  
  logMessage += '\n';
  
  try {
    appendFileSync(logFile, logMessage, 'utf8');
  } catch (error) {
    console.error('Erro ao escrever log:', error);
  }
  
  // Também imprimir no console
  if (level === 'error') {
    console.error(logMessage.trim());
  } else {
    console.log(logMessage.trim());
  }
}

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
