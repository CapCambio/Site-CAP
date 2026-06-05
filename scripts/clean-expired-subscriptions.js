import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const alertsPath = path.join(__dirname, '../data/alerts.json');

console.log('=== LIMPANDO ASSINATURAS EXPIRADAS ===\n');

const alertsData = fs.readFileSync(alertsPath, 'utf8');
const alerts = JSON.parse(alertsData);

let cleanedCount = 0;

Object.entries(alerts).forEach(([email, userData]) => {
  if (userData.pushSubscriptions && userData.pushSubscriptions.length > 0) {
    console.log(`Usuário: ${email}`);
    console.log(`  Antes: ${userData.pushSubscriptions.length} assinatura(s)`);
    
    // Remove todas as assinaturas (forçar nova inscrição)
    userData.pushSubscriptions = [];
    cleanedCount++;
    
    console.log(`  Depois: ${userData.pushSubscriptions.length} assinatura(s)`);
    console.log('');
  }
});

fs.writeFileSync(alertsPath, JSON.stringify(alerts, null, 2));

console.log(`✅ ${cleanedCount} usuário(s) tiveram suas assinaturas removidas`);
console.log('ℹ️  Os usuários precisam se inscrever novamente no sistema de push');
