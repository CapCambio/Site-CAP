// scripts/check-env.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configura caminhos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Variáveis que queremos verificar
const envVars = [
  'NODE_ENV',
  'EMAIL_ENABLED',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_FROM'
];

console.log('🔍 Verificando variáveis de ambiente...\n');

// Exibe o valor de cada variável
envVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName} = ${value} (${typeof value})`);
});

// Verifica se o e-mail está habilitado
console.log('\n🔧 Status do serviço de e-mail:');
if (process.env.EMAIL_ENABLED === 'true') {
  console.log('✅ EMAIL_ENABLED está definido como true');
} else {
  console.log('❌ EMAIL_ENABLED NÃO está definido como true');
  console.log('   Valor atual:', process.env.EMAIL_ENABLED);
}

// Verifica se as credenciais de e-mail estão configuradas
const hasEmailCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS;
console.log('\n🔑 Credenciais de e-mail:', hasEmailCredentials ? '✅ Configuradas' : '❌ Faltando');
if (hasEmailCredentials) {
  console.log('   EMAIL_USER:', process.env.EMAIL_USER);
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '*** (definido)' : '❌ Não definido');
}
