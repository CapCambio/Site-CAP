import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const alertsPath = path.join(__dirname, '../data/alerts.json');

console.log('=== VERIFICANDO ASSINATURAS PUSH ATUAIS ===\n');

const alertsData = fs.readFileSync(alertsPath, 'utf8');
const alerts = JSON.parse(alertsData);

let totalSubscriptions = 0;

Object.entries(alerts).forEach(([email, userData]) => {
  console.log(`Usuário: ${email}`);
  const subs = userData.pushSubscriptions || [];
  console.log(`  Push subscriptions: ${subs.length}`);
  totalSubscriptions += subs.length;
  
  if (subs.length > 0) {
    subs.forEach((sub, i) => {
      console.log(`    Assinatura ${i+1}:`);
      console.log(`      Endpoint: ${sub.endpoint.substring(0, 60)}...`);
      console.log(`      Keys: p256dh=${sub.keys.p256dh.substring(0, 30)}...`);
    });
  }
  console.log('');
});

console.log(`Total de assinaturas: ${totalSubscriptions}`);
