import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vapidKeys = webpush.generateVAPIDKeys();

const output = `=== Chaves VAPID geradas ===

VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}

Adicione estas chaves ao seu arquivo .env`;

console.log(output);

// Salvar em arquivo temporário
fs.writeFileSync(path.join(__dirname, '../vapid-keys-temp.txt'), output);
