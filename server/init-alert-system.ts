import { alertSystem } from './alert-system.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Obtém o diretório atual em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garante que o diretório de logs existe
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Inicializa o sistema de alertas
console.log('🔔 Inicializando sistema de alertas...');

// Exporta a instância do sistema de alertas
export { alertSystem };

// Função para verificar se o sistema de alertas está configurado corretamente
export function checkAlertSystemSetup(): boolean {
  try {
    // Verifica se as variáveis de ambiente necessárias estão definidas
    const requiredEnvVars = [
      'EMAIL_USER',
      'EMAIL_PASS',
      'EMAIL_FROM',
      'VAPID_PUBLIC_KEY',
      'VAPID_PRIVATE_KEY',
      'VAPID_SUBJECT'
    ];

    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingVars.length > 0) {
      console.error(`❌ Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
      return false;
    }

    console.log('✅ Sistema de alertas configurado corretamente');
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar configuração do sistema de alertas:', error);
    return false;
  }
}

// Verifica a configuração ao importar este módulo
checkAlertSystemSetup();
